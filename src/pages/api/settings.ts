import type { APIRoute } from 'astro';
import { getGeneralSettings } from '../../lib/settings';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const settings = await getGeneralSettings();
    return new Response(
      JSON.stringify({
        freeShippingMin: settings.freeShippingMin,
        shippingPrice: settings.shippingPrice,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, s-maxage=60',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching settings in /api/settings:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch settings' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
