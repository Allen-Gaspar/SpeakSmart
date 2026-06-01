import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDXxjerTQ3NzulqnRbvrKxB0W5J9Y2SkTM",
  authDomain: "speaksmart-932bc.firebaseapp.com",
  projectId: "speaksmart-932bc",
  storageBucket: "speaksmart-932bc.firebasestorage.app",
  messagingSenderId: "374387307317",
  appId: "1:374387307317:web:415f3baa9f628a1758927c",
  measurementId: "G-2KGQP99FXY"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, storage, googleProvider };
