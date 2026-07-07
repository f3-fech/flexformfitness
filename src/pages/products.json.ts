import { db } from '../lib/firebase';
import type { Product } from '../types';
import type { APIRoute } from 'astro';

export const prerender = false; // Disable SSG for real-time live data

export const GET: APIRoute = async () => {
  try {
    const productsSnap = await db.collection('products').get();
    const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://flexformfitness.vercel.app';
    
    const googleMerchantFeed: Record<string, any>[] = [];

    productsSnap.docs.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() } as Product;

      if (product.variants && product.variants.length > 0) {
        // Map individual variants as separate indexable items under a single group ID
        product.variants.forEach((variant) => {
          googleMerchantFeed.push({
            id: variant.sku,
            title: `${product.title} - ${variant.name}`,
            description: product.description.substring(0, 5000), // Google max description length is 5000
            link: `${siteUrl}/productos/${product.slug}?variant=${variant.sku}`,
            image_link: product.images[0] || '',
            additional_image_link: product.images.slice(1),
            availability: variant.stock > 0 ? 'in_stock' : 'out_of_stock',
            price: `${(variant.price / 100).toFixed(2)} USD`,
            brand: 'FlexForm Fitness',
            condition: 'new',
            item_group_id: product.id,
            mpn: variant.sku,
          });
        });
      } else {
        // Map base product if no variants exist
        googleMerchantFeed.push({
          id: product.id,
          title: product.title,
          description: product.description.substring(0, 5000),
          link: `${siteUrl}/productos/${product.slug}`,
          image_link: product.images[0] || '',
          additional_image_link: product.images.slice(1),
          availability: product.stock > 0 ? 'in_stock' : 'out_of_stock',
          price: `${(product.price / 100).toFixed(2)} USD`,
          brand: 'FlexForm Fitness',
          condition: 'new',
          mpn: product.id,
        });
      }
    });

    return new Response(JSON.stringify(googleMerchantFeed, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Instruct Vercel CDN to cache this feed for 1 hour (3600s), revalidating after 30 mins (1800s)
        'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (error: any) {
    console.error('Error generating products JSON feed:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error.message || 'Failed to fetch live products feed.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
