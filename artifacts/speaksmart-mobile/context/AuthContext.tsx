import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Platform } from "react-native";
import { auth, db, googleProvider } from "@/lib/firebase";

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  xp: number;
  level: number;
  streak: number;
  totalLessons: number;
  totalPracticeMinutes: number;
  achievements: string[];
  preferredLanguage: string;
  bio?: string;
  soundEnabled?: boolean;
  theme?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  googleAvailable: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const googleAvailable = Platform.OS === "web";

  const fetchUserData = async (uid: string) => {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      setUserData(userDoc.data() as UserData);
    }
  };

  const createUserDocument = async (firebaseUser: User, displayName?: string) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      const newUserData: UserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName || firebaseUser.displayName || "Language Learner",
        photoURL: firebaseUser.photoURL,
        xp: 0,
        level: 1,
        streak: 0,
        totalLessons: 0,
        totalPracticeMinutes: 0,
        achievements: ["welcome"],
        preferredLanguage: "english",
        soundEnabled: true,
      };
      await setDoc(userRef, { ...newUserData, createdAt: serverTimestamp() });
      setUserData(newUserData);
    } else {
      setUserData(userDoc.data() as UserData);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserData(firebaseUser.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    await createUserDocument(result.user, displayName);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserData(null);
  };

  const signInWithGoogle = async () => {
    if (Platform.OS !== "web") {
      throw new Error("Google sign-in is only available on the web version.");
    }
    const result = await signInWithPopup(auth, googleProvider);
    await createUserDocument(result.user);
  };

  const refreshUserData = async () => {
    if (user) await fetchUserData(user.uid);
  };

  const updateUserProfile = async (updates: Partial<UserData>) => {
    if (!user) throw new Error("No user logged in");
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, updates as Record<string, unknown>);
    await fetchUserData(user.uid);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        googleAvailable,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        refreshUserData,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
