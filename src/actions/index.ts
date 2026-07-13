import { defineAction, ActionError } from 'astro:actions';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { db, admin } from '../lib/firebase';
import { getGeneralSettings, clearSettingsCache } from '../lib/settings';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' as any,
});
import { sendEmail } from '../lib/mail';
import type { Order } from '../types';
import { getEmailSettings } from '../lib/emailSettings';
import { triggerRebuild } from '../lib/deploy';
import { checkRateLimit } from '../lib/ratelimit';

// Schema Definitions
const variantSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Variant name is required'),
  price: z.number().int().nonnegative('Price must be positive (in cents)'),
  stock: z.number().int().nonnegative('Stock must be positive'),
  image: z.string().url('Image must be a valid URL').optional().nullable(),
});

const seoSchema = z.object({
  title: z.string().min(1, 'SEO title is required'),
  description: z.string().min(1, 'SEO description is required'),
  keywords: z.array(z.string()).optional(),
});

const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  title_en: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  description_en: z.string().optional(),
  price: z.number().int().nonnegative('Base price must be positive (in cents)'),
  images: z.array(z.string().url('Image must be a valid URL')).min(1, 'At least one image is required'),
  stock: z.number().int().nonnegative('General stock must be positive'),
  variants: z.array(variantSchema),
  seo: seoSchema,
  seo_en: seoSchema.optional(),
});

const updateProductSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  title: z.string().optional(),
  title_en: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  description_en: z.string().optional(),
  price: z.number().int().nonnegative().optional(),
  images: z.array(z.string().url()).optional(),
  stock: z.number().int().nonnegative().optional(),
  variants: z.array(variantSchema).optional(),
  seo: seoSchema.optional(),
  seo_en: seoSchema.optional(),
});

const updateShippingSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  shippingStatus: z.enum(['pending', 'shipped', 'delivered', 'cancelled', 'returned']),
  trackingNumber: z.string().optional().nullable(),
});

const collectionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  title_en: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  description_en: z.string().optional(),
  detailedDescription: z.string().optional().nullable(),
  detailedDescription_en: z.string().optional().nullable(),
  productIds: z.array(z.string()),
  showOnIndex: z.boolean().optional(),
  indexOrder: z.number().int().nonnegative().optional().nullable(),
  seo: seoSchema,
  seo_en: seoSchema.optional(),
});

const updateCollectionSchema = z.object({
  id: z.string().min(1, 'Collection ID is required'),
  title: z.string().min(1, 'Title is required'),
  title_en: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  description_en: z.string().optional(),
  detailedDescription: z.string().optional().nullable(),
  detailedDescription_en: z.string().optional().nullable(),
  productIds: z.array(z.string()),
  showOnIndex: z.boolean().optional(),
  indexOrder: z.number().int().nonnegative().optional().nullable(),
  seo: seoSchema,
  seo_en: seoSchema.optional(),
});

// Admin Authorization Guard Helper
async function checkAdminAuth(context: any) {
  const user = context.locals.user;
  if (!user || !user.email) {
    throw new ActionError({
      code: 'UNAUTHORIZED',
      message: 'Inicia sesión para realizar esta acción.',
    });
  }

  const superAdminEmail = (import.meta.env.SUPERADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || 'admin@flexform.com').trim().toLowerCase();
  if (user.email.trim().toLowerCase() === superAdminEmail) {
    return; // Authorized
  }

  // Check general settings
  const settings = await getGeneralSettings();
  if (settings && Array.isArray(settings.admins)) {
    const normalizedAdmins = settings.admins.map((email: string) => email.trim().toLowerCase());
    if (normalizedAdmins.includes(user.email.trim().toLowerCase())) {
      return; // Authorized
    }
  }

  throw new ActionError({
    code: 'UNAUTHORIZED',
    message: 'No tienes permisos de administrador para realizar esta acción.',
  });
}

