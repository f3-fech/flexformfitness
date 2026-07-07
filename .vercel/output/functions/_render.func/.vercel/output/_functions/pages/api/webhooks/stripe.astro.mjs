import Stripe from 'stripe';
import { Resend } from 'resend';
import { db } from '../../../chunks/firebase_CqeBG1kq.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20"
});
const resend = new Resend(process.env.RESEND_API_KEY || "");
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const POST = async ({ request }) => {
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), { status: 400 });
  }
  let event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, stripeWebhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      const checkoutId = session.metadata?.checkoutId;
      if (!checkoutId) {
        throw new Error("Checkout session metadata is missing checkoutId.");
      }
      const draftDoc = await db.collection("draft_checkouts").doc(checkoutId).get();
      if (!draftDoc.exists) {
        throw new Error(`Draft checkout document not found for ID: ${checkoutId}`);
      }
      const items = draftDoc.data()?.items || [];
      const totalAmount = session.amount_total ?? 0;
      const paymentStatus = session.payment_status === "paid" ? "paid" : "pending";
      const customerDetails = {
        name: session.customer_details?.name || "Anonymous Customer",
        email: session.customer_details?.email || "",
        phone: session.customer_details?.phone || null,
        address: {
          line1: session.customer_details?.address?.line1 || "",
          line2: session.customer_details?.address?.line2 || null,
          city: session.customer_details?.address?.city || "",
          state: session.customer_details?.address?.state || "",
          postal_code: session.customer_details?.address?.postal_code || "",
          country: session.customer_details?.address?.country || ""
        }
      };
      await db.runTransaction(async (transaction) => {
        const orderRef = db.collection("orders").doc(session.id);
        const orderSnap = await transaction.get(orderRef);
        if (orderSnap.exists) {
          console.log(`Order ${session.id} already processed.`);
          return;
        }
        const uniqueProductIds = Array.from(new Set(items.map((item) => item.productId)));
        const productDocRefs = uniqueProductIds.map((id) => db.collection("products").doc(id));
        const productSnapshots = await Promise.all(
          productDocRefs.map((ref) => transaction.get(ref))
        );
        const productsMap = {};
        productSnapshots.forEach((snap) => {
          if (!snap.exists) {
            throw new Error(`Product reference not found: ${snap.id}`);
          }
          productsMap[snap.id] = { id: snap.id, ...snap.data() };
        });
        items.forEach((item) => {
          const product = productsMap[item.productId];
          if (!product) {
            throw new Error(`Product data mismatch for ID ${item.productId}`);
          }
          if (item.variantSku) {
            const variantIdx = product.variants.findIndex((v) => v.sku === item.variantSku);
            if (variantIdx === -1) {
              throw new Error(`Variant SKU ${item.variantSku} not found for product ${product.title}`);
            }
            const variant = product.variants[variantIdx];
            if (variant.stock < item.quantity) {
              throw new Error(`Insufficient stock for variant SKU ${item.variantSku}. Available: ${variant.stock}`);
            }
            product.variants[variantIdx].stock -= item.quantity;
            product.stock = Math.max(0, product.stock - item.quantity);
          } else {
            if (product.stock < item.quantity) {
              throw new Error(`Insufficient stock for product ${product.title}. Available: ${product.stock}`);
            }
            product.stock -= item.quantity;
          }
        });
        uniqueProductIds.forEach((id) => {
          const product = productsMap[id];
          const productRef = db.collection("products").doc(id);
          transaction.update(productRef, {
            stock: product.stock,
            variants: product.variants,
            updatedAt: /* @__PURE__ */ new Date()
          });
        });
        const orderData = {
          id: session.id,
          customerDetails,
          items,
          totalAmount,
          paymentStatus,
          shippingStatus: "pending",
          trackingNumber: null,
          createdAt: /* @__PURE__ */ new Date()
        };
        transaction.set(orderRef, orderData);
      });
      if (customerDetails.email) {
        const emailContent = `
          <h1>¡Gracias por tu compra, ${customerDetails.name}!</h1>
          <p>Hemos recibido tu pedido con el ID: <strong>${session.id}</strong>.</p>
          <h3>Resumen del Pedido:</h3>
          <ul>
            ${items.map(
          (item) => `
              <li>
                ${item.title} ${item.variantName ? `(${item.variantName})` : ""} - 
                Cantidad: ${item.quantity} - 
                Precio: $${(item.price / 100).toFixed(2)}
              </li>`
        ).join("")}
          </ul>
          <p>Total pagado: $${(totalAmount / 100).toFixed(2)}</p>
          <p>Te enviaremos un correo de confirmación con el código de seguimiento una vez que tu pedido sea enviado.</p>
        `;
        await resend.emails.send({
          from: "FlexForm Fitness <orders@flexformfitness.com>",
          // Set to verified domain sender
          to: customerDetails.email,
          subject: `Confirmación de pedido - FlexForm Fitness #${session.id.slice(-6).toUpperCase()}`,
          html: emailContent
        });
      }
      return new Response(JSON.stringify({ success: true, orderId: session.id }), { status: 200 });
    } catch (err) {
      console.error(`Error processing completed checkout: ${err.message}`);
      return new Response(JSON.stringify({ error: `Checkout Processing Error: ${err.message}` }), { status: 500 });
    }
  }
  return new Response(JSON.stringify({ received: true }), { status: 200 });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
