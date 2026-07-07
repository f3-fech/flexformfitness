import './env';
import admin from 'firebase-admin';

// Initialize the Firebase Admin SDK once
if (!admin.apps.length) {
  try {
    // Read the unified service account JSON if available
    const serviceAccountStr = import.meta.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT;

    if (serviceAccountStr) {
      const serviceAccount = JSON.parse(serviceAccountStr);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Fallback to separate environment variables
      const projectId = import.meta.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
      const clientEmail = import.meta.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = import.meta.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;

      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            // Replace escaped newlines with actual newline characters
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      } else {
        // Fallback to local demo mode instead of crashing
        console.warn(
          'Firebase Admin credentials are not set. Initializing with a dummy project ID for local preview/development.'
        );
        admin.initializeApp({
          projectId: projectId || 'demo-project-flexform',
        });
      }
    }
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    throw error;
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
export { admin };
