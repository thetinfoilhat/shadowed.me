'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
  setUserRole: (role: string) => void;
  captainClubs: string[];
  setCaptainClubs: (clubs: string[]) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  logout: async () => {},
  showProfileModal: false,
  setShowProfileModal: () => {},
  setUserRole: () => {},
  captainClubs: [],
  setCaptainClubs: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [captainClubs, setCaptainClubs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Fetch user role
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role || null);
            setCaptainClubs(userData.captainClubs || []);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserRole(null);
        setCaptainClubs([]);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    userRole,
    loading,
    logout,
    showProfileModal,
    setShowProfileModal,
    setUserRole,
    captainClubs,
    setCaptainClubs,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 