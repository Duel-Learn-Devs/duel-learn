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
  apiKey: "AIzaSyBtZC2Cm7D1kynMAlTL-_4g2-8VoE90LKI",
  authDomain: "duel-learn.firebaseapp.com",
  projectId: "duel-learn",
  storageBucket: "duel-learn.firebasestorage.app",
  messagingSenderId: "255993502199",
  appId: "1:255993502199:web:f758d82c6bb334577076f2",
  measurementId: "G-RTRW795R9H",
};

const app = initializeApp(firebaseConfig);

const provider = new GoogleAuthProvider();

export const auth = getAuth(app);
export const signIn = signInWithEmailAndPassword;
export const sendEmail = sendEmailVerification;
export const signOutUser = signOut;
export const googleProvider = provider;
export const db = getFirestore(app); // Add this line to export Firestore instance
export const createUserEmail = createUserWithEmailAndPassword;
export const signInWithGooglePopup = signInWithPopup;
export const firestoreDoc = doc;
export const setFirestoreDoc = setDoc;
export const firestoreServerTimestamp = serverTimestamp;
export const verifyResetCode = verifyPasswordResetCode;
export const confirmResetPassword = confirmPasswordReset;
export const sendResetEmail = sendPasswordResetEmail;
export const authStateChanged = onAuthStateChanged;
export const database = getDatabase(app);
export const databaseRef = ref;
export const onDatabaseValue = onValue;
export const getAdditionalInfo = getAdditionalUserInfo;
