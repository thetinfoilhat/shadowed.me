'use client';
import Link from "next/link";
import Image from "next/image";
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { signInWithPopup, AuthError } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import UserRoleModal from './UserRoleModal';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Header() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const { user, logout } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setShowLoginModal(false);
      
      // Check if user exists in database
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        // New user - show role selection
        setShowRoleModal(true);
      }
    } catch (error) {
      if (error instanceof Error && (error as AuthError).code !== 'auth/cancelled-popup-request') {
        console.error('Error signing in with Google:', error);
      }
    }
  };

  const handleRoleSelect = async (role: 'student' | 'captain') => {
    if (!user) return;

    try {
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: role,
        createdAt: new Date().toISOString(),
        displayName: user.displayName,
        photoURL: user.photoURL
      });
      setShowRoleModal(false);
    } catch (error) {
      console.error('Error saving user role:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-[1400px] mx-auto px-16 py-5 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="Shadowed.me logo" 
              width={32} 
              height={32}
            />
            <span className="text-[#180D39] font-medium">
              shadowed.me
            </span>
          </Link>
          
          <nav>
            <ul className="flex gap-8">
              <li>
                <Link 
                  href="/school-clubs" 
                  className="text-gray-600 hover:text-[#180D39] font-medium transition-colors"
                >
                  School Clubs
                </Link>
              </li>
              <li>
                <Link 
                  href="/volunteering" 
                  className="text-gray-600 hover:text-[#180D39] font-medium transition-colors"
                >
                  Volunteering
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className="text-gray-600 hover:text-[#180D39] font-medium transition-colors"
                >
                  About
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <button
              onClick={() => logout()}
              className="px-4 py-2 text-gray-600 font-medium hover:text-[#180D39] transition-colors"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 bg-[#2A8E9E] text-white font-medium rounded-lg hover:bg-[#247A87] transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-[#0A2540] mb-6">Login</h2>
            <button
              onClick={handleGoogleLogin}
              className="w-full px-4 py-3 flex items-center justify-center gap-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Image
                src="/google-logo.svg"
                alt="Google"
                width={20}
                height={20}
              />
              Sign in with Google
            </button>
          </div>
        </div>
      )}

      {/* Role Selection Modal */}
      {showRoleModal && (
        <UserRoleModal
          onSelectAction={handleRoleSelect}
          onCloseAction={() => setShowRoleModal(false)}
        />
      )}
    </header>
  );
} 