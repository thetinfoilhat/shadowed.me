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
  refreshUserData: () => Promise<void>;
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
  refreshUserData: async () => {},
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
            // Ensure we're not overriding existing roles
            if (userData.role) {
              setUserRole(userData.role);
            }
            setCaptainClubs(userData.captainClubs || []);
          } else {
            // New user - don't set role yet, let AuthCheck handle it
            // This prevents automatic demotion when signing back in
            console.log("New user detected, awaiting profile setup");
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

  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role) {
          setUserRole(userData.role);
        }
        setCaptainClubs(userData.captainClubs || []);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
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
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 