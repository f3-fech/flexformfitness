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
    console.error('Error: Firebase credentials are not set.');
    process.exit(1);
  }
}

const bucketName = process.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'flexformfitness-673f4.firebasestorage.app';
console.log(`Checking bucket: ${bucketName}`);
const bucket = admin.storage().bucket(bucketName);

async function listFiles() {
  try {
    const [files] = await bucket.getFiles();
    console.log(`Total files found: ${files.length}`);
    files.forEach(file => {
      console.log(`- ${file.name} (${file.metadata.contentType || 'unknown'})`);
    });
  } catch (error) {
    console.error('Error listing files:', error);
  }
}

listFiles();
