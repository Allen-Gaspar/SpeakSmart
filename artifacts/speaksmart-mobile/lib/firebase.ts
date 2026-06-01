import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCy5_jwWk8eumgpdGxP7Z5x7lYdtBySYrM",
  authDomain: "speaksmart3.firebaseapp.com",
  projectId: "speaksmart3",
  storageBucket: "speaksmart3.firebasestorage.app",
  messagingSenderId: "976273587511",
  appId: "1:976273587511:web:34081448fa9c65b3ba2eb2",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
