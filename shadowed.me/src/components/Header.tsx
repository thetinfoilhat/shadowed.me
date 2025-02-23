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
    <>
      <nav className="flex justify-between items-center px-8 py-4">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Shadowed.me logo"
            width={32}
            height={32}
            priority
          />
          <span className="font-semibold text-[#725A44]">shadowed.me</span>
        </div>
        <div className="flex gap-4">
          <Link href="/" className="text-[#725A44] hover:text-[#8B6D54]">Home</Link>
          <Link href="/school-clubs" className="text-[#725A44] hover:text-[#8B6D54]">School Clubs</Link>
          <Link href="/volunteering" className="text-[#725A44] hover:text-[#8B6D54]">Volunteering</Link>
          <Link href="/about" className="text-[#725A44] hover:text-[#8B6D54]">About</Link>
        </div>
        <div className="flex gap-4">
          {user ? (
            <button
              onClick={() => logout()}
              className="px-4 py-2 text-[#725A44] border border-[#725A44] rounded-md hover:bg-[#725A44] hover:text-white transition-colors"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-4 py-2 text-[#725A44] border border-[#725A44] rounded-md hover:bg-[#725A44] hover:text-white transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </nav>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-[#725A44] hover:text-[#8B6D54]"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-[#4A3C2D] mb-6">Login</h2>
            <button
              onClick={handleGoogleLogin}
              className="w-full px-4 py-3 flex items-center justify-center gap-2 border border-[#E2D9D0] rounded-lg hover:bg-[#F3EDE7] transition-colors"
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
    </>
  );
} 