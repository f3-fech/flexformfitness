import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const urlParams = new URL(request.url).searchParams;
  const imageUrl = urlParams.get('url');

  if (!imageUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      return new Response(`Failed to fetch image: ${res.statusText}`, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
};
