import Stripe from 'stripe';
import { Resend } from 'resend';
import { db } from '../../../lib/firebase';
import type { APIRoute } from 'astro';
import type { Order, OrderItem, Product } from '../../../types';

export const prerender = false;

// Initialize clients
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' as any,
});
const resend = new Resend(process.env.RESEND_API_KEY || '');
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, stripeWebhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), { status: 400 });
  }

  // Handle 'checkout.session.completed'
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      // 1. Validate checkout metadata and fetch items from draft_checkouts in Firestore
      const checkoutId = session.metadata?.checkoutId;
      if (!checkoutId) {
        throw new Error('Checkout session metadata is missing checkoutId.');
      }

      const draftDoc = await db.collection('draft_checkouts').doc(checkoutId).get();
      if (!draftDoc.exists) {
        throw new Error(`Draft checkout document not found for ID: ${checkoutId}`);
      }

      const items: OrderItem[] = draftDoc.data()?.items || [];
      const totalAmount = session.amount_total ?? 0;
      const paymentStatus = session.payment_status === 'paid' ? 'paid' : 'pending';

      const customerDetails = {
        name: session.customer_details?.name || 'Anonymous Customer',
        email: session.customer_details?.email || '',
        phone: session.customer_details?.phone || null,
        address: {
          line1: session.customer_details?.address?.line1 || '',
          line2: session.customer_details?.address?.line2 || null,
          city: session.customer_details?.address?.city || '',
          state: session.customer_details?.address?.state || '',
          postal_code: session.customer_details?.address?.postal_code || '',
          country: session.customer_details?.address?.country || '',
        },
      };

      // 2. Perform Firestore atomic inventory check and update in transaction
      await db.runTransaction(async (transaction) => {
        // Prevent duplicate processing (Idempotency)
        const orderRef = db.collection('orders').doc(session.id);
        const orderSnap = await transaction.get(orderRef);
        if (orderSnap.exists) {
          console.log(`Order ${session.id} already processed.`);
          return;
        }

        // Fetch all product docs related to items in order
        const uniqueProductIds = Array.from(new Set(items.map((item) => item.productId)));
        const productDocRefs = uniqueProductIds.map((id) => db.collection('products').doc(id));
        const productSnapshots = await Promise.all(
          productDocRefs.map((ref) => transaction.get(ref))
        );

        // Store active data from database to prepare updates
        const productsMap: { [id: string]: Product } = {};
        productSnapshots.forEach((snap) => {
          if (!snap.exists) {
            throw new Error(`Product reference not found: ${snap.id}`);
          }
          productsMap[snap.id] = { id: snap.id, ...snap.data() } as Product;
        });

        // Loop items, check and decrement inventory in memory map
        items.forEach((item) => {
          const product = productsMap[item.productId];
          if (!product) {
            throw new Error(`Product data mismatch for ID ${item.productId}`);
          }

          if (item.variantSku) {
            // Decrement variant stock
            const variantIdx = product.variants.findIndex((v) => v.sku === item.variantSku);
            if (variantIdx === -1) {
              throw new Error(`Variant SKU ${item.variantSku} not found for product ${product.title}`);
            }

            const variant = product.variants[variantIdx];
            if (variant.stock < item.quantity) {
              throw new Error(`Insufficient stock for variant SKU ${item.variantSku}. Available: ${variant.stock}`);
            }

            product.variants[variantIdx].stock -= item.quantity;
            // Optionally adjust base product general stock
            product.stock = Math.max(0, product.stock - item.quantity);
          } else {
            // Decrement base product stock
            if (product.stock < item.quantity) {
              throw new Error(`Insufficient stock for product ${product.title}. Available: ${product.stock}`);
            }
            product.stock -= item.quantity;
          }
        });

        // Commit decremented inventories back to Firestore
        uniqueProductIds.forEach((id) => {
          const product = productsMap[id];
          const productRef = db.collection('products').doc(id);
          transaction.update(productRef, {
            stock: product.stock,
            variants: product.variants,
            updatedAt: new Date(),
          });
        });

        // Construct complete Order object
        const orderData: Order = {
          id: session.id,
          customerDetails,
          items,
          totalAmount,
          paymentStatus,
          shippingStatus: 'pending',
          trackingNumber: null,
          createdAt: new Date(),
        };

        // Save order document inside transaction
        transaction.set(orderRef, orderData);
      });

      // 3. Send transactional order confirmation email via Resend
      if (customerDetails.email) {
        const emailContent = `
          <h1>¡Gracias por tu compra, ${customerDetails.name}!</h1>
          <p>Hemos recibido tu pedido con el ID: <strong>${session.id}</strong>.</p>
          <h3>Resumen del Pedido:</h3>
          <ul>
            ${items
              .map(
                (item) => `
              <li>
                ${item.title} ${item.variantName ? `(${item.variantName})` : ''} - 
                Cantidad: ${item.quantity} - 
                Precio: $${(item.price / 100).toFixed(2)}
              </li>`
              )
              .join('')}
          </ul>
          <p>Total pagado: $${(totalAmount / 100).toFixed(2)}</p>
          <p>Te enviaremos un correo de confirmación con el código de seguimiento una vez que tu pedido sea enviado.</p>
        `;

        await resend.emails.send({
          from: 'FlexForm Fitness <orders@flexformfitness.com>', // Set to verified domain sender
          to: customerDetails.email,
          subject: `Confirmación de pedido - FlexForm Fitness #${session.id.slice(-6).toUpperCase()}`,
          html: emailContent,
        });
      }

      return new Response(JSON.stringify({ success: true, orderId: session.id }), { status: 200 });
    } catch (err: any) {
      console.error(`Error processing completed checkout: ${err.message}`);
      return new Response(JSON.stringify({ error: `Checkout Processing Error: ${err.message}` }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};
