const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Simple helper to parse .env files without dependencies
function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) return;
    
    const firstEqIndex = trimmed.indexOf('=');
    const key = trimmed.substring(0, firstEqIndex).trim();
    let value = trimmed.substring(firstEqIndex + 1).trim();
    
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  });
  return env;
}

const envDevPath = path.resolve(__dirname, '../.env.development');
const envProdPath = path.resolve(__dirname, '../.env');

if (!fs.existsSync(envDevPath) || !fs.existsSync(envProdPath)) {
  console.error('Error: .env.development or .env file is missing.');
  process.exit(1);
}

const devEnv = parseEnvFile(envDevPath);
const prodEnv = parseEnvFile(envProdPath);

console.log('Source Project:', devEnv.FIREBASE_PROJECT_ID);
console.log('Destination Project:', prodEnv.FIREBASE_PROJECT_ID);

// Initialize source app (old database)
const sourceApp = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: devEnv.FIREBASE_PROJECT_ID,
    clientEmail: devEnv.FIREBASE_CLIENT_EMAIL,
    privateKey: devEnv.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
}, 'source');

// Initialize destination app (new database)
const destApp = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: prodEnv.FIREBASE_PROJECT_ID,
    clientEmail: prodEnv.FIREBASE_CLIENT_EMAIL,
    privateKey: prodEnv.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
}, 'destination');

const sourceDb = sourceApp.firestore();
const destDb = destApp.firestore();

async function migrateCollection(collectionName) {
  console.log(`\nMigrating collection "${collectionName}"...`);
  const snap = await sourceDb.collection(collectionName).get();
  
  if (snap.empty) {
    console.log(`Collection "${collectionName}" is empty in source database.`);
    return;
  }
  
  console.log(`Found ${snap.size} documents in source collection "${collectionName}". Copying...`);
  
  const batch = destDb.batch();
  let count = 0;
  
  snap.docs.forEach((doc) => {
    const docRef = destDb.collection(collectionName).doc(doc.id);
    batch.set(docRef, doc.data());
    count++;
  });
  
  await batch.commit();
  console.log(`Successfully migrated ${count} documents in "${collectionName}".`);
}

async function runMigration() {
  try {
    await migrateCollection('collections');
    await migrateCollection('products');
    await migrateCollection('settings');
    console.log('\n================================================');
    console.log('Success: All collections migrated successfully!');
    console.log('================================================');
  } catch (error) {
    console.error('Error during migration execution:', error);
  } finally {
    // Terminate apps cleanly
    await Promise.all([sourceApp.delete(), destApp.delete()]);
  }
}

runMigration();
