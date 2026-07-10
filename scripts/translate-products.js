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

// Sportswear i18n translation engine
function translateText(text) {
  if (!text) return '';
  let t = text;
  
  const replacements = [
    // Full product titles (special cases)
    [/Camiseta Regular Ultra Built Under Pressure Hombre/gi, "Men's Regular Ultra Built Under Pressure T-Shirt"],
    [/Camiseta Regular Build and Win Block Hombre/gi, "Men's Regular Build and Win Block T-Shirt"],
    [/Camiseta Regular Strength in Flexibility Hombre/gi, "Men's Regular Strength in Flexibility T-Shirt"],
    [/Camiseta Regular Oumuamua Hombre/gi, "Men's Regular Oumuamua T-Shirt"],
    [/Camiseta Superoversize Train or Die Hombre/gi, "Men's Superoversize Train or Die T-Shirt"],
    [/Camiseta Sin Manga Flex Form F3 Neon Hombre/gi, "Men's Sleeveless Flex Form F3 Neon Shirt"],
    [/Camiseta Sin Manga Crescent Moon Hombre/gi, "Men's Sleeveless Crescent Moon Shirt"],
    [/Camiseta Oversize Cropped Build Under Pressure Mujer/gi, "Women's Oversize Cropped Build Under Pressure T-Shirt"],
    [/Camiseta Tirante Two Cayennes Mujer/gi, "Women's Two Cayennes Tank Top"],
    [/Tirante Navel of the World Hombre/gi, "Men's Navel of the World Tank Top"],
    [/Tirante Deadlift Hombre/gi, "Men's Deadlift Tank Top"],
    [/Tirante Force Hombre/gi, "Men's Force Tank Top"],

    // General Sportswear dictionary mapping
    [/Camiseta de tirantes/gi, "Tank Top"],
    [/Camiseta sin mangas/gi, "Sleeveless T-Shirt"],
    [/Camisetas sin manga/gi, "Sleeveless T-Shirts"],
    [/Camiseta/gi, "T-Shirt"],
    [/Camisetas/gi, "T-Shirts"],
    [/Tirante/gi, "Tank Top"],
    [/Tirantes/gi, "Tank Tops"],
    [/Leggings/gi, "Leggings"],
    [/Leggins/gi, "Leggings"],
    [/Mallas/gi, "Tights"],
    [/Sudadera con capucha/gi, "Hoodie"],
    [/Sudadera/gi, "Sweatshirt"],
    [/Sudaderas/gi, "Sweatshirts"],
    [/Pantalón/gi, "Pants"],
    [/Pantalones/gi, "Pants"],
    [/Top deportivo/gi, "Sports Top"],
    [/Top/gi, "Top"],
    [/Producto gratis/gi, "Free Product"],
    
    // Genders
    [/para Hombre/gi, "for Men"],
    [/de Hombre/gi, "Men's"],
    [/Hombre/gi, "Men"],
    [/para Mujer/gi, "for Women"],
    [/de Mujer/gi, "Women's"],
    [/Mujer/gi, "Women"],
    [/unisex/gi, "unisex"],
    
    // Attributes
    [/Negro/gi, "Black"],
    [/Gris/gi, "Grey"],
    [/Blanco/gi, "White"],
    [/Rojo/gi, "Red"],
    [/Azul/gi, "Blue"],
    [/Verde/gi, "Green"],
    [/Copia/gi, "Copy"],
    
    // Descriptions and phrasing
    [/ropa deportiva/gi, "sportswear"],
    [/alto rendimiento/gi, "high performance"],
    [/diseñado para/gi, "designed for"],
    [/diseñada para/gi, "designed for"],
    [/entrenamiento/gi, "training"],
    [/gimnasio/gi, "gym"],
    [/comodidad/gi, "comfort"],
    [/transpirable/gi, "breathable"],
    [/algodón/gi, "cotton"],
    [/poliéster/gi, "polyester"],
    [/elasticidad/gi, "elasticity"],
    [/ajuste perfecto/gi, "perfect fit"],
    [/Sin descripción/gi, "No description available"],
  ];
  
  for (const [pattern, replacement] of replacements) {
    t = t.replace(pattern, replacement);
  }
  return t;
}

async function run() {
  console.log('Fetching products from Firestore...');
  const snap = await db.collection('products').get();
  
  if (snap.empty) {
    console.log('No products found in database.');
    return;
  }
  
  console.log(`Found ${snap.size} products. Translating...`);
  
  let count = 0;
  for (const doc of snap.docs) {
    const product = doc.data();
    
    const translatedTitle = translateText(product.title);
    const translatedDesc = translateText(product.description);
    
    const updateData = {
      title_en: translatedTitle,
      description_en: translatedDesc,
      seo_en: {
        title: `${translatedTitle} | FLEX FORM FITNESS`,
        description: translatedDesc.substring(0, 150),
        keywords: ['fitness', 'sportswear', 'training']
      },
      updatedAt: new Date()
    };
    
    await doc.ref.update(updateData);
    console.log(`- Translated "${product.title}" -> "${translatedTitle}"`);
    count++;
  }
  
  console.log(`\nSuccess! Translated and updated ${count} products in Firestore.`);
}

run().catch((err) => {
  console.error('Translation error:', err);
  process.exit(1);
});
