'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog } from '@headlessui/react';

export default function AuthCheck() {
  const { user, setUserRole } = useAuth();
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  useEffect(() => {
    if (!user) return;

    const setupNewUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          // New user - automatically set as student
          await setDoc(doc(db, 'users', user.uid), {
            displayName: user.displayName || '',
            email: user.email,
            role: 'student',
            createdAt: new Date(),
            photoURL: user.photoURL
          });
          
          setUserRole('student');
          setShowInfoDialog(true);
        } else {
          const userData = userDoc.data();
          if (userData.role) {
            setUserRole(userData.role);
          }
        }
      } catch (error) {
        console.error('Error setting up new user:', error);
      }
    };

    setupNewUser();
  }, [user, setUserRole]);

  // Only show the info dialog for new users
  if (!user || !showInfoDialog) return null;

  return (
    <Dialog open={showInfoDialog} onClose={() => setShowInfoDialog(false)} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-2xl font-semibold text-black mb-4">
            Welcome to Shadowed!
          </Dialog.Title>
          
          <div className="mb-6 text-gray-600">
            <p className="mb-4">
              You&apos;ve been automatically registered as a student. If you&apos;re a club captain and missed our onboarding meeting on April 16th, 2025, please email <span className="text-blue-600">infoshadowed@gmail.com</span> to get your captain access set up.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowInfoDialog(false);
                // Force a page reload after dialog dismissal
                window.location.reload();
              }}
              className="px-4 py-2 bg-[#38BFA1] text-white rounded-lg hover:bg-[#2DA891] transition-colors"
            >
              Got it
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 