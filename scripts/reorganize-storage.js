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
const bucketName = process.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'f3-flexformfitness.firebasestorage.app';
const bucket = admin.storage().bucket(bucketName);

async function run() {
  console.log(`Reaching Firebase Storage bucket: ${bucket.name}...`);
  
  // 1. Get all files in products/ folder (non-recursive prefix)
  const [files] = await bucket.getFiles({ prefix: 'products/' });
  
  console.log(`Found ${files.length} total files under prefix "products/".`);
  
  const urlMap = new Map(); // Old URL -> New URL mapping
  
  for (const file of files) {
    // Ignore folder placeholders and already categorized folders
    if (file.name.endsWith('/')) continue;
    if (file.name.startsWith('products/gallery/')) continue;
    if (file.name.startsWith('products/crops/')) continue;
    
    // Determine categorization folder
    const isCrop = file.name.includes('/crop_') || file.name.startsWith('products/crop_');
    const newName = isCrop 
      ? file.name.replace('products/', 'products/crops/')
      : file.name.replace('products/', 'products/gallery/');
      
    console.log(`- Moving: "${file.name}" -> "${newName}"`);
    
    try {
      // Get download token to preserve URL access
      const [metadata] = await file.getMetadata();
      const token = metadata.metadata?.firebaseStorageDownloadTokens;
      
      const oldUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${token}`;
      const newUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(newName)}?alt=media&token=${token}`;
      
      urlMap.set(oldUrl, newUrl);
      
      // Perform move operation
      await file.move(newName);
      
      // Preserve download token metadata on the newly moved file
      if (token) {
        const movedFile = bucket.file(newName);
        await movedFile.setMetadata({
          metadata: {
            firebaseStorageDownloadTokens: token,
          }
        });
      }
    } catch (moveErr) {
      console.error(`Failed to move file "${file.name}":`, moveErr);
    }
  }
  
  console.log(`\nReorganized Storage. Now updating Firestore product references...`);
  console.log(`Mapped ${urlMap.size} old URLs to new directory paths.`);
  
  if (urlMap.size === 0) {
    console.log('No database updates needed.');
    return;
  }
  
  // 2. Fetch and update Firestore Products
  const productsSnap = await db.collection('products').get();
  let updatedProducts = 0;
  
  for (const doc of productsSnap.docs) {
    const product = doc.data();
    let hasChanges = false;
    
    // Check main images gallery
    const newImages = (product.images || []).map((imgUrl) => {
      // Clean query hash part (like #org=...) before mapping, but restore it after mapping
      const parts = imgUrl.split('#');
      const baseOldUrl = parts[0];
      const hashPart = parts[1] ? `#${parts[1]}` : '';
      
      if (urlMap.has(baseOldUrl)) {
        hasChanges = true;
        return `${urlMap.get(baseOldUrl)}${hashPart}`;
      }
      return imgUrl;
    });
    
    // Check product variants images
    const newVariants = (product.variants || []).map((v) => {
      if (v.image && urlMap.has(v.image)) {
        hasChanges = true;
        return { ...v, image: urlMap.get(v.image) };
      }
      return v;
    });
    
    if (hasChanges) {
      await doc.ref.update({
        images: newImages,
        variants: newVariants,
        updatedAt: new Date()
      });
      console.log(`- Updated Product refs: "${product.title}"`);
      updatedProducts++;
    }
  }
  
  console.log(`\nSuccess! Updated ${updatedProducts} products in Firestore.`);
}

run().catch((err) => {
  console.error('Reorganization error:', err);
  process.exit(1);
});
