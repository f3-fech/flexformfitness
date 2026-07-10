import './lib/env';
import { defineMiddleware } from 'astro:middleware';
import { admin } from './lib/firebase';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);

  // Initialize locals.user to null
  context.locals.user = null;

  // Only parse cookies on dynamic routes (SSR) to avoid Astro request headers warning during static pre-rendering
  const path = url.pathname;
  const cleanPath = path.replace(/^\/(es|en)(?=\/|$)/, '');

  const isSSR = cleanPath.startsWith('/admin') ||
                cleanPath.startsWith('/carrito') ||
                cleanPath.startsWith('/mi-cuenta') ||
                cleanPath.startsWith('/checkout') ||
                cleanPath.startsWith('/api') ||
                cleanPath.startsWith('/_actions') ||
                cleanPath === '/products.json';

  // Retrieve user session cookie
  const sessionCookie = isSSR ? context.cookies.get('session_token')?.value : undefined;
  if (sessionCookie) {
    try {
      const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
      context.locals.user = {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        email_verified: decodedClaims.email_verified,
        name: decodedClaims.name || decodedClaims.email?.split('@')[0] || 'Usuario',
        picture: decodedClaims.picture || undefined,
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        try {
          const payloadPart = sessionCookie.split('.')[1];
          if (payloadPart) {
            const payload = JSON.parse(Buffer.from(payloadPart, 'base64').toString('utf-8'));
            context.locals.user = {
              uid: payload.uid || payload.user_id || 'mock-uid',
              email: payload.email || 'mock@flexform.com',
              email_verified: payload.email_verified ?? true, // assume verified in dev fallback
              name: payload.name || payload.email?.split('@')[0] || 'Usuario Dev',
              picture: payload.picture || undefined,
            };
            console.log(`[Dev Session Fallback] Authenticated user: ${context.locals.user.email}`);
          }
        } catch (devError) {
          console.warn('Session verification failed, deleting cookie:', devError);
          context.cookies.delete('session_token', { path: '/' } as any);
        }
      } else {
        console.warn('Session verification failed, deleting cookie.');
        context.cookies.delete('session_token', { path: '/' } as any);
      }
    }
  }

  // Apply authorization guard only to admin endpoints (except login, logout or static assets)
  if (url.pathname.startsWith('/admin') && url.pathname !== '/admin/login' && url.pathname !== '/admin/logout') {
    const user = context.locals.user;
    
    if (!user || !user.email) {
      console.warn(`Unauthorized access attempt to ${url.pathname} from IP: ${context.clientAddress}: No active session`);
      return context.redirect('/admin/login', 302);
    }

    const superAdminEmail = (import.meta.env.SUPERADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || 'admin@flexform.com').trim().toLowerCase();
    let isAdmin = user.email.trim().toLowerCase() === superAdminEmail;

    if (!isAdmin) {
      try {
        const settingsSnap = await admin.firestore().collection('settings').doc('general').get();
        if (settingsSnap.exists) {
          const settings = settingsSnap.data();
          if (settings && Array.isArray(settings.admins)) {
            const normalizedAdmins = settings.admins.map((email: string) => email.trim().toLowerCase());
            if (normalizedAdmins.includes(user.email.trim().toLowerCase())) {
              isAdmin = true;
            }
          }
        }
      } catch (err) {
        console.error('Error verifying admin role in middleware:', err);
      }
    }

    if (!isAdmin) {
      console.warn(`Unauthorized access attempt to ${url.pathname} from IP: ${context.clientAddress} by non-admin: ${user.email}`);
      return context.redirect('/admin/login?error=unauthorized', 302);
    }
  }

  // Continue request processing chain
  return next();
});
