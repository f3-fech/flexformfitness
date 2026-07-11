const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const { parseEnvFile } = require('./utils.cjs');

const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env file is missing.');
  process.exit(1);
}

const env = parseEnvFile(envPath);

console.log('Target Storage Project:', env.FIREBASE_PROJECT_ID);

const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const bucketName = env.PUBLIC_FIREBASE_STORAGE_BUCKET || `${env.FIREBASE_PROJECT_ID}.firebasestorage.app`;
console.log('Target Bucket:', bucketName);

const bucket = app.storage().bucket(bucketName);
const localVideoPath = path.resolve(__dirname, '../public/videoher_compressed.mp4');

if (!fs.existsSync(localVideoPath)) {
  console.error('Error: Compressed video file not found at:', localVideoPath);
  process.exit(1);
}

async function uploadHeroVideo() {
  try {
    console.log('Uploading compressed hero video to Firebase Storage...');
    const destinationPath = 'assets/hero.mp4';
    const file = bucket.file(destinationPath);
    const downloadToken = randomUUID();

    await file.save(fs.readFileSync(localVideoPath), {
      metadata: {
        contentType: 'video/mp4',
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    console.log('File uploaded. Making public...');
    try {
      await file.makePublic();
    } catch (aclError) {
      console.warn('Could not set object ACL (Uniform bucket access might be enabled):', aclError.message);
    }

    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${downloadToken}`;
    console.log('\n================================================');
    console.log('Success! Hero video uploaded.');
    console.log('Download URL:', downloadUrl);
    console.log('================================================\n');

    // Update index.astro to use this URL
    const indexAstroPath = path.resolve(__dirname, '../src/pages/index.astro');
    let content = fs.readFileSync(indexAstroPath, 'utf-8');
    
    // Replace /videoher.mp4 with the new firebase URL
    const updatedContent = content.replace(
      /<source\s+src="\/videoher\.mp4"\s+type="video\/mp4"\s*\/>/g,
      `<source src="${downloadUrl}" type="video/mp4" />`
    );

    if (content !== updatedContent) {
      fs.writeFileSync(indexAstroPath, updatedContent, 'utf-8');
      console.log('Successfully updated index.astro with the new Firebase Storage video URL!');
    } else {
      console.log('Warning: index.astro was not updated. Reference might have already changed or tag mismatched.');
    }

  } catch (error) {
    console.error('Error during video upload:', error);
  } finally {
    await app.delete();
  }
}

uploadHeroVideo();
