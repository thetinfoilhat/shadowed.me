'use client';
import { useState } from 'react';
import { signInWithPopup, AuthError } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

interface AuthModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onCloseAction }: AuthModalProps) {
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if user exists in database
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        // New user - automatically set as student
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          role: 'student',
          createdAt: new Date().toISOString(),
          displayName: result.user.displayName,
          photoURL: result.user.photoURL
        });
      }
      
      onCloseAction();
    } catch (error) {
      if (error instanceof Error && (error as AuthError).code !== 'auth/cancelled-popup-request') {
        setError('Failed to sign in with Google. Please try again.');
        console.error('Error signing in with Google:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-[#4A3C2D] mb-6">Welcome to Shadowed.me</h2>

        {error && (
          <p className="text-red-500 mb-4 text-sm">{error}</p>
        )}

        <button
          onClick={handleGoogleLogin}
          className="w-full px-4 py-3 flex items-center justify-center gap-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-black"
        >
          <Image
            src="/google-logo.svg"
            alt="Google"
            width={20}
            height={20}
          />
          Sign in with Google
        </button>

        <button
          onClick={onCloseAction}
          className="absolute top-4 right-4 text-[#725A44] hover:text-[#8B6D54]"
        >
          ✕
        </button>
      </div>
    </div>
  );
} 