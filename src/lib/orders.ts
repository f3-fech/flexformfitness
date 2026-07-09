import Stripe from 'stripe';
import { sendEmail } from './mail';
import { db } from './firebase';
import type { Order, OrderItem, Product } from '../types';
import { getEmailSettings } from './emailSettings';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' as any,
});

export async function fulfillOrder(sessionId: string) {
  // Prevent duplicate processing (Idempotency)
  const orderRef = db.collection('orders').doc(sessionId);
  const orderSnap = await orderRef.get();
  if (orderSnap.exists) {
    console.log(`[FulfillOrder] Order ${sessionId} already processed.`);
    return { success: true, orderId: sessionId, alreadyProcessed: true };
  }

  // 1. Fetch the Checkout Session from Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!session) {
    throw new Error(`Stripe Checkout Session not found for ID: ${sessionId}`);
  }

  // 2. Validate checkout metadata and fetch items from draft_checkouts in Firestore
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

  // 3. Perform Firestore atomic inventory check and update in transaction
  await db.runTransaction(async (transaction) => {
    // Re-check existence inside transaction to avoid race conditions
    const tOrderSnap = await transaction.get(orderRef);
    if (tOrderSnap.exists) {
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

  // 4. Send transactional order confirmation email via Nodemailer (SMTP)
  if (customerDetails.email) {
    try {
      // Fetch invoice details if generated
      let invoicePdfUrl: string | null = null;
      let hostedInvoiceUrl: string | null = null;
      if (session.invoice) {
        try {
          const invoice = await stripe.invoices.retrieve(session.invoice as string);
          invoicePdfUrl = invoice.invoice_pdf || null;
          hostedInvoiceUrl = invoice.hosted_invoice_url || null;
        } catch (err) {
          console.error('[FulfillOrder] Error retrieving invoice:', err);
        }
      }

      const emailSettings = await getEmailSettings();

      const itemsHtml = `<ul>
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
      </ul>`;

      const invoiceLink = hostedInvoiceUrl 
        ? `<p>Puedes ver tu factura online aquí: <a href="${hostedInvoiceUrl}" target="_blank">Ver Factura de Stripe</a></p>` 
        : '';

      const emailContent = emailSettings.orderBody
        .replace(/{{customerName}}/g, customerDetails.name || 'Cliente')
        .replace(/{{orderId}}/g, session.id)
        .replace(/{{orderItems}}/g, itemsHtml)
        .replace(/{{totalAmount}}/g, `$${(totalAmount / 100).toFixed(2)}`)
        .replace(/{{invoiceUrl}}/g, invoiceLink);

      const subject = emailSettings.orderSubject
        .replace(/{{customerName}}/g, customerDetails.name || 'Cliente')
        .replace(/{{orderId}}/g, session.id.slice(-6).toUpperCase());

      await sendEmail({
        to: customerDetails.email,
        subject,
        html: emailContent,
        attachmentUrl: invoicePdfUrl,
      });
    } catch (err) {
      console.error('[FulfillOrder] Error sending email via Nodemailer:', err);
    }
  }

  return { success: true, orderId: sessionId };
}
