import type { APIRoute } from 'astro';

export const prerender = false;

// List of disallowed private/internal hostnames and IP patterns (SSRF Protection)
function isForbiddenHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '169.254.169.254' ||
    host === '::1' ||
    host === '[::1]' ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
    /^127\./.test(host) ||
    /^169\.254\./.test(host)
  ) {
    return true;
  }
  return false;
}

export const GET: APIRoute = async ({ request }) => {
  const urlParams = new URL(request.url).searchParams;
  const imageUrl = urlParams.get('url');

  if (!imageUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    const parsed = new URL(imageUrl);

    // Only allow HTTPS
    if (parsed.protocol !== 'https:') {
      return new Response('Only secure HTTPS URLs are supported.', { status: 400 });
    }

    // SSRF Guard: reject private network addresses, metadata IPs, and local loopbacks
    if (isForbiddenHost(parsed.hostname)) {
      return new Response('Access to private or local resources is strictly prohibited.', { status: 403 });
    }

    // Fetch with redirect: 'error' to prevent SSRF redirect bypass
    const res = await fetch(parsed.toString(), {
      redirect: 'error',
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'FlexForm-ImageProxy/1.0',
      },
    });

    if (!res.ok) {
      return new Response('Failed to fetch image from upstream server', { status: res.status });
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return new Response('The requested resource is not an image.', { status: 400 });
    }

    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    console.error('[proxy-image] Error proxying image:', err?.message || err);
    return new Response('Error proxying requested image.', { status: 500 });
  }
};
