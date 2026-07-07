import './_astro_actions_CAHNH46J.mjs';
import { z } from 'zod';
import { db } from './firebase_CqeBG1kq.mjs';
import { g as getGeneralSettings } from './settings_C0jU3ASc.mjs';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { A as AstroError, h as ActionCalledFromServerError } from './astro/assets-service_DfW5Etn1.mjs';
import { i as isActionAPIContext } from './utils_Cwo9_uli.mjs';
import { c as callSafely, b as ActionError, d as ActionInputError } from './shared_CzD7f8ex.mjs';

function defineAction({
  accept,
  input: inputSchema,
  handler
}) {
  const serverHandler = getJsonServerHandler(handler, inputSchema);
  async function safeServerHandler(unparsedInput) {
    if (typeof this === "function" || !isActionAPIContext(this)) {
      throw new AstroError(ActionCalledFromServerError);
    }
    return callSafely(() => serverHandler(unparsedInput, this));
  }
  Object.assign(safeServerHandler, {
    orThrow(unparsedInput) {
      if (typeof this === "function") {
        throw new AstroError(ActionCalledFromServerError);
      }
      return serverHandler(unparsedInput, this);
    }
  });
  return safeServerHandler;
}
function getJsonServerHandler(handler, inputSchema) {
  return async (unparsedInput, context) => {
    if (unparsedInput instanceof FormData) {
      throw new ActionError({
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "This action only accepts JSON."
      });
    }
    if (!inputSchema) return await handler(unparsedInput, context);
    const parsed = await inputSchema.safeParseAsync(unparsedInput);
    if (!parsed.success) {
      throw new ActionInputError(parsed.error.issues);
    }
    return await handler(parsed.data, context);
  };
}

