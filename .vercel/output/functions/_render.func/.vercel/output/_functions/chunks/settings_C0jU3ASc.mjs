import { db } from './firebase_CqeBG1kq.mjs';

const defaultSettings = {
  shippingPrice: 499,
  freeShippingMin: 5e3,
  markets: ["US", "CA", "ES", "MX"],
  admins: [],
  logoUrl: "/logo.png",
  faviconUrl: "/favicon.ico"
};
async function getGeneralSettings() {
  try {
    const doc = await db.collection("settings").doc("general").get();
    if (doc.exists) {
      const data = doc.data();
      return {
        shippingPrice: data.shippingPrice !== void 0 ? data.shippingPrice : defaultSettings.shippingPrice,
        freeShippingMin: data.freeShippingMin !== void 0 ? data.freeShippingMin : defaultSettings.freeShippingMin,
        markets: data.markets || defaultSettings.markets,
        admins: data.admins || defaultSettings.admins,
        logoUrl: data.logoUrl || defaultSettings.logoUrl,
        faviconUrl: data.faviconUrl || defaultSettings.faviconUrl
      };
    }
  } catch (error) {
    console.error("Error fetching general settings from Firestore:", error);
  }
  return defaultSettings;
}

export { getGeneralSettings as g };
