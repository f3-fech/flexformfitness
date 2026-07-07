import Stripe from 'stripe';
import { db } from '../../chunks/firebase_CqeBG1kq.mjs';
import { g as getGeneralSettings } from '../../chunks/settings_C0jU3ASc.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20"
});
const POST = async ({ request, locals }) => {
  try {
    const { items, promoCodeId } = await request.json();
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty or invalid." }), { status: 400 });
    }
    const siteUrl = "http://localhost:4321";
    const lineItems = [];
    const sanitizedItems = [];
    for (const item of items) {
      const productDoc = await db.collection("products").doc(item.productId).get();
      if (!productDoc.exists) {
        return new Response(JSON.stringify({ error: `Product not found: ${item.title}` }), { status: 404 });
      }
      const product = { id: productDoc.id, ...productDoc.data() };
      let finalPrice = product.price;
      let finalStock = product.stock;
      let finalName = product.title;
      if (item.variantSku) {
        const variant = product.variants.find((v) => v.sku === item.variantSku);
        if (!variant) {
          return new Response(
            JSON.stringify({ error: `Variant not found for variant SKU ${item.variantSku}` }),
            { status: 404 }
          );
        }
        finalPrice = variant.price;
        finalStock = variant.stock;
        finalName = `${product.title} (${variant.name})`;
      }
      if (finalStock < item.quantity) {
        return new Response(
          JSON.stringify({ error: `Insufficient stock for ${finalName}. Available: ${finalStock}` }),
          { status: 400 }
        );
      }
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: finalName,
            images: product.images[0] ? [product.images[0]] : [],
            description: product.description.substring(0, 100)
          },
          unit_amount: finalPrice
          // Verified server-side price
        },
        quantity: item.quantity
      });
      sanitizedItems.push({
        productId: product.id,
        variantSku: item.variantSku || null,
        title: product.title,
        variantName: item.variantSku ? product.variants.find((v) => v.sku === item.variantSku)?.name || null : null,
        quantity: item.quantity,
        price: finalPrice,
        image: product.images[0] || null
      });
    }
    const settings = await getGeneralSettings();
    const subtotal = sanitizedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shippingCost = subtotal >= settings.freeShippingMin || subtotal === 0 ? 0 : settings.shippingPrice;
    const tax = Math.round(subtotal * 0.08);
    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Impuesto estimado (8%)"
          },
          unit_amount: tax
        },
        quantity: 1
      });
    }
    const checkoutRef = db.collection("draft_checkouts").doc();
    await checkoutRef.set({
      items: sanitizedItems,
      createdAt: /* @__PURE__ */ new Date()
    });
    const checkoutId = checkoutRef.id;
    const userEmail = locals.user?.email || void 0;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      allow_promotion_codes: true,
      customer_email: userEmail,
      discounts: promoCodeId ? [{ promotion_code: promoCodeId }] : void 0,
      shipping_address_collection: {
        allowed_countries: settings.markets && settings.markets.length > 0 ? settings.markets : ["US", "CA", "ES", "MX"]
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: shippingCost,
              currency: "usd"
            },
            display_name: shippingCost === 0 ? "Envío gratuito" : "Envío estándar"
          }
        }
      ],
      billing_address_collection: "required",
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/carrito`,
      metadata: {
        checkoutId
      }
    });
    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Stripe session creation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: error.message }),
      { status: 500 }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
