import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

import { initFirebase } from './utils.js';

// Initialize Firebase Admin
initFirebase(admin);

const db = admin.firestore();

// Collection translation engine
function translateText(text) {
  if (!text) return '';
  let t = text;
  
  const replacements = [
    // Collection Names
    [/Camisetas sin manga y tirantes de hombre/gi, "Men's Sleeveless Shirts & Tank Tops"],
    [/Camisetas de hombre/gi, "Men's T-Shirts"],
    [/Camisetas de mujer/gi, "Women's T-Shirts"],
    [/Sudaderas de hombre/gi, "Men's Hoodies & Sweatshirts"],
    [/Leggings de mujer/gi, "Women's Leggings"],
    [/Tirantes de mujer/gi, "Women's Tank Tops"],
    [/Tops de mujer/gi, "Women's Tops"],
    [/Sudaderas/gi, "Hoodies & Sweatshirts"],
    [/Hombre/gi, "Men"],
    [/Mujer/gi, "Women"],
    [/Más vendidos/gi, "Best Sellers"],
    [/Colección/gi, "Collection"],
    
    // Descriptive Phrases
    [/Ropa deportiva/gi, "Sportswear"],
    [/alto rendimiento/gi, "high performance"],
    [/entrenamiento/gi, "training"],
    [/gimnasio/gi, "gym"],
    [/diseñada para/gi, "designed for"],
    [/diseñado para/gi, "designed for"],
    [/comodidad/gi, "comfort"],
    [/estilo/gi, "style"],
    [/descripción/gi, "description"],
  ];
  
  for (const [pattern, replacement] of replacements) {
    t = t.replace(pattern, replacement);
  }
  return t;
}

async function run() {
  console.log('Fetching collections from Firestore...');
  const snap = await db.collection('collections').get();
  
  if (snap.empty) {
    console.log('No collections found in database.');
    return;
  }
  
  console.log(`Found ${snap.size} collections. Translating...`);
  
  let count = 0;
  for (const doc of snap.docs) {
    const col = doc.data();
    
    const translatedTitle = translateText(col.title);
    const translatedDesc = translateText(col.description);
    const translatedDetailedDesc = col.detailedDescription ? translateText(col.detailedDescription) : null;
    
    const updateData = {
      title_en: translatedTitle,
      description_en: translatedDesc,
      detailedDescription_en: translatedDetailedDesc,
      seo_en: {
        title: `${translatedTitle} | FLEX FORM FITNESS`,
        description: translatedDesc.substring(0, 150),
        keywords: ['fitness', 'sportswear', 'collection']
      },
      updatedAt: new Date()
    };
    
    await doc.ref.update(updateData);
    console.log(`- Translated "${col.title}" -> "${translatedTitle}"`);
    count++;
  }
  
  console.log(`\nSuccess! Translated and updated ${count} collections in Firestore.`);
}

run().catch((err) => {
  console.error('Translation error:', err);
  process.exit(1);
});
