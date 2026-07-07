import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

// Cargar variables del archivo .env localmente
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

// Inicializar Firebase
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
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    if (emulatorHost) {
      admin.initializeApp({
        projectId: projectId || 'demo-project-flexform',
      });
    } else {
      console.error('Error: No se configuraron credenciales de Firebase en el archivo .env');
      process.exit(1);
    }
  }
}

const db = admin.firestore();

// Función para parsear CSV con soporte de comillas dobles y saltos de línea dentro de campos
function parseCSV(content) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        currentField += '"';
        i++; // saltar comilla escapada
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i++;
      }
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentRow.length > 0 || currentField) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  return rows;
}

async function seed() {
  const csvPath = path.resolve(process.cwd(), 'products_export_1.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: No se encontró el archivo de exportación en la ruta ${csvPath}`);
    process.exit(1);
  }

  console.log('Leyendo y parseando products_export_1.csv...');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const parsedRows = parseCSV(csvContent);

  if (parsedRows.length < 2) {
    console.error('Error: El archivo CSV está vacío o no contiene suficientes filas.');
    process.exit(1);
  }

  const headers = parsedRows[0];
  const getCol = (name) => headers.indexOf(name);

  // Mapear índices de columnas críticas
  const idxHandle = getCol('Handle');
  const idxTitle = getCol('Title');
  const idxBody = getCol('Body (HTML)');
  const idxOpt1Val = getCol('Option1 Value');
  const idxOpt2Val = getCol('Option2 Value');
  const idxSku = getCol('Variant SKU');
  const idxQty = getCol('Variant Inventory Qty');
  const idxPrice = getCol('Variant Price');
  const idxImgSrc = getCol('Image Src');
  const idxVariantImg = getCol('Variant Image');
  const idxSeoTitle = getCol('SEO Title');
  const idxSeoDesc = getCol('SEO Description');
  const idxStatus = getCol('Status');

  const productsMap = {};

  // Agrupar filas del CSV en productos
  for (let i = 1; i < parsedRows.length; i++) {
    const row = parsedRows[i];
    if (!row || row.length <= 1) continue;

    const handle = row[idxHandle];
    if (!handle) continue;

    // Si la celda Title no está vacía, define el inicio de un producto
    const isNewProduct = row[idxTitle] && row[idxTitle].trim() !== '';

    if (isNewProduct) {
      const rawBody = row[idxBody] || '';
      // Limpiar etiquetas HTML para una descripción de texto limpio
      const cleanDesc = rawBody
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      productsMap[handle] = {
        title: row[idxTitle].trim(),
        slug: handle.trim(),
        description: cleanDesc || 'Sin descripción.',
        price: 0, // se calculará con la primera variante
        images: [],
        stock: 0, // suma total del stock de variantes
        variants: [],
        seo: {
          title: (row[idxSeoTitle] || row[idxTitle]).trim(),
          description: (row[idxSeoDesc] || cleanDesc.substring(0, 150)).trim(),
          keywords: ['fitness', 'ropa deportiva', 'entrenamiento'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const product = productsMap[handle];
    if (!product) {
      console.warn(`Advertencia: Se encontró una fila con handle '${handle}' sin registro base en la fila ${i + 1}`);
      continue;
    }

    // Agregar variantes (si tienen opciones de talla o color)
    const opt1 = row[idxOpt1Val];
    const opt2 = row[idxOpt2Val];
    const priceStr = row[idxPrice];

    if ((opt1 || opt2) && priceStr) {
      const variantName = opt1 && opt2 ? `${opt1} / ${opt2}` : (opt1 || opt2);
      const variantPrice = Math.round(parseFloat(priceStr) * 100); // centavos
      const variantStock = parseInt(row[idxQty]) || 0;
      const variantImage = row[idxVariantImg] || row[idxImgSrc] || null;
      const variantSku = row[idxSku] || `${handle}-${product.variants.length + 1}`;

      product.variants.push({
        sku: variantSku.trim(),
        name: variantName.trim(),
        price: variantPrice,
        stock: variantStock,
        image: variantImage ? variantImage.trim() : null,
      });

      // Sumar stock de variante al stock general
      product.stock += variantStock;

      // Si es la primera variante, asignar como precio base del producto
      if (product.variants.length === 1) {
        product.price = variantPrice;
      }
    }

    // Registrar imágenes únicas del producto
    const imgSrc = row[idxImgSrc];
    if (imgSrc && imgSrc.trim() !== '') {
      const trimmedImg = imgSrc.trim();
      if (!product.images.includes(trimmedImg)) {
        product.images.push(trimmedImg);
      }
    }

    // Si la variante tiene su propia imagen, registrarla también en la galería
    const variantImg = row[idxVariantImg];
    if (variantImg && variantImg.trim() !== '') {
      const trimmedVarImg = variantImg.trim();
      if (!product.images.includes(trimmedVarImg)) {
        product.images.push(trimmedVarImg);
      }
    }
  }

  const productsList = Object.values(productsMap);

  if (productsList.length === 0) {
    console.error('Error: No se lograron agrupar productos válidos desde el CSV.');
    process.exit(1);
  }

  console.log(`\nLimpiando colección "products" en Firestore...`);
  const snapshot = await db.collection('products').get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log('Colección "products" vaciada.');

  console.log(`Sembrando ${productsList.length} productos reales desde el CSV en Firestore...`);
  for (const product of productsList) {
    // Si el producto no tiene variantes pero se le asignaron imágenes, poner un precio de seguridad
    if (product.price === 0) {
      product.price = 2900; // $29.00 por defecto si no hay variantes
    }
    // Si no tiene imágenes, usar un marcador
    if (product.images.length === 0) {
      product.images.push('https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800');
    }

    const docRef = db.collection('products').doc();
    await docRef.set({
      id: docRef.id,
      ...product,
    });
    console.log(`- Producto '${product.title}' con ${product.variants.length} variantes guardado (ID: ${docRef.id})`);
  }

  console.log('\n¡Sembrado completado con éxito!');
}

seed().catch((err) => {
  console.error('Error al sembrar:', err);
  process.exit(1);
});
