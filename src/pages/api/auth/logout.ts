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

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  // CSRF Guard: prevent cross-site logout via <img>, <iframe>, or cross-origin links
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') {
    return new Response('Cross-site logout requests are forbidden.', { status: 403 });
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refUrl = new URL(referer);
      const reqUrl = new URL(request.url);
      if (refUrl.origin !== reqUrl.origin) {
        return new Response('Cross-origin logout requests are forbidden.', { status: 403 });
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  // Delete the session cookie
  cookies.delete('session_token', {
    path: '/',
  } as any);

  return redirect('/', 302);
};
