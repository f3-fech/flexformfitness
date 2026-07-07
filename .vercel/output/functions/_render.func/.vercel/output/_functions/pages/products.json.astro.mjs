import { db } from '../chunks/firebase_CqeBG1kq.mjs';
export { renderers } from '../renderers.mjs';

const prerender = false;
const GET = async () => {
  try {
    const productsSnap = await db.collection("products").get();
    const siteUrl = "http://localhost:4321";
    const googleMerchantFeed = [];
    productsSnap.docs.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() };
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant) => {
          googleMerchantFeed.push({
            id: variant.sku,
            title: `${product.title} - ${variant.name}`,
            description: product.description.substring(0, 5e3),
            // Google max description length is 5000
            link: `${siteUrl}/productos/${product.slug}?variant=${variant.sku}`,
            image_link: product.images[0] || "",
            additional_image_link: product.images.slice(1),
            availability: variant.stock > 0 ? "in_stock" : "out_of_stock",
            price: `${(variant.price / 100).toFixed(2)} USD`,
            brand: "FlexForm Fitness",
            condition: "new",
            item_group_id: product.id,
            mpn: variant.sku
          });
        });
      } else {
        googleMerchantFeed.push({
          id: product.id,
          title: product.title,
          description: product.description.substring(0, 5e3),
          link: `${siteUrl}/productos/${product.slug}`,
          image_link: product.images[0] || "",
          additional_image_link: product.images.slice(1),
          availability: product.stock > 0 ? "in_stock" : "out_of_stock",
          price: `${(product.price / 100).toFixed(2)} USD`,
          brand: "FlexForm Fitness",
          condition: "new",
          mpn: product.id
        });
      }
    });
    return new Response(JSON.stringify(googleMerchantFeed, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Instruct Vercel CDN to cache this feed for 1 hour (3600s), revalidating after 30 mins (1800s)
        "Cache-Control": "public, max-age=1800, s-maxage=3600, stale-while-revalidate=600"
      }
    });
  } catch (error) {
    console.error("Error generating products JSON feed:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error.message || "Failed to fetch live products feed."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
