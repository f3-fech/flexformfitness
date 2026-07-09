import { defineAction, ActionError } from 'astro:actions';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { db, admin } from '../lib/firebase';
import { getGeneralSettings } from '../lib/settings';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' as any,
});
import { Resend } from 'resend';
import type { Order } from '../types';

const resend = new Resend(process.env.RESEND_API_KEY || '');
import { triggerRebuild } from '../lib/deploy';

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
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().int().nonnegative('Base price must be positive (in cents)'),
  images: z.array(z.string().url('Image must be a valid URL')).min(1, 'At least one image is required'),
  stock: z.number().int().nonnegative('General stock must be positive'),
  variants: z.array(variantSchema),
  seo: seoSchema,
});

const updateProductSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  title: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  price: z.number().int().nonnegative().optional(),
  images: z.array(z.string().url()).optional(),
  stock: z.number().int().nonnegative().optional(),
  variants: z.array(variantSchema).optional(),
  seo: seoSchema.optional(),
});

const updateShippingSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  shippingStatus: z.enum(['pending', 'shipped', 'delivered', 'cancelled']),
  trackingNumber: z.string().min(1, 'Tracking number is required'),
});

const collectionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  detailedDescription: z.string().optional().nullable(),
  productIds: z.array(z.string()),
  seo: seoSchema,
});

const updateCollectionSchema = z.object({
  id: z.string().min(1, 'Collection ID is required'),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  detailedDescription: z.string().optional().nullable(),
  productIds: z.array(z.string()),
  seo: seoSchema,
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
          const trackingLink = `https://www.packagetrackr.com/?number=${trackingNumber}`; // Customize track url
          
          const emailContent = `
            <h1>¡Tu pedido ha sido enviado!</h1>
            <p>Hola, ${order.customerDetails.name}. Nos complace informarte que tu pedido <strong>${orderId}</strong> ha sido enviado.</p>
            <hr />
            <p><strong>Detalles de envío:</strong></p>
            <ul>
              <li><strong>Código de Seguimiento:</strong> ${trackingNumber}</li>
              <li><strong>Estado actual:</strong> En tránsito</li>
            </ul>
            <p>Puedes seguir tu envío haciendo clic en el siguiente enlace:</p>
            <p><a href="${trackingLink}" target="_blank" style="display:inline-block;padding:10px 20px;background-color:#8b5cf6;color:white;text-decoration:none;border-radius:5px;">Seguir Pedido</a></p>
            <p>¡Gracias por comprar en FlexForm Fitness!</p>
          `;

          await resend.emails.send({
            from: 'FlexForm Fitness <shipping@flexformfitness.com>',
            to: order.customerDetails.email,
            subject: `Tu pedido ha sido enviado - FlexForm Fitness #${orderId.slice(-6).toUpperCase()}`,
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
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        await db.collection('settings').doc('general').set({
          ...input,
          updatedAt: new Date(),
        }, { merge: true });

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
    handler: async (input) => {
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
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);

      try {
        const { base64Data, fileName } = input;
        
        // Decode base64
        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Content, 'base64');

        const bucketName = import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'f3-flexformfitness.firebasestorage.app';
        const bucket = admin.storage().bucket(bucketName);
        const file = bucket.file(`products/${fileName}`);

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

        // Guard: Only allow deleting files in products folder that are cropped to avoid accidental deletions of main assets
        if (!filePath.startsWith('products/crop_')) {
          throw new Error('Sólo está permitido eliminar imágenes recortadas temporales.');
        }

        const bucketName = import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'f3-flexformfitness.firebasestorage.app';
        const bucket = admin.storage().bucket(bucketName);
        const file = bucket.file(filePath);

        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`Successfully deleted orphaned cropped image from Storage: ${filePath}`);
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
        
        // List files in the products/ folder
        const [files] = await bucket.getFiles({ prefix: 'products/' });

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
                name: file.name.replace('products/', ''),
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
};
