import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyD5ETRokXtIx4pGRRCXIpMTJB3SLa84P7Q",
  authDomain: "shadowed-me.firebaseapp.com",
  projectId: "shadowed-me",
  storageBucket: "shadowed-me.firebasestorage.app",
  messagingSenderId: "606373075523",
  appId: "1:606373075523:web:39e694e023cfca983212f6",
  measurementId: "G-B9PJB431FS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Define user roles and their hierarchy
export type UserRole = 'student' | 'captain' | 'sponsor' | 'admin';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'student': 0,
  'captain': 1,
  'sponsor': 2,
  'admin': 3
};

interface UserWithProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

export async function createUserDocument(user: UserWithProfile, role: UserRole = 'student') {
  if (!user.email) return;
  
  try {
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      role,
      createdAt: new Date(),
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
    });
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
} 