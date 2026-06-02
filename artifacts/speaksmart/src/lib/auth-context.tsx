import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";

export const ADMIN_EMAILS = [
  "admin@speaksmart.com",
  "adminallen@speaksmart.com",
];

export interface HistoryEntry {
  phrase: string;
  language: string;
  score: number;
  type: "lesson" | "practice";
  timestamp?: unknown;
}

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
  publicProfile?: boolean;
  emailNotifications?: boolean;
  soundEnabled?: boolean;
  theme?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  tutorialComplete?: boolean;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserData>) => Promise<void>;
  awardXP: (amount: number) => Promise<void>;
  updateLeaderboard: () => Promise<void>;
  recordHistory: (entries: HistoryEntry[]) => Promise<void>;
  markTutorialComplete: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string) => {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data() as UserData;
      // Security: if user is banned, force sign them out
      if (data.isBanned) {
        await firebaseSignOut(auth);
        setUser(null);
        setUserData(null);
        setLoading(false);
        return;
      }
      setUserData(data);
    }
  };

  const createUserDocument = async (firebaseUser: User, displayName?: string) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email || "");
      const newData: UserData = {
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
        isAdmin,
        isBanned: false,
        tutorialComplete: false,
        createdAt: new Date(),
      };
      await setDoc(userRef, { ...newData, createdAt: serverTimestamp() });
      setUserData(newData);
    } else {
      const data = snap.data() as UserData;
      if (data.isBanned) {
        await firebaseSignOut(auth);
        setUser(null);
        setUserData(null);
        return;
      }
      setUserData(data);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        await fetchUserData(fbUser.uid);
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

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createUserDocument(result.user);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === "auth/popup-closed-by-user") return;
      if (err.code === "auth/popup-blocked") {
        throw new Error("Pop-up was blocked. Please allow pop-ups for this site.");
      }
      throw error;
    }
  };

  const signOut = async () => {
    // Clear all session data for security
    setUser(null);
    setUserData(null);
    
    // Clear any cached auth state
    sessionStorage.clear();
    localStorage.removeItem("speaksmart_custom_history");
    
    // Sign out from Firebase
    await firebaseSignOut(auth);
    
    // Replace browser history to prevent back button from accessing protected pages
    window.history.replaceState(null, "", "/login");
    window.location.href = "/login";
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

  const syncLeaderboard = async (uid: string, data: {
    displayName: string | null;
    photoURL: string | null;
    xp: number;
    level: number;
    streak: number;
  }) => {
    const ref = doc(db, "leaderboard", uid);
    await setDoc(ref, {
      uid,
      displayName: data.displayName || "Language Learner",
      photoURL: data.photoURL || null,
      xp: data.xp,
      level: data.level,
      streak: data.streak,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  };

  const updateLeaderboard = async () => {
    if (!user || !userData) return;
    await syncLeaderboard(user.uid, userData);
  };

  const awardXP = async (amount: number) => {
    if (!user || !userData) return;
    const newXp = userData.xp + amount;
    const newLevel = Math.floor(newXp / 500) + 1;
    const updates = { xp: newXp, level: newLevel };
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, updates);
    const updated = { ...userData, ...updates };
    setUserData(updated);
    await syncLeaderboard(user.uid, { ...userData, xp: newXp, level: newLevel });
  };

  const recordHistory = async (entries: HistoryEntry[]) => {
    if (!user) return;
    const historyRef = collection(db, "userHistory", user.uid, "items");
    for (const entry of entries) {
      await addDoc(historyRef, {
        ...entry,
        timestamp: serverTimestamp(),
      });
    }
  };

  const markTutorialComplete = async () => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { tutorialComplete: true });
    setUserData((prev) => prev ? { ...prev, tutorialComplete: true } : prev);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshUserData,
        updateUserProfile,
        awardXP,
        updateLeaderboard,
        recordHistory,
        markTutorialComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
