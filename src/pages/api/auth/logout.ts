import type { APIRoute } from 'astro';

export const prerender = false; // Must be dynamically rendered

export const POST: APIRoute = async ({ cookies }) => {
  // Delete the session cookie by setting its maxAge to 0
  cookies.delete('session_token', {
    path: '/',
  } as any);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async ({ cookies, redirect }) => {
  // Allow simple GET requests to log out and redirect immediately
  cookies.delete('session_token', {
    path: '/',
  } as any);

  return redirect('/', 302);
};
