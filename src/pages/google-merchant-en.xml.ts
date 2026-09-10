import { db } from '../lib/firebase';
import type { Product } from '../types';
import type { APIRoute } from 'astro';

export const prerender = false; // Real-time live XML feed

function escapeXml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(str: string | null | undefined): string {
  if (!str) return '';
  return `<![CDATA[${str.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

export const GET: APIRoute = async () => {
  try {
    const productsSnap = await db.collection('products').get();
    const rawSiteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://flexformfitness.com';
    const siteUrl = rawSiteUrl.replace(/\/$/, '');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>FlexForm Fitness (English Catalog)</title>\n`;
    xml += `    <link>${escapeXml(`${siteUrl}/en`)}</link>\n`;
    xml += `    <description>Official FlexForm Fitness products catalog</description>\n`;

    productsSnap.docs.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() } as Product;
      if (!product.slug) return;

      const title = product.title_en || product.title;
      const rawDesc = product.description_en || product.description || title;
      const cleanDesc = rawDesc.replace(/<[^>]*>?/gm, '').trim().substring(0, 5000);
      const basePrice = (product.price / 100).toFixed(2);
      const isAvailable = (product.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock';

      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant) => {
          const variantPrice = ((variant.price ?? product.price) / 100).toFixed(2);
          const variantAvailable = (variant.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock';
          const variantSku = variant.sku || `${product.id}-${variant.name}`;
          const variantLink = `${siteUrl}/en/productos/${product.slug}?variant=${encodeURIComponent(variant.sku || variant.name || '')}`;

          xml += `    <item>\n`;
          xml += `      <g:id>${escapeXml(variantSku)}</g:id>\n`;
          xml += `      <g:title>${cdata(`${title} - ${variant.name}`)}</g:title>\n`;
          xml += `      <g:description>${cdata(cleanDesc || title)}</g:description>\n`;
          xml += `      <g:link>${escapeXml(variantLink)}</g:link>\n`;
          const mainImage = variant.image || (product.images && product.images[0]);
          if (mainImage) {
            xml += `      <g:image_link>${escapeXml(mainImage)}</g:image_link>\n`;
          }
          if (product.images && product.images.length > 0) {
            product.images.slice(0, 10).forEach((img) => {
              if (img && img !== mainImage) {
                xml += `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>\n`;
              }
            });
          }
          xml += `      <g:availability>${variantAvailable}</g:availability>\n`;
          xml += `      <g:price>${variantPrice} EUR</g:price>\n`;
          xml += `      <g:brand>FlexForm Fitness</g:brand>\n`;
          xml += `      <g:condition>new</g:condition>\n`;
          xml += `      <g:item_group_id>${escapeXml(product.id)}</g:item_group_id>\n`;
          xml += `      <g:mpn>${escapeXml(variantSku)}</g:mpn>\n`;
          xml += `    </item>\n`;
        });
      } else {
        const productLink = `${siteUrl}/en/productos/${product.slug}`;

        xml += `    <item>\n`;
        xml += `      <g:id>${escapeXml(product.id)}</g:id>\n`;
        xml += `      <g:title>${cdata(title)}</g:title>\n`;
        xml += `      <g:description>${cdata(cleanDesc || title)}</g:description>\n`;
        xml += `      <g:link>${escapeXml(productLink)}</g:link>\n`;
        if (product.images && product.images[0]) {
          xml += `      <g:image_link>${escapeXml(product.images[0])}</g:image_link>\n`;
        }
        if (product.images && product.images.length > 1) {
          product.images.slice(1, 10).forEach((img) => {
            if (img) {
              xml += `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>\n`;
            }
          });
        }
        xml += `      <g:availability>${isAvailable}</g:availability>\n`;
        xml += `      <g:price>${basePrice} EUR</g:price>\n`;
        xml += `      <g:brand>FlexForm Fitness</g:brand>\n`;
        xml += `      <g:condition>new</g:condition>\n`;
        xml += `      <g:mpn>${escapeXml(product.id)}</g:mpn>\n`;
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
    console.error('Error generating Google Merchant EN XML feed:', error);
    return new Response(
      `<error><message>${escapeXml(error.message || 'Failed to fetch live English products feed.')}</message></error>`,
      {
        status: 500,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }
};
