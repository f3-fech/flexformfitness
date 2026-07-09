import Stripe from 'stripe';
import { fulfillOrder } from '../../../lib/orders';
import type { APIRoute } from 'astro';

export const prerender = false;

// Initialize clients
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' as any,
});
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
      await fulfillOrder(session.id);
      return new Response(JSON.stringify({ success: true, orderId: session.id }), { status: 200 });
    } catch (err: any) {
      console.error(`Error processing completed checkout: ${err.message}`);
      return new Response(JSON.stringify({ error: `Checkout Processing Error: ${err.message}` }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};
