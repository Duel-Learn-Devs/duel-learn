import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Add this import
import { createUserWithEmailAndPassword } from "firebase/auth";
import { signInWithPopup, getAdditionalUserInfo } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
  sendPasswordResetEmail,
} from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const provider = new GoogleAuthProvider();

// ✅ Export Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const database = getDatabase(app);

// ✅ Export Authentication Functions
export const signIn = signInWithEmailAndPassword;
export const createUserEmail = createUserWithEmailAndPassword;
export const signInWithGooglePopup = signInWithPopup;
export const getAdditionalInfo = getAdditionalUserInfo;
export const sendEmail = sendEmailVerification;
export const sendResetEmail = sendPasswordResetEmail;
export const verifyResetCode = verifyPasswordResetCode;
export const confirmResetPassword = confirmPasswordReset;
export const signOutUser = signOut;
export const authStateChanged = onAuthStateChanged;
export const googleProvider = provider;

// ✅ Export Firestore Functions
export const firestoreDoc = doc;
export const setFirestoreDoc = setDoc;
export const firestoreServerTimestamp = serverTimestamp;

// ✅ Export Realtime Database Functions
export const databaseRef = ref;
export const onDatabaseValue = onValue;
