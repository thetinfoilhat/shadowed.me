'use client';
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { signInWithPopup, AuthError } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

type UserProfile = {
  name: string;
  email: string;
  age: number;
  school: string;
  grade: number;
};

function ProfileModal({ 
  onClose, 
  initialData,
  onSave 
}: { 
  onClose: () => void;
  initialData: Partial<UserProfile>;
  onSave: (data: UserProfile) => Promise<void>;
}) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      await onSave({
        name: formData.get('name') as string,
        email: initialData.email || '',
        age: parseInt(formData.get('age') as string),
        school: formData.get('school') as string,
        grade: parseInt(formData.get('grade') as string),
      });
      onClose();
    } catch {
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold text-[#0A2540] mb-6">Edit Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              defaultValue={initialData.name}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A8E9E] text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={initialData.email}
              disabled
              className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              name="age"
              defaultValue={initialData.age}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A8E9E] text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
            <input
              type="text"
              name="school"
              defaultValue={initialData.school}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A8E9E] text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
            <select
              name="grade"
              defaultValue={initialData.grade}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A8E9E] text-black"
            >
              <option value="6">6th Grade</option>
              <option value="7">7th Grade</option>
              <option value="8">8th Grade</option>
              <option value="9">9th Grade</option>
              <option value="10">10th Grade</option>
              <option value="11">11th Grade</option>
              <option value="12">12th Grade</option>
            </select>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2A8E9E] text-white px-4 py-2 rounded-lg hover:bg-[#247A87] transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Header() {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout, showProfileModal, setShowProfileModal } = useAuth();
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({});
  const [userRole, setUserRole] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setShowLoginModal(false);
      
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
      
      // Redirect to home
      router.push('/');
    } catch (error) {
      if (error instanceof Error && (error as AuthError).code !== 'auth/cancelled-popup-request') {
        console.error('Error signing in with Google:', error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      router.push('/'); // Redirect to home page after logout
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.group')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserProfile({
            name: data.displayName || user.displayName || '',
            email: user.email || '',
            age: data.age,
            school: data.school,
            grade: data.grade,
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.uid) {
        setUserRole(null);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, [user]);

  const handleProfileSave = async (data: UserProfile) => {
    if (!user?.uid) return;

    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...data,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      setUserProfile(data);
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  return (
    <>
      <div className="h-[73px]" />
      
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-16 py-5 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="Shadowed.me" 
                width={180} 
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            
            <nav>
              <ul className="flex gap-8">
                <li>
                  <Link 
                    href="/school-clubs"
                    className="text-black hover:text-[#38BFA1] font-medium transition-colors"
                  >
                    School Clubs
                  </Link>
                </li>
                {userRole !== 'student' && (
                  <li>
                    <Link 
                      href="/my-visits"
                      className="text-black hover:text-[#38BFA1] font-medium transition-colors"
                    >
                      My Visits
                    </Link>
                  </li>
                )}
                {(userRole === 'captain' || userRole === 'admin') && (
                  <li>
                    <Link 
                      href="/captain-dashboard"
                      className="text-black hover:text-[#38BFA1] font-medium transition-colors"
                    >
                      Captain Dashboard
                    </Link>
                  </li>
                )}
                {userRole === 'admin' && (
                  <li>
                    <Link 
                      href="/admin-dashboard"
                      className="text-black hover:text-[#38BFA1] font-medium transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                  </li>
                )}
                {userRole === 'student' && (
                  <li>
                    <Link 
                      href="/student-dashboard"
                      className="text-black hover:text-[#38BFA1] font-medium transition-colors"
                    >
                      Student Dashboard
                    </Link>
                  </li>
                )}
                <li>
                  <Link 
                    href="/what-fits-you"
                    className="text-black hover:text-[#38BFA1] font-medium transition-colors"
                  >
                    What Fits You!
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/about" 
                    className="text-black hover:text-[#38BFA1] font-medium transition-colors"
                  >
                    About
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative group">
                <button
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#2A8E9E]/20 transition-all"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <Image 
                      src={user.photoURL || ''}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement?.classList.add('bg-[#2A8E9E]', 'flex', 'items-center', 'justify-center', 'text-white');
                        if (target.parentElement) {
                          target.parentElement.innerHTML = user.displayName?.[0] || user.email?.[0] || '?';
                        }
                      }}
                    />
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 border border-gray-100">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-black truncate">
                        {userProfile.name || user.displayName || user.email}
                      </p>
                      <p className="text-xs text-black truncate">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowUserMenu(false);
                      }}
                      data-edit-profile
                      className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-50 transition-colors"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                data-login-button
                className="px-4 py-2 bg-[#2A8E9E] text-white font-medium rounded-lg hover:bg-[#247A87] transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-black mb-6">Login</h2>
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
          </div>
        </div>
      )}

      {showProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          initialData={userProfile}
          onSave={handleProfileSave}
        />
      )}
    </>
  );
} 