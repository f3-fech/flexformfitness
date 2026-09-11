import { db } from '../lib/firebase';
import type { Product } from '../types';
import type { APIRoute } from 'astro';
import { getApparelAttributes } from '../lib/merchantUtils';
import { getGeneralSettings } from '../lib/settings';

export const prerender = false; // Disable SSG for real-time live data

export const GET: APIRoute = async () => {
  try {
    const [productsSnap, settings] = await Promise.all([
      db.collection('products').get(),
      getGeneralSettings(),
    ]);
    
    const siteUrl = (import.meta.env.PUBLIC_SITE_URL || 'https://flexformfitness.com').replace(/\/$/, '');
    const shippingPriceEur = ((settings.shippingPrice ?? 499) / 100).toFixed(2);
    const shippingMarkets = settings.markets && settings.markets.length > 0 ? settings.markets : ['ES'];
    
    const googleMerchantFeed: Record<string, any>[] = [];

    productsSnap.docs.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() } as Product;
      if (!product.slug) return;

      const baseDesc = (product.description || product.title || '').replace(/<[^>]*>?/gm, '').trim().substring(0, 5000);

      const shippingArray = shippingMarkets.map((country) => ({
        country,
        service: 'Standard',
        price: `${shippingPriceEur} EUR`,
      }));

      if (product.variants && product.variants.length > 0) {
        // Map individual variants as separate indexable items under a single group ID
        product.variants.forEach((variant) => {
          const attrs = getApparelAttributes(product, variant, false);
          googleMerchantFeed.push({
            id: variant.sku || `${product.id}-${variant.name}`,
            title: `${product.title} - ${variant.name}`,
            description: baseDesc,
            link: `${siteUrl}/es/productos/${product.slug}?variant=${encodeURIComponent(variant.sku || variant.name || '')}`,
            image_link: variant.image || product.images[0] || '',
            additional_image_link: product.images.slice(1, 10),
            availability: attrs.availability,
            price: `${(((variant.price ?? product.price) / 100)).toFixed(2)} EUR`,
            brand: 'FlexForm Fitness',
            condition: 'new',
            item_group_id: product.id,
            mpn: variant.sku || `${product.id}-${variant.name}`,
            gender: attrs.gender,
            age_group: attrs.ageGroup,
            color: attrs.color,
            size: attrs.size,
            google_product_category: 'Apparel & Accessories > Clothing',
            product_type: attrs.productType,
            shipping: shippingArray,
          });
        });
      } else {
        // Map base product if no variants exist
        const attrs = getApparelAttributes(product, null, false);
        googleMerchantFeed.push({
          id: product.id,
          title: product.title,
          description: baseDesc,
          link: `${siteUrl}/es/productos/${product.slug}`,
          image_link: product.images[0] || '',
          additional_image_link: product.images.slice(1, 10),
          availability: attrs.availability,
          price: `${((product.price / 100)).toFixed(2)} EUR`,
          brand: 'FlexForm Fitness',
          condition: 'new',
          mpn: product.id,
          gender: attrs.gender,
          age_group: attrs.ageGroup,
          color: attrs.color,
          size: attrs.size,
          google_product_category: 'Apparel & Accessories > Clothing',
          product_type: attrs.productType,
          shipping: shippingArray,
        });
      }
    });

    return new Response(JSON.stringify(googleMerchantFeed, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
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
