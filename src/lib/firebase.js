import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app, auth, db;

const isPlaceholder = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("your-api-key-here");

if (!isPlaceholder) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase client initialization failed:", error);
  }
}

if (!app) {
  console.warn("Using Firebase Client Mock fallbacks due to placeholder credentials.");
  app = {};
  auth = {
    onAuthStateChanged: (callback) => {
      // Trigger callback with null user immediately to allow app rendering
      setTimeout(() => callback(null), 10);
      return () => {};
    },
    currentUser: null,
  };
  db = {};
}

export { app, auth, db };
