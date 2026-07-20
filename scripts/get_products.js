import admin from 'firebase-admin';
import { initFirebase } from './utils.js';

initFirebase(admin);
const db = admin.firestore();

async function getProducts() {
  const snap = await db.collection('products').get();
  console.log(`Total products: ${snap.size}`);
  snap.docs.forEach(doc => {
    const data = doc.data();
    console.log(`- Product: "${data.title}" | Slug: "${data.slug}" | Stock: ${data.stock} | Price: ${data.price} | Variants Count: ${data.variants?.length || 0}`);
    if (data.variants && data.variants.length > 0) {
      data.variants.forEach(v => {
        console.log(`   * Variant: "${v.name}" | Sku: "${v.sku}" | Stock: ${v.stock} | Price: ${v.price}`);
      });
    }
  });
}

getProducts().catch(console.error);
