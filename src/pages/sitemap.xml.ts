import type { APIRoute } from 'astro';
import { db } from '../lib/firebase';
import type { Product, ProductCollection } from '../types';

export const prerender = false;

export const GET: APIRoute = async () => {
  const rawSiteUrl = process.env.PUBLIC_SITE_URL || 'https://flexformfitness.vercel.app';
  const siteUrl = rawSiteUrl.replace(/\/$/, '');

  // 1. Static informational and shop pages
  const staticPages = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: 'carrito', priority: '0.6', changefreq: 'weekly' },
    { path: 'contacto', priority: '0.7', changefreq: 'monthly' },
    { path: 'privacidad', priority: '0.3', changefreq: 'yearly' },
    { path: 'condiciones', priority: '0.3', changefreq: 'yearly' },
    { path: 'cookies', priority: '0.3', changefreq: 'yearly' },
  ];

  const languages = ['es', 'en'];

  // 2. Fetch active collections
  let collections: ProductCollection[] = [];
  try {
    const snap = await db.collection('collections').get();
    if (!snap.empty) {
      collections = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ProductCollection);
    }
  } catch (err) {
    console.error('[Sitemap] Error fetching collections:', err);
  }

  // 3. Fetch active products
  let products: Product[] = [];
  try {
    const snap = await db.collection('products').get();
    if (!snap.empty) {
      products = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Product);
    }
  } catch (err) {
    console.error('[Sitemap] Error fetching products:', err);
  }

  const activeProductIds = new Set(products.map((p) => p.id));

  const currentDate = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

  // Add static pages in all languages with hreflang alternate links
  for (const page of staticPages) {
    for (const lang of languages) {
      const pagePath = page.path ? `/${lang}/${page.path}` : `/${lang}`;
      const esUrl = page.path ? `${siteUrl}/es/${page.path}` : `${siteUrl}/es`;
      const enUrl = page.path ? `${siteUrl}/en/${page.path}` : `${siteUrl}/en`;

      xml += `  <url>\n`;
      xml += `    <loc>${siteUrl}${pagePath}</loc>\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="es" href="${esUrl}" />\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${esUrl}" />\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }
  }

  // Add active collections that contain products (skip empty collections like sudaderas)
  for (const col of collections) {
    if (!col.slug) continue;

    let hasProducts = (col.productIds || []).some((id) => activeProductIds.has(id));
    if (col.slug === 'hombre' || col.slug === 'mujer') {
      hasProducts = products.length > 0;
    }

    if (!hasProducts) continue;

    const esUrl = `${siteUrl}/es/colecciones/${col.slug}`;
    const enUrl = `${siteUrl}/en/colecciones/${col.slug}`;
    const lastmod = col.updatedAt?.toDate ? col.updatedAt.toDate().toISOString().split('T')[0] : currentDate;

    for (const lang of languages) {
      const colUrl = lang === 'es' ? esUrl : enUrl;
      xml += `  <url>\n`;
      xml += `    <loc>${colUrl}</loc>\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="es" href="${esUrl}" />\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${esUrl}" />\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }
  }

  // Add products
  for (const prod of products) {
    if (!prod.slug) continue;
    const esUrl = `${siteUrl}/es/productos/${prod.slug}`;
    const enUrl = `${siteUrl}/en/productos/${prod.slug}`;
    const lastmod = prod.updatedAt?.toDate ? prod.updatedAt.toDate().toISOString().split('T')[0] : currentDate;

    for (const lang of languages) {
      const prodUrl = lang === 'es' ? esUrl : enUrl;
      xml += `  <url>\n`;
      xml += `    <loc>${prodUrl}</loc>\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="es" href="${esUrl}" />\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />\n`;
      xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${esUrl}" />\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    }
  }

  xml += `</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
