import admin from 'firebase-admin';
import { initFirebase } from './utils.js';

initFirebase(admin);

const bucketName = process.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'flexformfitness-673f4.firebasestorage.app';
const bucket = admin.storage().bucket(bucketName);

console.log(`Configuring CORS for bucket: ${bucketName}...`);

try {
  await bucket.setCorsConfiguration([
    {
      origin: ['*'],
      method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
      responseHeader: ['*'],
      maxAgeSeconds: 3600,
    },
  ]);
  console.log('✅ CORS successfully configured on Firebase Storage bucket!');
} catch (error) {
  console.error('❌ Error configuring CORS:', error);
  process.exit(1);
}
