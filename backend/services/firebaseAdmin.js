import dotenv from "dotenv";
import admin from 'firebase-admin';

dotenv.config();

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!credentialsPath) {
  throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not defined in environment variables.");
}

const serviceAccount = JSON.parse(
  Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString('utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

export default admin; 