export const server = {
  // Action to create a new product doc in Firestore
  createProduct: defineAction({
    accept: 'json',
    input: createProductSchema,
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        const { slug } = input;
        
        // Ensure slug is unique
        const existingProducts = await db.collection('products').where('slug', '==', slug).get();
        if (!existingProducts.empty) {
          throw new ActionError({
            code: 'CONFLICT',
            message: `A product with the slug '${slug}' already exists.`,
          });
        }

        const newDocRef = db.collection('products').doc();
        const productData = {
          id: newDocRef.id,
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await newDocRef.set(productData);

        return { success: true, productId: newDocRef.id };
      } catch (error: any) {
        console.error('Error in createProduct action:', error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to create product.',
        });
      }
    },
  }),

  // Action to update an existing product doc in Firestore
  updateProduct: defineAction({
    accept: 'json',
    input: updateProductSchema,
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        const { id, ...updates } = input;
        const productRef = db.collection('products').doc(id);
        const productSnap = await productRef.get();

        if (!productSnap.exists) {
          throw new ActionError({
            code: 'NOT_FOUND',
            message: 'Product not found.',
          });
        }

        const updateData: Record<string, any> = {
          ...updates,
          updatedAt: new Date(),
        };

        // If slug is changing, verify uniqueness
        if (updates.slug) {
          const duplicateSlugCheck = await db
            .collection('products')
            .where('slug', '==', updates.slug)
            .get();
          
          const duplicateDocs = duplicateSlugCheck.docs.filter((doc) => doc.id !== id);
          if (duplicateDocs.length > 0) {
            throw new ActionError({
              code: 'CONFLICT',
              message: `The slug '${updates.slug}' is already in use by another product.`,
            });
          }
        }

        await productRef.update(updateData);

        return { success: true };
      } catch (error: any) {
        console.error('Error in updateProduct action:', error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to update product.',
        });
      }
    },
  }),

  // Action to update order status and trigger email
  updateShippingStatus: defineAction({
    accept: 'json',
    input: updateShippingSchema,
    handler: async (input, context) => {
      await checkAdminAuth(context);

      const { orderId, shippingStatus, trackingNumber } = input;

      try {
        const orderRef = db.collection('orders').doc(orderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
          throw new ActionError({
            code: 'NOT_FOUND',
            message: 'Order not found.',
          });
        }

        const order = orderSnap.data() as Order;

        // Perform the Firestore write
        await orderRef.update({
          shippingStatus,
          trackingNumber,
          updatedAt: new Date(),
        });

        // Trigger shipping confirmation email via Resend if email is provided
        if (order.customerDetails.email && shippingStatus === 'shipped') {
          const emailSettings = await getEmailSettings();
          const trackingLink = `https://www.packagetrackr.com/?number=${trackingNumber}`; // Customize track url
          
          const emailContent = emailSettings.shippedBody
            .replace(/{{customerName}}/g, order.customerDetails.name || 'Cliente')
            .replace(/{{orderId}}/g, orderId)
            .replace(/{{trackingNumber}}/g, trackingNumber || '')
            .replace(/{{trackingUrl}}/g, trackingLink);

          const subject = emailSettings.shippedSubject
            .replace(/{{customerName}}/g, order.customerDetails.name || 'Cliente')
            .replace(/{{orderId}}/g, orderId.slice(-6).toUpperCase());

          await sendEmail({
            to: order.customerDetails.email,
            subject,
            html: emailContent,
          });
        }

        return { success: true };
      } catch (error: any) {
        console.error('Error in updateShippingStatus action:', error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to update shipping status.',
        });
      }
    },
  }),

  deleteOrder: defineAction({
    accept: 'json',
    input: z.object({
      orderId: z.string().min(1, 'Order ID is required'),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);

      const { orderId } = input;

      try {
        const orderRef = db.collection('orders').doc(orderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
          throw new ActionError({
            code: 'NOT_FOUND',
            message: 'Order not found.',
          });
        }

        await orderRef.delete();
        return { success: true };
      } catch (error: any) {
        console.error('Error in deleteOrder action:', error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to delete order.',
        });
      }
    },
  }),

  requestOrderReturn: defineAction({
    accept: 'json',
    input: z.object({
      orderId: z.string().min(1),
      reason: z.string().min(1),
      images: z.array(z.string().url()),
    }),
    handler: async (input, context) => {
      // Rate Limit Check
      const ip = context.clientAddress || '127.0.0.1';
      const rateLimit = await checkRateLimit('email', ip);
      if (!rateLimit.success) {
        throw new ActionError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Demasiadas solicitudes de devolución. Por favor, intenta de nuevo más tarde.',
        });
      }

      const user = context.locals.user;
      if (!user) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión para solicitar una devolución.',
        });
      }

      const { orderId, reason, images } = input;

      try {
        const orderRef = db.collection('orders').doc(orderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
          throw new ActionError({
            code: 'NOT_FOUND',
            message: 'Pedido no encontrado.',
          });
        }

        const order = orderSnap.data();
        if (!order) {
          throw new ActionError({
            code: 'NOT_FOUND',
            message: 'Pedido no encontrado.',
          });
        }

        // Ensure this order belongs to the user
        if (order.userId !== user.uid && order.customerDetails?.email !== user.email) {
          throw new ActionError({
            code: 'FORBIDDEN',
            message: 'No tienes permiso para modificar este pedido.',
          });
        }

        await orderRef.update({
          returnRequest: {
            reason,
            images,
            status: 'pending',
            requestedAt: new Date().toISOString()
          },
          updatedAt: new Date()
        });

        return { success: true };
      } catch (error: any) {
        console.error('Error requesting return:', error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error.message || 'Error al solicitar la devolución.',
        });
      }
    }
  }),

  uploadReturnImage: defineAction({
    accept: 'json',
    input: z.object({
      base64Data: z.string(),
      fileName: z.string(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión para subir imágenes.',
        });
      }

      try {
        const { base64Data, fileName } = input;
        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Content, 'base64');
        const bucketName = process.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'f3-flexformfitness.firebasestorage.app';
        const bucket = admin.storage().bucket(bucketName);
        const file = bucket.file(`returns/${user.uid}_${Date.now()}_${fileName}`);

        const downloadToken = randomUUID();
        await file.save(buffer, {
          metadata: {
            contentType: 'image/webp',
            metadata: {
              firebaseStorageDownloadTokens: downloadToken,
            },
          },
        });

        try {
          await file.makePublic();
        } catch (aclError) {
          // Uniform bucket-level access is enabled on Firebase. Individual object ACLs are ignored.
        }

        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${downloadToken}`;
        return { success: true, url: downloadUrl };
      } catch (error: any) {
        console.error('Error uploading return image:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al subir la imagen.',
        });
      }
    }
  }),

  updateReturnStatus: defineAction({
    accept: 'json',
    input: z.object({
      orderId: z.string().min(1),
      status: z.enum(['approved', 'rejected']),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);
      const { orderId, status } = input;

      try {
        const orderRef = db.collection('orders').doc(orderId);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
          throw new ActionError({
            code: 'NOT_FOUND',
            message: 'Pedido no encontrado.',
          });
        }

        const updateData: any = {
          'returnRequest.status': status,
          updatedAt: new Date()
        };

        if (status === 'approved') {
          updateData.shippingStatus = 'returned';
          updateData.paymentStatus = 'refunded';
        }

        await orderRef.update(updateData);
        return { success: true };
      } catch (error: any) {
        console.error('Error updating return status:', error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error.message || 'Error al actualizar el estado de devolución.',
        });
      }
    }
  }),

  // Action to delete a product from Firestore
  deleteProduct: defineAction({
    accept: 'json',
    input: z.object({
      id: z.string().min(1, 'Product ID is required'),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        const productRef = db.collection('products').doc(input.id);
        const productSnap = await productRef.get();

        if (!productSnap.exists) {
          throw new ActionError({
            code: 'NOT_FOUND',
            message: 'Product not found.',
          });
        }

        await productRef.delete();

        return { success: true };
      } catch (error: any) {
        console.error('Error in deleteProduct action:', error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to delete product.',
        });
      }
    },
  }),

  // Action to create a new collection
  createCollection: defineAction({
    accept: 'json',
    input: collectionSchema,
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        const existingSnap = await db.collection('collections').where('slug', '==', input.slug).get();
        if (!existingSnap.empty) {
          throw new ActionError({
            code: 'CONFLICT',
            message: 'A collection with this slug already exists.',
          });
        }



        const docRef = db.collection('collections').doc();
        await docRef.set({
          id: docRef.id,
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return { success: true, id: docRef.id };
      } catch (error: any) {
        console.error('Error in createCollection action:', error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to create collection.',
        });
      }
    },
  }),

  // Action to update an existing collection
  updateCollection: defineAction({
    accept: 'json',
    input: updateCollectionSchema,
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        const { id, ...data } = input;
        const colRef = db.collection('collections').doc(id);
        const colSnap = await colRef.get();

        if (!colSnap.exists) {
          throw new ActionError({
            code: 'NOT_FOUND',
            message: 'Collection not found.',
          });
        }

        const existingSnap = await db.collection('collections')
          .where('slug', '==', data.slug)
          .get();
        
        const otherDocs = existingSnap.docs.filter((doc) => doc.id !== id);
        if (otherDocs.length > 0) {
          throw new ActionError({
            code: 'CONFLICT',
            message: 'Another collection with this slug already exists.',
          });
        }



        await colRef.update({
          ...data,
          updatedAt: new Date(),
        });

        return { success: true };
      } catch (error: any) {
        console.error('Error in updateCollection action:', error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to update collection.',
        });
      }
    },
  }),

  // Action to delete a collection
  deleteCollection: defineAction({
    accept: 'json',
    input: z.object({
      id: z.string().min(1, 'Collection ID is required'),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        const colRef = db.collection('collections').doc(input.id);
        const colSnap = await colRef.get();

        if (!colSnap.exists) {
          throw new ActionError({
            code: 'NOT_FOUND',
            message: 'Collection not found.',
          });
        }

        await colRef.delete();

        return { success: true };
      } catch (error: any) {
        console.error('Error in deleteCollection action:', error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to delete collection.',
        });
      }
    },
  }),

  // Action to save General Settings in Firestore
  updateGeneralSettings: defineAction({
    accept: 'json',
    input: z.object({
      shippingPrice: z.number().int().nonnegative(),
      freeShippingMin: z.number().int().nonnegative(),
      markets: z.array(z.string()),
      admins: z.array(z.string()),
      logoUrl: z.string().optional(),
      faviconUrl: z.string().optional(),
      heroVideoUrl: z.string().optional(),
      megaMenu: z.object({
        section1: z.object({
          title: z.string().min(1, 'El título de la sección 1 es obligatorio'),
          titleEn: z.string().optional(),
          collectionIds: z.array(z.string()),
        }),
        section2: z.object({
          title: z.string().min(1, 'El título de la sección 2 es obligatorio'),
          titleEn: z.string().optional(),
          collectionIds: z.array(z.string()),
        }),
        promo1: z.object({
          imageUrl: z.string(),
          title: z.string().optional(),
          titleEn: z.string().optional(),
          subtitle: z.string().optional(),
          subtitleEn: z.string().optional(),
          linkUrl: z.string().optional(),
        }),
        promo2: z.object({
          imageUrl: z.string(),
          title: z.string().optional(),
          titleEn: z.string().optional(),
          subtitle: z.string().optional(),
          subtitleEn: z.string().optional(),
          linkUrl: z.string().optional(),
        }),
      }).optional(),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        console.log('updateGeneralSettings action payload received:', JSON.stringify(input, null, 2));
        await db.collection('settings').doc('general').set({
          ...input,
          updatedAt: new Date(),
        }, { merge: true });

        clearSettingsCache();
        return { success: true };
      } catch (error: any) {
        console.error('Error in updateGeneralSettings action:', error);
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to update general settings.',
        });
      }
    },
  }),

  // Action to trigger a manual Vercel rebuild for pending changes
  publishChanges: defineAction({
    accept: 'json',
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        await triggerRebuild();
        return { success: true };
      } catch (error: any) {
        console.error('Error in publishChanges action:', error);
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to publish changes.',
        });
      }
    },
  }),

  createDiscountCode: defineAction({
    accept: 'json',
    input: z.object({
      code: z.string().min(1),
      discountType: z.enum(['percent', 'amount']),
      value: z.number().positive(),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        const { code, discountType, value } = input;
        
        // 1. Create a coupon in Stripe
        const couponParams: Stripe.CouponCreateParams = {
          duration: 'forever',
        };

        if (discountType === 'percent') {
          couponParams.percent_off = value;
        } else {
          couponParams.amount_off = Math.round(value * 100); // convert dollars/euros to cents
          couponParams.currency = 'usd'; // using store currency
        }

        const coupon = await stripe.coupons.create(couponParams);

        // 2. Create the promotion code linked to that coupon
        const promoCode = await stripe.promotionCodes.create({
          coupon: coupon.id,
          code: code.trim().toUpperCase(),
        });

        return { success: true, promoCodeId: promoCode.id };
      } catch (error: any) {
        console.error('Error in createDiscountCode action:', error);
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to create discount code.',
        });
      }
    },
  }),

  deactivateDiscountCode: defineAction({
    accept: 'json',
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        const { id } = input;
        
        // Deactivate the promotion code
        await stripe.promotionCodes.update(id, {
          active: false,
        });

        return { success: true };
      } catch (error: any) {
        console.error('Error in deactivateDiscountCode action:', error);
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error.message || 'Failed to deactivate discount code.',
        });
      }
    },
  }),

  validatePromoCode: defineAction({
    accept: 'json',
    input: z.object({
      code: z.string().min(1),
    }),
    handler: async (input, context) => {
      // Rate Limit Check to prevent brute-forcing coupon codes
      const ip = context.clientAddress || '127.0.0.1';
      const rateLimit = await checkRateLimit('checkout', ip);
      if (!rateLimit.success) {
        throw new ActionError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Demasiadas solicitudes de validación de código. Por favor, intenta de nuevo más tarde.',
        });
      }

      try {
        const { code } = input;
        
        // List promotion codes matching this exact code that are active
        const promoCodes = await stripe.promotionCodes.list({
          code: code.trim().toUpperCase(),
          active: true,
          limit: 1,
          expand: ['data.coupon'],
        });

        if (promoCodes.data.length === 0) {
          throw new ActionError({
            code: 'NOT_FOUND',
            message: 'El código de descuento no existe o ya no está activo.',
          });
        }

        const promoCode = promoCodes.data[0];
        const coupon = promoCode.coupon;

        return {
          success: true,
          id: promoCode.id,
          code: promoCode.code,
          coupon: {
            id: coupon.id,
            percent_off: coupon.percent_off || null,
            amount_off: coupon.amount_off || null,
          },
        };
      } catch (error: any) {
        console.error('Error in validatePromoCode action:', error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: error.message || 'Error al validar el código promocional.',
        });
      }
    },
  }),

  getDbCart: defineAction({
    accept: 'json',
    handler: async (_, context) => {
      const user = context.locals.user;
      if (!user || !user.uid) {
        return {};
      }
      try {
        const cartSnap = await db.collection('carts').doc(user.uid).get();
        if (cartSnap.exists) {
          return cartSnap.data()?.items || {};
        }
        return {};
      } catch (error) {
        console.error('Error fetching DB cart:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al recuperar el carrito de la base de datos.',
        });
      }
    },
  }),

  saveDbCart: defineAction({
    accept: 'json',
    input: z.object({
      items: z.record(z.any()),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user || !user.uid) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión para guardar el carrito.',
        });
      }
      try {
        const { items } = input;
        await db.collection('carts').doc(user.uid).set({
          items,
          updatedAt: new Date(),
        });
        return { success: true };
      } catch (error) {
        console.error('Error saving DB cart:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al guardar el carrito en la base de datos.',
        });
      }
    },
  }),

  uploadImage: defineAction({
    accept: 'json',
    input: z.object({
      base64Data: z.string(),
      fileName: z.string(),
      folder: z.string().optional(),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        const { base64Data, fileName, folder = 'products' } = input;
        
        // Decode base64
        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Content, 'base64');

        const bucketName = import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'f3-flexformfitness.firebasestorage.app';
        const bucket = admin.storage().bucket(bucketName);
        
        const pathPrefix = folder.endsWith('/') ? folder : `${folder}/`;
        const file = bucket.file(`${pathPrefix}${fileName}`);

        const downloadToken = randomUUID();

        await file.save(buffer, {
          metadata: {
            contentType: 'image/webp',
            metadata: {
              firebaseStorageDownloadTokens: downloadToken,
            },
          },
        });

        try {
          await file.makePublic();
        } catch (aclError) {
          // Uniform bucket-level access is enabled on Firebase. Individual object ACLs are ignored.
          // The token-based download URL will still work perfectly for customers.
        }

        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${downloadToken}`;

        return { success: true, url: downloadUrl };
      } catch (error: any) {
        console.error('Error in uploadImage action:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al subir la imagen al servidor.',
        });
      }
    },
  }),

  deleteImage: defineAction({
    accept: 'json',
    input: z.object({
      url: z.string().url(),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        const { url } = input;
        
        // Extract filePath in Firebase Storage from URL
        const match = url.match(/\/o\/([^?#]+)/);
        if (!match || !match[1]) {
          throw new Error('Formato de URL de almacenamiento inválido.');
        }

        const filePath = decodeURIComponent(match[1]);

        // Guard: Only allow deleting files under products/crops/ and products/gallery/ to avoid accidental deletions of other critical assets
        if (!filePath.startsWith('products/crops/') && !filePath.startsWith('products/gallery/')) {
          throw new Error('Sólo está permitido eliminar imágenes de la galería o recortadas.');
        }

        const bucketName = import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'f3-flexformfitness.firebasestorage.app';
        const bucket = admin.storage().bucket(bucketName);
        const file = bucket.file(filePath);

        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`Successfully deleted image from Storage: ${filePath}`);
        }

        // If the deleted image was an original gallery image, find and delete all its associated crops
        if (filePath.startsWith('products/gallery/')) {
          const originalFileName = filePath.split('/').pop() || '';
          const cleanBaseName = originalFileName.replace(/\.[^/.]+$/, ""); // strip extension
          
          if (cleanBaseName) {
            try {
              // List files in the crops folder
              const [croppedFiles] = await bucket.getFiles({
                prefix: 'products/crops/'
              });
              
              // Filter files that contain the cleanBaseName in their name
              const filesToDelete = croppedFiles.filter(f => f.name.includes(`crop_${cleanBaseName}`));
              
              for (const cropFile of filesToDelete) {
                const [cropExists] = await cropFile.exists();
                if (cropExists) {
                  await cropFile.delete();
                  console.log(`Deleted associated cropped image: ${cropFile.name}`);
                }
              }
            } catch (cropDelErr) {
              console.error('Error deleting associated cropped images:', cropDelErr);
            }
          }
        }

        return { success: true };
      } catch (error: any) {
        console.error('Error in deleteImage action:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al eliminar la imagen del servidor.',
        });
      }
    },
  }),

  listUploadedImages: defineAction({
    accept: 'json',
    handler: async (_, context) => {
      await checkAdminAuth(context);

      try {
        const bucketName = import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'f3-flexformfitness.firebasestorage.app';
        const bucket = admin.storage().bucket(bucketName);
        
        // List files in the products/gallery/ folder to save API list overhead and only get standard images
        const [files] = await bucket.getFiles({ prefix: 'products/gallery/' });

        const images = await Promise.all(
          files.map(async (file) => {
            // Ignore folder placeholders
            if (file.name.endsWith('/')) return null;

            try {
              const [metadata] = await file.getMetadata();
              let token = metadata.metadata?.firebaseStorageDownloadTokens;

              // Auto-repair missing tokens
              if (!token) {
                token = randomUUID();
                await file.setMetadata({
                  metadata: {
                    firebaseStorageDownloadTokens: token,
                  },
                });
              }

              const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${token}`;

              return {
                name: file.name.replace('products/gallery/', ''),
                url: downloadUrl,
                timeCreated: metadata.timeCreated || new Date().toISOString(),
              };
            } catch (fileErr) {
              console.error(`Error loading metadata for file ${file.name}:`, fileErr);
              return null;
            }
          })
        );

        // Filter out nulls and sort newest-first
        const validImages = images
          .filter((img): img is { name: string; url: string; timeCreated: string } => img !== null)
          .sort((a, b) => new Date(b.timeCreated).getTime() - new Date(a.timeCreated).getTime());

        return { success: true, images: validImages };
      } catch (error: any) {
        console.error('Error in listUploadedImages action:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al listar las imágenes de Firebase.',
        });
      }
    },
  }),

  uploadVideo: defineAction({
    accept: 'json',
    input: z.object({
      base64Data: z.string(),
      fileName: z.string(),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        const { base64Data, fileName } = input;
        
        // Decode base64
        const base64Content = base64Data.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Content, 'base64');

        const bucketName = import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'f3-flexformfitness.firebasestorage.app';
        const bucket = admin.storage().bucket(bucketName);
        const file = bucket.file(`videos/${fileName}`);

        const downloadToken = randomUUID();
        const fileExt = fileName.split('.').pop()?.toLowerCase() || 'mp4';
        const contentType = fileExt === 'webm' ? 'video/webm' : 'video/mp4';

        await file.save(buffer, {
          metadata: {
            contentType: contentType,
            metadata: {
              firebaseStorageDownloadTokens: downloadToken,
            },
          },
        });

        try {
          await file.makePublic();
        } catch (aclError) {
          // Ignore uniformity issue
        }

        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${downloadToken}`;

        return { success: true, url: downloadUrl };
      } catch (error: any) {
        console.error('Error in uploadVideo action:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al subir el video al servidor.',
        });
      }
    },
  }),

  deleteVideo: defineAction({
    accept: 'json',
    input: z.object({
      url: z.string().url(),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        const { url } = input;
        
        // Extract filePath in Firebase Storage from URL
        const match = url.match(/\/o\/([^?#]+)/);
        if (!match || !match[1]) {
          throw new Error('Formato de URL de almacenamiento inválido.');
        }

        const filePath = decodeURIComponent(match[1]);

        // Guard: Only allow deleting files in videos folder
        if (!filePath.startsWith('videos/')) {
          throw new Error('Sólo está permitido eliminar videos de la carpeta videos.');
        }

        const bucketName = import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'f3-flexformfitness.firebasestorage.app';
        const bucket = admin.storage().bucket(bucketName);
        const file = bucket.file(filePath);

        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`Successfully deleted video from Storage: ${filePath}`);
        }

        return { success: true };
      } catch (error: any) {
        console.error('Error in deleteVideo action:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al eliminar el video del servidor.',
        });
      }
    },
  }),

  listUploadedVideos: defineAction({
    accept: 'json',
    handler: async (_, context) => {
      await checkAdminAuth(context);

      try {
        const bucketName = import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'f3-flexformfitness.firebasestorage.app';
        const bucket = admin.storage().bucket(bucketName);
        
        // List files in the videos/ folder
        const [files] = await bucket.getFiles({ prefix: 'videos/' });

        const videos = await Promise.all(
          files.map(async (file) => {
            // Ignore folder placeholders
            if (file.name.endsWith('/')) return null;

            try {
              const [metadata] = await file.getMetadata();
              let token = metadata.metadata?.firebaseStorageDownloadTokens;

              // Auto-repair missing tokens
              if (!token) {
                token = randomUUID();
                await file.setMetadata({
                  metadata: {
                    firebaseStorageDownloadTokens: token,
                  },
                });
              }

              const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${token}`;

              return {
                name: file.name.replace('videos/', ''),
                url: downloadUrl,
                timeCreated: metadata.timeCreated || new Date().toISOString(),
              };
            } catch (fileErr) {
              console.error(`Error loading metadata for file ${file.name}:`, fileErr);
              return null;
            }
          })
        );

        // Filter out nulls and sort newest-first
        const validVideos = videos
          .filter((vid): vid is { name: string; url: string; timeCreated: string } => vid !== null)
          .sort((a, b) => new Date(b.timeCreated).getTime() - new Date(a.timeCreated).getTime());

        return { success: true, videos: validVideos };
      } catch (error: any) {
        console.error('Error in listUploadedVideos action:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al listar los videos de Firebase.',
        });
      }
    },
  }),

  saveUserProfile: defineAction({
    accept: 'json',
    input: z.object({
      name: z.string(),
      phone: z.string(),
      address: z.object({
        line1: z.string(),
        line2: z.string().nullable().optional(),
        city: z.string(),
        state: z.string(),
        postal_code: z.string(),
        country: z.string(),
      }),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user || !user.uid) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión para actualizar tu perfil.',
        });
      }
      try {
        await db.collection('customers').doc(user.uid).set({
          name: input.name,
          name_lowercase: input.name.toLowerCase(),
          phone: input.phone,
          address: input.address,
          updatedAt: new Date(),
        }, { merge: true });
        
        await admin.auth().updateUser(user.uid, {
          displayName: input.name,
        });

        return { success: true };
      } catch (error) {
        console.error('Error saving user profile:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error al actualizar el perfil en la base de datos.',
        });
      }
    },
  }),

  getEmailSettings: defineAction({
    accept: 'json',
    handler: async (_, context) => {
      await checkAdminAuth(context);
      try {
        const settings = await getEmailSettings();
        return settings;
      } catch (error: any) {
        console.error('Error in getEmailSettings action:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al obtener la configuración de emails.',
        });
      }
    },
  }),

  updateEmailSettings: defineAction({
    accept: 'json',
    input: z.object({
      orderSubject: z.string(),
      orderBody: z.string(),
      abandonedSubject: z.string(),
      abandonedBody: z.string(),
      shippedSubject: z.string(),
      shippedBody: z.string(),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        await db.collection('settings').doc('email').set({
          ...input,
          updatedAt: new Date(),
        }, { merge: true });
        return { success: true };
      } catch (error: any) {
        console.error('Error in updateEmailSettings action:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al guardar la configuración de emails.',
        });
      }
    },
  }),

  getOrdersList: defineAction({
    accept: 'json',
    input: z.object({
      search: z.string().optional(),
      limit: z.number().default(50),
      lastVisibleId: z.string().optional(),
      paymentStatus: z.string().optional(),
      shippingStatus: z.string().optional(),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        const { search, limit, lastVisibleId, paymentStatus, shippingStatus } = input;
        let query = db.collection('orders') as any;

        // Apply filters
        if (paymentStatus) {
          query = query.where('paymentStatus', '==', paymentStatus);
        }

        // Handle shipping/return filters
        if (shippingStatus) {
          if (shippingStatus === 'return_pending') {
            query = query.where('returnRequest.status', '==', 'pending');
          } else {
            query = query.where('shippingStatus', '==', shippingStatus);
          }
        }

        // Apply search query (prefix match on order ID or email)
        if (search && search.trim() !== '') {
          const term = search.trim().toLowerCase();
          if (term.startsWith('cs_') || term.length > 10) {
            query = query.where('id', '>=', term).where('id', '<=', term + '\uf8ff');
          } else {
            query = query.where('customerDetails.email', '>=', term).where('customerDetails.email', '<=', term + '\uf8ff');
          }
        } else {
          // If no search, we sort by newest createdAt by default
          query = query.orderBy('createdAt', 'desc');
        }

        // Pagination cursor
        if (lastVisibleId) {
          const lastDoc = await db.collection('orders').doc(lastVisibleId).get();
          if (lastDoc.exists) {
            query = query.startAfter(lastDoc);
          }
        }

        // Retrieve limit + 1
        const snap = await query.limit(limit + 1).get();
        const docs = snap.docs;
        const hasMore = docs.length > limit;
        const items = hasMore ? docs.slice(0, limit) : docs;

        const orders = items.map((doc: any) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          };
        });

        const nextVisibleId = hasMore && items.length > 0 ? items[items.length - 1].id : null;

        return {
          success: true,
          orders,
          nextVisibleId,
          hasMore,
        };
      } catch (error: any) {
        console.error('Error in getOrdersList action:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al obtener la lista de pedidos.',
        });
      }
    }
  }),

  getAbandonedCarts: defineAction({
    accept: 'json',
    input: z.object({
      limit: z.number().default(20),
      lastVisibleId: z.string().optional(),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        const { limit, lastVisibleId } = input;
        
        let query = db.collection('carts') as any;
        query = query.orderBy('updatedAt', 'desc');

        if (lastVisibleId) {
          const lastDoc = await db.collection('carts').doc(lastVisibleId).get();
          if (lastDoc.exists) {
            query = query.startAfter(lastDoc);
          }
        }

        // Overfetch slightly to account for possible empty/purchased carts
        const snap = await query.limit(limit + 5).get();
        const docs = snap.docs;
        const hasMore = docs.length > limit;
        const items = docs.slice(0, limit);

        const abandonedCarts: any[] = [];

        const userUids = items.map((doc: any) => doc.id);
        const userRecordsPromises = userUids.map(async (uid: string) => {
          try {
            return await admin.auth().getUser(uid);
          } catch {
            return null;
          }
        });
        const userRecords = await Promise.all(userRecordsPromises);
        const userEmails = userRecords.map(r => r?.email).filter(Boolean) as string[];

        let ordersList: any[] = [];
        if (userEmails.length > 0) {
          // Chunk emails into groups of 30 if needed (but limit is 20, so userEmails <= 20)
          const ordersSnap = await db.collection('orders')
            .where('customerDetails.email', 'in', userEmails)
            .get();
          
          ordersList = ordersSnap.docs.map(doc => ({
            email: doc.data().customerDetails?.email || '',
            createdAt: doc.data().createdAt?.toDate() || new Date(0)
          }));
        }

        const consentsMap: { [email: string]: any } = {};
        if (userEmails.length > 0) {
          const consentsSnap = await db.collection('marketing_consents')
            .where('email', 'in', userEmails.map(e => e.toLowerCase().trim()))
            .get();
          consentsSnap.docs.forEach(doc => {
            consentsMap[doc.id.toLowerCase().trim()] = doc.data();
          });
        }

        const customersMap: { [uid: string]: any } = {};
        if (userUids.length > 0) {
          const customersSnap = await db.collection('customers')
            .where(admin.firestore.FieldPath.documentId(), 'in', userUids)
            .get();
          customersSnap.docs.forEach(doc => {
            customersMap[doc.id] = doc.data();
          });
        }

        for (let i = 0; i < items.length; i++) {
          const doc = items[i];
          const userId = doc.id;
          const userRecord = userRecords[i];
          if (!userRecord) continue;

          const cartData = doc.data();
          const cartItems = cartData.items || {};
          const cartUpdatedAt = cartData.updatedAt?.toDate() || new Date(0);

          if (Object.keys(cartItems).length === 0) {
            continue;
          }

          const userEmail = userRecord.email;
          const userName = userRecord.displayName || 'Cliente';
          if (!userEmail) continue;

          const hasPurchasedSince = ordersList.some(order => 
            order.email.toLowerCase() === userEmail.toLowerCase() && 
            order.createdAt >= cartUpdatedAt
          );

          if (hasPurchasedSince) {
            continue;
          }

          let marketingConsent = true;
          const customerData = customersMap[userId];
          if (customerData && customerData.marketingConsent !== undefined) {
            marketingConsent = customerData.marketingConsent;
          } else {
            const consentData = consentsMap[userEmail.toLowerCase().trim()];
            if (consentData) {
              marketingConsent = consentData.consent ?? true;
            }
          }

          const itemsList = Object.values(cartItems);
          let totalAmount = 0;
          itemsList.forEach((item: any) => {
            totalAmount += (item.price || 0) * (item.quantity || 0);
          });

          abandonedCarts.push({
            userId,
            email: userEmail,
            name: userName,
            updatedAt: cartUpdatedAt.toISOString(),
            items: itemsList,
            totalAmount,
            marketingConsent,
          });
        }

        const nextVisibleId = hasMore && items.length > 0 ? items[items.length - 1].id : null;

        return { 
          success: true, 
          carts: abandonedCarts,
          nextVisibleId,
          hasMore
        };
      } catch (error: any) {
        console.error('Error in getAbandonedCarts action:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al obtener los carritos abandonados.',
        });
      }
    },
  }),

  sendAbandonedCartEmail: defineAction({
    accept: 'json',
    input: z.object({
      userId: z.string(),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        const { userId } = input;
        const cartDoc = await db.collection('carts').doc(userId).get();
        if (!cartDoc.exists) {
          throw new Error('No se encontró el carrito del usuario.');
        }

        const cartData = cartDoc.data();
        const items = cartData?.items || {};
        if (Object.keys(items).length === 0) {
          throw new Error('El carrito del usuario está vacío.');
        }

        const userRecord = await admin.auth().getUser(userId);
        const userEmail = userRecord.email;
        const userName = userRecord.displayName || 'Cliente';

        if (!userEmail) {
          throw new Error('El usuario no tiene una dirección de correo válida.');
        }

        const emailSettings = await getEmailSettings();
        const siteUrl = process.env.PUBLIC_SITE_URL || 'https://flexformfitness.vercel.app';

        // Format items as HTML
        const itemsList = Object.values(items);
        const itemsHtml = `<ul>
          ${itemsList
            .map(
              (item: any) => `
            <li>
              ${item.title} ${item.variantName ? `(${item.variantName})` : ''} - 
              Cantidad: ${item.quantity} - 
              Precio: $${((item.price || 0) / 100).toFixed(2)}
            </li>`
            )
            .join('')}
        </ul>`;

        const recoveryUrl = `${siteUrl}/carrito`;

        // Replace placeholders
        const subject = emailSettings.abandonedSubject
          .replace(/{{customerName}}/g, userName)
          .replace(/{{recoveryUrl}}/g, recoveryUrl);

        const unsubscribeUrl = `${siteUrl}/desuscribir?email=${encodeURIComponent(userEmail)}`;
        let html = emailSettings.abandonedBody
          .replace(/{{customerName}}/g, userName)
          .replace(/{{orderItems}}/g, itemsHtml)
          .replace(/{{recoveryUrl}}/g, recoveryUrl);

        if (html.includes('{{unsubscribeUrl}}')) {
          html = html.replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);
        } else {
          html += `<p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 40px; font-family: sans-serif;">
            Recibiste este correo porque dejaste artículos en tu carrito. Si no deseas recibir más correos promocionales o de recuperación, puedes 
            <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">darte de baja aquí</a>.
          </p>`;
        }

        await sendEmail({
          to: userEmail,
          subject,
          html,
        });

        console.log(`[sendAbandonedCartEmail] Recovery email sent successfully to ${userEmail}`);

        return { success: true };
      } catch (error: any) {
        console.error('Error in sendAbandonedCartEmail action:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al enviar el correo de recuperación.',
        });
      }
    },
  }),

  sendTestEmail: defineAction({
    accept: 'json',
    handler: async (_, context) => {
      await checkAdminAuth(context);
      try {
        const recipient = process.env.SUPERADMIN_EMAIL || process.env.SMTP_USER || 'tech@flexformfitness.com';
        
        await sendEmail({
          to: recipient,
          subject: 'Prueba de Correo desde el Panel de Administración 🎉',
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <h2 style="color: #e11d48; margin-top: 0;">¡Conexión SMTP exitosa!</h2>
              <p>Este es un correo de prueba enviado desde tu Panel de Administración de FlexForm Fitness.</p>
              <p>Tu configuración de Nodemailer y Google Workspace está funcionando correctamente.</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <small style="color: #666;">Enviado el: ${new Date().toLocaleString()}</small>
            </div>
          `,
        });

        console.log(`[sendTestEmail] Test email sent successfully to ${recipient}`);
        return { success: true, recipient };
      } catch (error: any) {
        console.error('Error in sendTestEmail action:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al enviar el correo de prueba.',
        });
      }
    },
  }),

  saveMarketingConsent: defineAction({
    accept: 'json',
    input: z.object({
      email: z.string().email(),
      consent: z.boolean(),
      name: z.string().optional(),
      userId: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const consentData = {
          email: input.email.toLowerCase().trim(),
          name: input.name || '',
          consent: input.consent,
          updatedAt: new Date(),
        };

        if (input.userId) {
          await db.collection('customers').doc(input.userId).set({
            email: input.email.toLowerCase().trim(),
            name: input.name || '',
            name_lowercase: (input.name || '').toLowerCase(),
            marketingConsent: input.consent,
            updatedAt: new Date(),
          }, { merge: true });
        }

        await db.collection('marketing_consents').doc(input.email.toLowerCase().trim()).set(consentData);

        console.log(`[saveMarketingConsent] Registered consent for ${input.email}: ${input.consent}`);
        return { success: true };
      } catch (err: any) {
        console.error('Error saving marketing consent:', err);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || 'Error al guardar el consentimiento de marketing.',
        });
      }
    },
  }),

  getUsersList: defineAction({
    accept: 'json',
    input: z.object({
      search: z.string().optional(),
      limit: z.number().default(50),
      lastVisibleId: z.string().optional(),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        // Sync Firebase Authentication users into Firestore customers collection (Self-healing)
        try {
          const authUsersResult = await admin.auth().listUsers();
          const authUsers = authUsersResult.users;
          const authUserIds = new Set(authUsers.map(u => u.uid));
          const customersSnap = await db.collection('customers').get();
          const customerIds = new Set(customersSnap.docs.map(doc => doc.id));
          const batch = db.batch();
          let needsCommit = false;

          // 1. Add missing or heal existing active customers
          for (const authUser of authUsers) {
            if (!customerIds.has(authUser.uid)) {
              const customerRef = db.collection('customers').doc(authUser.uid);
              batch.set(customerRef, {
                email: authUser.email || '',
                name: authUser.displayName || 'Cliente sin nombre',
                name_lowercase: (authUser.displayName || 'Cliente sin nombre').toLowerCase(),
                marketingConsent: false,
                updatedAt: new Date(authUser.metadata.creationTime || Date.now()),
              });
              needsCommit = true;
            } else {
              const doc = customersSnap.docs.find(d => d.id === authUser.uid);
              if (doc) {
                const data = doc.data();
                if (data.name && data.name_lowercase === undefined) {
                  const customerRef = db.collection('customers').doc(authUser.uid);
                  batch.update(customerRef, {
                    name_lowercase: data.name.toLowerCase()
                  });
                  needsCommit = true;
                }
              }
            }
          }

          // 2. Archive and remove deleted customers (whose UID is not in Auth anymore)
          for (const doc of customersSnap.docs) {
            if (!authUserIds.has(doc.id)) {
              const deletedRef = db.collection('deleted_customers').doc(doc.id);
              batch.set(deletedRef, {
                ...doc.data(),
                deletedAt: new Date(),
              });
              
              const customerRef = db.collection('customers').doc(doc.id);
              batch.delete(customerRef);
              
              needsCommit = true;
            }
          }

          if (needsCommit) {
            await batch.commit();
          }
        } catch (syncErr) {
          console.error('Error syncing Auth users to Firestore:', syncErr);
        }

        const { search, limit, lastVisibleId } = input;
        
        let query = db.collection('customers') as any;

        if (search && search.trim() !== '') {
          const term = search.trim();
          const lowerTerm = term.toLowerCase();
          
          if (lowerTerm.includes('@')) {
            query = query.where('email', '>=', lowerTerm).where('email', '<=', lowerTerm + '\uf8ff');
          } else {
            // Query name_lowercase directly, enabling case-insensitive prefix search
            query = query.where('name_lowercase', '>=', lowerTerm).where('name_lowercase', '<=', lowerTerm + '\uf8ff');
          }
        } else {
          // Sort by newest updatedAt by default
          query = query.orderBy('updatedAt', 'desc');
        }

        // Pagination cursor using startAfter
        if (lastVisibleId) {
          const lastDoc = await db.collection('customers').doc(lastVisibleId).get();
          if (lastDoc.exists) {
            query = query.startAfter(lastDoc);
          }
        }

        // Retrieve limit + 1 elements to determine if there is a next page
        const snap = await query.limit(limit + 1).get();
        const docs = snap.docs;
        const hasMore = docs.length > limit;
        const items = hasMore ? docs.slice(0, limit) : docs;

        const users = items.map((doc: any) => {
          const data = doc.data();
          return {
            uid: doc.id,
            email: data.email || '',
            name: data.name || 'Cliente sin nombre',
            phone: data.phone || null,
            updatedAt: data.updatedAt?.toDate()?.toISOString() || null,
            marketingConsent: data.marketingConsent ?? false,
          };
        });

        const nextVisibleId = hasMore && items.length > 0 ? items[items.length - 1].id : null;

        return {
          success: true,
          users,
          nextVisibleId,
          hasMore,
        };
      } catch (error: any) {
        console.error('Error in getUsersList action:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al obtener la lista de usuarios.',
        });
      }
    }
  }),

  exportUsersList: defineAction({
    accept: 'json',
    input: z.object({}),
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        const snap = await db.collection('customers').orderBy('updatedAt', 'desc').get();
        
        const users = snap.docs.map((doc: any) => {
          const data = doc.data();
          return {
            uid: doc.id,
            email: data.email || '',
            name: data.name || 'Cliente sin nombre',
            phone: data.phone || null,
            updatedAt: data.updatedAt?.toDate()?.toISOString() || null,
            marketingConsent: data.marketingConsent ?? false,
          };
        });

        return {
          success: true,
          users,
        };
      } catch (error: any) {
        console.error('Error in exportUsersList action:', error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al exportar la lista de usuarios.',
        });
      }
    }
  }),

  // Action to fetch a single order's details securely (prevents PII exposure in DOM)
  getOrderDetails: defineAction({
    accept: 'json',
    input: z.object({
      orderId: z.string().min(1, 'Order ID is required'),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        const orderDoc = await db.collection('orders').doc(input.orderId).get();

        if (!orderDoc.exists) {
          throw new ActionError({
            code: 'NOT_FOUND',
            message: `Order not found: ${input.orderId}`,
          });
        }

        const orderData = orderDoc.data();
        const order = {
          id: orderDoc.id,
          ...orderData,
          createdAt: orderData?.createdAt?.toDate ? orderData.createdAt.toDate().toISOString() : orderData?.createdAt,
          updatedAt: orderData?.updatedAt?.toDate ? orderData.updatedAt.toDate().toISOString() : orderData?.updatedAt,
        };

        return { success: true, order };
      } catch (error: any) {
        console.error('Error in getOrderDetails action:', error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al obtener los detalles del pedido.',
        });
      }
    },
  }),

  getUserDetails: defineAction({
    accept: 'json',
    input: z.object({
      userId: z.string().min(1, 'User ID is required'),
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        const userDoc = await db.collection('customers').doc(input.userId).get();

        if (!userDoc.exists) {
          throw new ActionError({
            code: 'NOT_FOUND',
            message: `User not found: ${input.userId}`,
          });
        }

        const userData = userDoc.data();
        const email = userData?.email;
        let orders: any[] = [];
        if (email) {
          const ordersSnap = await db.collection('orders')
            .where('customerDetails.email', '==', email)
            .get();
          
          orders = ordersSnap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
            };
          });

          // Sort orders by date descending
          orders.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });
        }

        const user = {
          uid: userDoc.id,
          ...userData,
          createdAt: userData?.createdAt?.toDate ? userData.createdAt.toDate().toISOString() : userData?.createdAt,
          updatedAt: userData?.updatedAt?.toDate ? userData.updatedAt.toDate().toISOString() : userData?.updatedAt,
        };

        return { success: true, user, orders };
      } catch (error: any) {
        console.error('Error in getUserDetails action:', error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Error al obtener los detalles del usuario.',
        });
      }
    },
  }),
};