async function triggerRebuild() {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK;
  if (!hookUrl) {
    console.log("[Deploy Helper] VERCEL_DEPLOY_HOOK is not defined. Skipping automatic rebuild.");
    return;
  }
  try {
    console.log("[Deploy Helper] Triggering Vercel rebuild...");
    const response = await fetch(hookUrl, {
      method: "POST"
    });
    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log("[Deploy Helper] Rebuild triggered successfully on Vercel.", data);
    } else {
      console.error("[Deploy Helper] Failed to trigger rebuild on Vercel:", response.status, response.statusText);
    }
  } catch (error) {
    console.error("[Deploy Helper] Network error attempting to trigger rebuild on Vercel:", error);
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20"
});
const resend = new Resend(process.env.RESEND_API_KEY || "");
const variantSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Variant name is required"),
  price: z.number().int().nonnegative("Price must be positive (in cents)"),
  stock: z.number().int().nonnegative("Stock must be positive"),
  image: z.string().url("Image must be a valid URL").optional().nullable()
});
const seoSchema = z.object({
  title: z.string().min(1, "SEO title is required"),
  description: z.string().min(1, "SEO description is required"),
  keywords: z.array(z.string()).optional()
});
const createProductSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().int().nonnegative("Base price must be positive (in cents)"),
  images: z.array(z.string().url("Image must be a valid URL")).min(1, "At least one image is required"),
  stock: z.number().int().nonnegative("General stock must be positive"),
  variants: z.array(variantSchema),
  seo: seoSchema
});
const updateProductSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
  title: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  price: z.number().int().nonnegative().optional(),
  images: z.array(z.string().url()).optional(),
  stock: z.number().int().nonnegative().optional(),
  variants: z.array(variantSchema).optional(),
  seo: seoSchema.optional()
});
const updateShippingSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  shippingStatus: z.enum(["pending", "shipped", "delivered", "cancelled"]),
  trackingNumber: z.string().min(1, "Tracking number is required")
});
const collectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  productIds: z.array(z.string()),
  seo: seoSchema
});
const updateCollectionSchema = z.object({
  id: z.string().min(1, "Collection ID is required"),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  productIds: z.array(z.string()),
  seo: seoSchema
});
async function checkAdminAuth(context) {
  const user = context.locals.user;
  if (!user || !user.email) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "Inicia sesión para realizar esta acción."
    });
  }
  const superAdminEmail = "flexformfitness@gmail.com".trim().toLowerCase();
  if (user.email.trim().toLowerCase() === superAdminEmail) {
    return;
  }
  const settings = await getGeneralSettings();
  if (settings && Array.isArray(settings.admins)) {
    const normalizedAdmins = settings.admins.map((email) => email.trim().toLowerCase());
    if (normalizedAdmins.includes(user.email.trim().toLowerCase())) {
      return;
    }
  }
  throw new ActionError({
    code: "UNAUTHORIZED",
    message: "No tienes permisos de administrador para realizar esta acción."
  });
}
const server = {
  // Action to create a new product doc in Firestore
  createProduct: defineAction({
    accept: "json",
    input: createProductSchema,
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        const { slug } = input;
        const existingProducts = await db.collection("products").where("slug", "==", slug).get();
        if (!existingProducts.empty) {
          throw new ActionError({
            code: "CONFLICT",
            message: `A product with the slug '${slug}' already exists.`
          });
        }
        const newDocRef = db.collection("products").doc();
        const productData = {
          id: newDocRef.id,
          ...input,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        await newDocRef.set(productData);
        return { success: true, productId: newDocRef.id };
      } catch (error) {
        console.error("Error in createProduct action:", error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to create product."
        });
      }
    }
  }),
  // Action to update an existing product doc in Firestore
  updateProduct: defineAction({
    accept: "json",
    input: updateProductSchema,
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        const { id, ...updates } = input;
        const productRef = db.collection("products").doc(id);
        const productSnap = await productRef.get();
        if (!productSnap.exists) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Product not found."
          });
        }
        const updateData = {
          ...updates,
          updatedAt: /* @__PURE__ */ new Date()
        };
        if (updates.slug) {
          const duplicateSlugCheck = await db.collection("products").where("slug", "==", updates.slug).get();
          const duplicateDocs = duplicateSlugCheck.docs.filter((doc) => doc.id !== id);
          if (duplicateDocs.length > 0) {
            throw new ActionError({
              code: "CONFLICT",
              message: `The slug '${updates.slug}' is already in use by another product.`
            });
          }
        }
        await productRef.update(updateData);
        return { success: true };
      } catch (error) {
        console.error("Error in updateProduct action:", error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to update product."
        });
      }
    }
  }),
  // Action to update order status and trigger email
  updateShippingStatus: defineAction({
    accept: "json",
    input: updateShippingSchema,
    handler: async (input, context) => {
      await checkAdminAuth(context);
      const { orderId, shippingStatus, trackingNumber } = input;
      try {
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Order not found."
          });
        }
        const order = orderSnap.data();
        await orderRef.update({
          shippingStatus,
          trackingNumber,
          updatedAt: /* @__PURE__ */ new Date()
        });
        if (order.customerDetails.email && shippingStatus === "shipped") {
          const trackingLink = `https://www.packagetrackr.com/?number=${trackingNumber}`;
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
            from: "FlexForm Fitness <shipping@flexformfitness.com>",
            to: order.customerDetails.email,
            subject: `Tu pedido ha sido enviado - FlexForm Fitness #${orderId.slice(-6).toUpperCase()}`,
            html: emailContent
          });
        }
        return { success: true };
      } catch (error) {
        console.error("Error in updateShippingStatus action:", error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to update shipping status."
        });
      }
    }
  }),
  // Action to delete a product from Firestore
  deleteProduct: defineAction({
    accept: "json",
    input: z.object({
      id: z.string().min(1, "Product ID is required")
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        const productRef = db.collection("products").doc(input.id);
        const productSnap = await productRef.get();
        if (!productSnap.exists) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Product not found."
          });
        }
        await productRef.delete();
        return { success: true };
      } catch (error) {
        console.error("Error in deleteProduct action:", error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to delete product."
        });
      }
    }
  }),
  // Action to create a new collection
  createCollection: defineAction({
    accept: "json",
    input: collectionSchema,
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        const existingSnap = await db.collection("collections").where("slug", "==", input.slug).get();
        if (!existingSnap.empty) {
          throw new ActionError({
            code: "CONFLICT",
            message: "A collection with this slug already exists."
          });
        }
        const docRef = db.collection("collections").doc();
        await docRef.set({
          id: docRef.id,
          ...input,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        });
        return { success: true, id: docRef.id };
      } catch (error) {
        console.error("Error in createCollection action:", error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to create collection."
        });
      }
    }
  }),
  // Action to update an existing collection
  updateCollection: defineAction({
    accept: "json",
    input: updateCollectionSchema,
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        const { id, ...data } = input;
        const colRef = db.collection("collections").doc(id);
        const colSnap = await colRef.get();
        if (!colSnap.exists) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Collection not found."
          });
        }
        const existingSnap = await db.collection("collections").where("slug", "==", data.slug).get();
        const otherDocs = existingSnap.docs.filter((doc) => doc.id !== id);
        if (otherDocs.length > 0) {
          throw new ActionError({
            code: "CONFLICT",
            message: "Another collection with this slug already exists."
          });
        }
        await colRef.update({
          ...data,
          updatedAt: /* @__PURE__ */ new Date()
        });
        return { success: true };
      } catch (error) {
        console.error("Error in updateCollection action:", error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to update collection."
        });
      }
    }
  }),
  // Action to delete a collection
  deleteCollection: defineAction({
    accept: "json",
    input: z.object({
      id: z.string().min(1, "Collection ID is required")
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        const colRef = db.collection("collections").doc(input.id);
        const colSnap = await colRef.get();
        if (!colSnap.exists) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Collection not found."
          });
        }
        await colRef.delete();
        return { success: true };
      } catch (error) {
        console.error("Error in deleteCollection action:", error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to delete collection."
        });
      }
    }
  }),
  // Action to save General Settings in Firestore
  updateGeneralSettings: defineAction({
    accept: "json",
    input: z.object({
      shippingPrice: z.number().int().nonnegative(),
      freeShippingMin: z.number().int().nonnegative(),
      markets: z.array(z.string()),
      admins: z.array(z.string()),
      logoUrl: z.string().optional(),
      faviconUrl: z.string().optional()
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        await db.collection("settings").doc("general").set({
          ...input,
          updatedAt: /* @__PURE__ */ new Date()
        }, { merge: true });
        return { success: true };
      } catch (error) {
        console.error("Error in updateGeneralSettings action:", error);
        throw new ActionError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to update general settings."
        });
      }
    }
  }),
  // Action to trigger a manual Vercel rebuild for pending changes
  publishChanges: defineAction({
    accept: "json",
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        await triggerRebuild();
        return { success: true };
      } catch (error) {
        console.error("Error in publishChanges action:", error);
        throw new ActionError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to publish changes."
        });
      }
    }
  }),
  createDiscountCode: defineAction({
    accept: "json",
    input: z.object({
      code: z.string().min(1),
      discountType: z.enum(["percent", "amount"]),
      value: z.number().positive()
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        const { code, discountType, value } = input;
        const couponParams = {
          duration: "forever"
        };
        if (discountType === "percent") {
          couponParams.percent_off = value;
        } else {
          couponParams.amount_off = Math.round(value * 100);
          couponParams.currency = "usd";
        }
        const coupon = await stripe.coupons.create(couponParams);
        const promoCode = await stripe.promotionCodes.create({
          coupon: coupon.id,
          code: code.trim().toUpperCase()
        });
        return { success: true, promoCodeId: promoCode.id };
      } catch (error) {
        console.error("Error in createDiscountCode action:", error);
        throw new ActionError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to create discount code."
        });
      }
    }
  }),
  deactivateDiscountCode: defineAction({
    accept: "json",
    input: z.object({
      id: z.string().min(1)
    }),
    handler: async (input, context) => {
      await checkAdminAuth(context);
      try {
        const { id } = input;
        await stripe.promotionCodes.update(id, {
          active: false
        });
        return { success: true };
      } catch (error) {
        console.error("Error in deactivateDiscountCode action:", error);
        throw new ActionError({
          code: "BAD_REQUEST",
          message: error.message || "Failed to deactivate discount code."
        });
      }
    }
  }),
  validatePromoCode: defineAction({
    accept: "json",
    input: z.object({
      code: z.string().min(1)
    }),
    handler: async (input) => {
      try {
        const { code } = input;
        const promoCodes = await stripe.promotionCodes.list({
          code: code.trim().toUpperCase(),
          active: true,
          limit: 1,
          expand: ["data.coupon"]
        });
        if (promoCodes.data.length === 0) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "El código de descuento no existe o ya no está activo."
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
            amount_off: coupon.amount_off || null
          }
        };
      } catch (error) {
        console.error("Error in validatePromoCode action:", error);
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: "BAD_REQUEST",
          message: error.message || "Error al validar el código promocional."
        });
      }
    }
  })
};

export { server };
