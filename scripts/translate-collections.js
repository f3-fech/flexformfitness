import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

// Load local .env variables
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

// Initialize Firebase Admin
const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
if (serviceAccountStr) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccountStr)),
  });
} else {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    console.error('Error: Firebase credentials are not set in the .env file.');
    process.exit(1);
  }
}

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
