import type { APIRoute } from 'astro';
import { admin } from '../../../lib/firebase';
import { checkRateLimit } from '../../../lib/ratelimit';

export const prerender = false; // Must be dynamically rendered

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  try {
    // Rate Limiting Check
    const ip = clientAddress || '127.0.0.1';
    const rateLimit = await checkRateLimit('auth', ip);
    if (!rateLimit.success) {
      return new Response(
        JSON.stringify({ error: 'Too Many Requests', message: 'Demasiadas solicitudes. Por favor, intenta de nuevo más tarde.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { idToken } = await request.json();

    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Missing ID Token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Set session expiration to 5 days
    const expiresIn = 5 * 24 * 60 * 60 * 1000;

    // Create the session cookie
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

    // Set the cookie
    cookies.set('session_token', sessionCookie, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 5 * 24 * 60 * 60, // 5 days in seconds
    } as any);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error creating session cookie:', error);
    
    // Fallback for development: use the idToken itself as the session cookie if Admin SDK fails
    if (import.meta.env.DEV) {
      console.log('Using ID Token fallback for session cookie in development.');
      const { idToken } = await request.clone().json().catch(() => ({}));
      if (idToken) {
        cookies.set('session_token', idToken, {
          path: '/',
          httpOnly: true,
          secure: false, // Localhost HTTP
          sameSite: 'lax',
          maxAge: 5 * 24 * 60 * 60, // 5 days in seconds
        } as any);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(
      JSON.stringify({ error: 'Unauthorized', message: error.message }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
