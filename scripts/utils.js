import fs from 'fs';
import path from 'path';

/**
 * Loads .env variables into process.env
 */
export function loadEnv() {
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
}

/**
 * Loads env and initializes Firebase Admin application
 * @param {any} admin - firebase-admin library instance
 */
export function initFirebase(admin) {
  loadEnv();
  
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
}
