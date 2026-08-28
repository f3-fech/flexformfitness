import { db } from '../lib/firebase';
import type { Product } from '../types';
import type { APIRoute } from 'astro';

export const prerender = false; // Real-time live XML feed

export const GET: APIRoute = async () => {
  try {
    const productsSnap = await db.collection('products').get();
    const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://flexformfitness.vercel.app';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>FlexForm Fitness</title>\n`;
    xml += `    <link>${siteUrl}</link>\n`;
    xml += `    <description>Catálogo oficial de productos de FlexForm Fitness</description>\n`;

    productsSnap.docs.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() } as Product;
      if (!product.slug) return;

      const basePrice = (product.price / 100).toFixed(2);
      const isAvailable = (product.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock';
      const cleanDesc = (product.description || product.title || '').replace(/<[^>]*>?/gm, '').substring(0, 5000);

      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant) => {
          const variantPrice = ((variant.price ?? product.price) / 100).toFixed(2);
          const variantAvailable = (variant.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock';

          xml += `    <item>\n`;
          xml += `      <g:id>${variant.sku || `${product.id}-${variant.name}`}</g:id>\n`;
          xml += `      <g:title><![CDATA[${product.title} - ${variant.name}]]></g:title>\n`;
          xml += `      <g:description><![CDATA[${cleanDesc}]]></g:description>\n`;
          xml += `      <g:link>${siteUrl}/es/productos/${product.slug}?variant=${variant.sku}</g:link>\n`;
          if (product.images && product.images[0]) {
            xml += `      <g:image_link>${product.images[0]}</g:image_link>\n`;
          }
          if (product.images && product.images.length > 1) {
            product.images.slice(1, 10).forEach((img) => {
              xml += `      <g:additional_image_link>${img}</g:additional_image_link>\n`;
            });
          }
          xml += `      <g:availability>${variantAvailable}</g:availability>\n`;
          xml += `      <g:price>${variantPrice} EUR</g:price>\n`;
          xml += `      <g:brand>FlexForm Fitness</g:brand>\n`;
          xml += `      <g:condition>new</g:condition>\n`;
          xml += `      <g:item_group_id>${product.id}</g:item_group_id>\n`;
          xml += `      <g:mpn>${variant.sku || product.id}</g:mpn>\n`;
          xml += `    </item>\n`;
        });
      } else {
        xml += `    <item>\n`;
        xml += `      <g:id>${product.id}</g:id>\n`;
        xml += `      <g:title><![CDATA[${product.title}]]></g:title>\n`;
        xml += `      <g:description><![CDATA[${cleanDesc}]]></g:description>\n`;
        xml += `      <g:link>${siteUrl}/es/productos/${product.slug}</g:link>\n`;
        if (product.images && product.images[0]) {
          xml += `      <g:image_link>${product.images[0]}</g:image_link>\n`;
        }
        if (product.images && product.images.length > 1) {
          product.images.slice(1, 10).forEach((img) => {
            xml += `      <g:additional_image_link>${img}</g:additional_image_link>\n`;
          });
        }
        xml += `      <g:availability>${isAvailable}</g:availability>\n`;
        xml += `      <g:price>${basePrice} EUR</g:price>\n`;
        xml += `      <g:brand>FlexForm Fitness</g:brand>\n`;
        xml += `      <g:condition>new</g:condition>\n`;
        xml += `      <g:mpn>${product.id}</g:mpn>\n`;
        xml += `    </item>\n`;
      }
    });

    xml += `  </channel>\n`;
    xml += `</rss>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (error: any) {
    console.error('Error generating Google Merchant XML feed:', error);
    return new Response(
      `<error><message>${error.message || 'Failed to fetch live products feed.'}</message></error>`,
      {
        status: 500,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }
};
