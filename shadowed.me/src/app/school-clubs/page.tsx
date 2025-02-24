'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Dialog } from '@headlessui/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import VisitModal from '@/components/VisitModal';
import ApplicantsDialog from '@/components/ApplicantsDialog';
import { Club } from '@/types/club';

const CATEGORIES = ['All', 'STEM', 'Business', 'Humanities', 'Medical', 'Community Service', 'Arts'] as const;

type UserProfile = {
  name: string;
  email: string;
  age: number;
  school: string;
  grade: number;
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return format(date, "MMMM do yyyy");
}

function formatTime(timeStr: string) {
  const [start, end] = timeStr.split(' - ').map(time => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  });
  return `${start} - ${end}`;
}

function isUserRegistered(club: Club, userEmail?: string | null) {
  if (!userEmail || !club.applicants) return false;
  return club.applicants.some(applicant => applicant.email === userEmail);
}

function ConfirmDialog({ isOpen, onClose, onConfirm, visitName }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  visitName: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error registering:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-xl bg-white p-6">
          <Dialog.Title className="text-xl font-semibold text-[#0A2540] mb-4">
            Confirm Registration
          </Dialog.Title>
          
          <p className="text-gray-600 mb-6">
            Are you sure you want to register for "{visitName}"?
          </p>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[#0A2540] border border-[#0A2540] rounded-md hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="bg-[#38BFA1] text-white px-4 py-2 rounded-md hover:bg-[#2DA891] transition-all disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Confirm'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default function SchoolClubs() {
  const { user, setShowProfileModal } = useAuth();
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({});
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registeringVisit, setRegisteringVisit] = useState<Club | null>(null);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const clubsRef = collection(db, 'opportunities');
      const querySnapshot = await getDocs(clubsRef);
      
      const clubsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          captain: data.captain || '',
          category: data.category || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          date: data.date || '',
          description: data.description || '',
          endTime: data.endTime || '',
          name: data.name || '',
          school: data.school || '',
          startTime: data.startTime || '',
          time: data.time || '',
          slots: data.slots || 0,
          contactEmail: data.contactEmail || '',
          applicants: data.applicants || [],
          categories: data.categories || [],
        };
      });
      
      setClubs(clubsData);
    } catch (err) {
      console.error('Error fetching clubs:', err);
      setError('Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

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

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#725A44]">Loading...</div>
      </div>
    );
  }

  // Filter clubs logic
  const filteredClubs = clubs.filter(club => {
    const matchesCategory = selectedCategory === 'All' || 
                          club.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         club.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRegister = async (club: Club) => {
    if (!user) {
      document.querySelector<HTMLButtonElement>('button[data-login-button]')?.click();
      return;
    }

    // Check if profile is complete
    if (!userProfile.grade || !userProfile.school) {
      setShowProfilePrompt(true);
      return;
    }

    try {
      const visitRef = doc(db, 'opportunities', club.id);
      await updateDoc(visitRef, {
        applicants: arrayUnion({
          name: user.displayName || 'Anonymous',
          email: user.email,
          grade: userProfile.grade,
          school: userProfile.school
        })
      });
      await fetchClubs();
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  };

  const handleEditProfile = () => {
    setShowProfilePrompt(false);
    setTimeout(() => {
      setShowProfileModal(true);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="px-8 py-12 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-[3.5rem] font-semibold leading-[1.1] text-[#0A2540] mb-6">
            High School Club Visits
          </h1>
          <p className="text-lg text-gray-600">
            Experience high school clubs firsthand and find your passion
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search clubs..."
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-black placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute right-4 top-3.5 text-gray-400">🔍</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#38BFA1] text-white'
                    : 'bg-[#38BFA1]/10 text-[#38BFA1] hover:bg-[#38BFA1]/20'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading clubs...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && filteredClubs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No clubs found</p>
          </div>
        )}

        {/* Club Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => {
            const isRegistered = isUserRegistered(club, user?.email);
            
            return (
              <div key={club.id} className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[#0A2540]">{club.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {(club.categories || [club.category]).map((cat) => (
                        <span 
                          key={cat}
                          className="inline-block px-3 py-1 bg-[#38BFA1]/10 text-[#38BFA1] text-sm rounded-full"
                        >
                          {cat}
                        </span>
                      ))}
                      {isRegistered && (
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded-full">
                          Registered
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-6">{club.description}</p>
                
                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[#38BFA1] font-medium">School:</span>
                    <span>{club.school}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#38BFA1] font-medium">Date:</span>
                    <span>{formatDate(club.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#38BFA1] font-medium">Time:</span>
                    <span>{formatTime(club.time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#38BFA1] font-medium">Available Slots:</span>
                    <span>{club.slots}</span>
                  </div>
                </div>

                <button 
                  className={`w-full px-6 py-3 rounded-md transition-all ${
                    isRegistered 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#38BFA1] text-white hover:bg-[#2DA891]'
                  }`}
                  onClick={() => !isRegistered && setRegisteringVisit(club)}
                  disabled={isRegistered}
                >
                  {isRegistered ? 'Already Registered' : 'Register to Visit'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {registeringVisit && (
        <ConfirmDialog
          isOpen={!!registeringVisit}
          onClose={() => setRegisteringVisit(null)}
          onConfirm={() => handleRegister(registeringVisit)}
          visitName={registeringVisit.name}
        />
      )}

      {/* Profile Prompt Modal */}
      {showProfilePrompt && (
        <Dialog
          open={showProfilePrompt}
          onClose={() => setShowProfilePrompt(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-md w-full rounded-xl bg-white p-8">
              <Dialog.Title className="text-2xl font-semibold text-[#0A2540] mb-4">
                Complete Your Profile
              </Dialog.Title>
              
              <p className="text-gray-600 mb-8">
                Please complete your profile information before registering for opportunities. 
                This helps club captains better understand their visitors.
              </p>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowProfilePrompt(false)}
                  className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-black"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditProfile}
                  className="px-6 py-2 rounded-lg bg-[#38BFA1] text-white hover:bg-[#2DA891] transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </div>
  );
} 