import Stripe from 'stripe';
import { db } from '../../lib/firebase';
import type { APIRoute } from 'astro';
import type { Product } from '../../types';
import { getGeneralSettings } from '../../lib/settings';
import { checkRateLimit } from '../../lib/ratelimit';

export const prerender = false;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' as any,
});

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  try {
    // 0. Rate Limiting Check
    const ip = clientAddress || '127.0.0.1';
    const rateLimit = await checkRateLimit('checkout', ip);
    if (!rateLimit.success) {
      return new Response(
        JSON.stringify({ error: 'Demasiadas solicitudes. Por favor, intenta de nuevo en unos minutos.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { items, promoCodeId, lang = 'es' } = await request.json();
    const userLang = (lang === 'en' || lang === 'es') ? lang : 'es';

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty or invalid.' }), { status: 400 });
    }

    const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://flexformfitness.vercel.app';
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const sanitizedItems: any[] = [];

    // 1. Fetch products from Firestore to verify prices and stock
    for (const item of items) {
      const productDoc = await db.collection('products').doc(item.productId).get();
      
      if (!productDoc.exists) {
        return new Response(JSON.stringify({ error: `Product not found: ${item.title}` }), { status: 404 });
      }

      const product = { id: productDoc.id, ...productDoc.data() } as Product;
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

      // Check stock limits
      if (finalStock < item.quantity) {
        return new Response(
          JSON.stringify({ error: `Insufficient stock for ${finalName}. Available: ${finalStock}` }),
          { status: 400 }
        );
      }

      // 2. Build Stripe line items
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: finalName,
            images: product.images[0] ? [product.images[0]] : [],
            description: product.description.substring(0, 100),
          },
          unit_amount: finalPrice, // Verified server-side price
        },
        quantity: item.quantity,
      });

      // 3. Keep verified data for webhook reference
      sanitizedItems.push({
        productId: product.id,
        variantSku: item.variantSku || null,
        title: product.title,
        variantName: item.variantSku ? product.variants.find((v) => v.sku === item.variantSku)?.name || null : null,
        quantity: item.quantity,
        price: finalPrice,
        image: product.images[0] || null,
      });
    }

    // 4. Load General Settings to determine shipping and markets
    const settings = await getGeneralSettings();
    const subtotal = sanitizedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // Verify promoCodeId server-side if provided to prevent API bypass or hacking
    if (promoCodeId) {
      try {
        const promoCodeObj = await stripe.promotionCodes.retrieve(promoCodeId, { expand: ['coupon'] });
        const isShipping = 
          promoCodeObj.metadata?.isShippingCoupon === 'true' || 
          promoCodeObj.coupon?.metadata?.isShippingCoupon === 'true' ||
          (promoCodeObj.coupon?.amount_off !== undefined && promoCodeObj.coupon.amount_off === settings.shippingPrice) ||
          promoCodeObj.code?.includes('ENVIO') ||
          promoCodeObj.code?.includes('FREESHIP') ||
          promoCodeObj.code?.includes('SHIPPING') ||
          promoCodeObj.code?.includes('GRATIS');

        if (isShipping && subtotal >= settings.freeShippingMin) {
          const minFormatted = (settings.freeShippingMin / 100).toFixed(2);
          return new Response(
            JSON.stringify({ 
              error: `Este código de envío gratis solo es aplicable en compras inferiores a ${minFormatted} € (tu pedido ya dispone de envío gratuito).` 
            }), 
            { status: 400 }
          );
        }
      } catch (err) {
        console.error('Server-side promo code verification error:', err);
      }
    }

    const shippingCost = (subtotal >= settings.freeShippingMin || subtotal === 0) ? 0 : settings.shippingPrice;

    // Save draft checkout in Firestore to avoid Stripe 500-char metadata limit
    const checkoutRef = db.collection('draft_checkouts').doc();
    await checkoutRef.set({
      items: sanitizedItems,
      createdAt: new Date(),
    });
    const checkoutId = checkoutRef.id;

    const userEmail = locals.user?.email || undefined;

    // 5. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      allow_promotion_codes: promoCodeId ? undefined : true,
      customer_email: userEmail,
      discounts: promoCodeId ? [{ promotion_code: promoCodeId }] : undefined,
      shipping_address_collection: {
        allowed_countries: settings.markets && settings.markets.length > 0 
          ? (settings.markets as any) 
          : ['US', 'CA', 'ES', 'MX'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: shippingCost,
              currency: 'eur',
            },
            display_name: shippingCost === 0 ? 'Envío gratuito' : 'Envío estándar',
          },
        },
      ],
      billing_address_collection: 'required',
      invoice_creation: {
        enabled: true,
      },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/${userLang}/carrito`,
      metadata: {
        checkoutId: checkoutId,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Stripe session creation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500 }
    );
  }
};
