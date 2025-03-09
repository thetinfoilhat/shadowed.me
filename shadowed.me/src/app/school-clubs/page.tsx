'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Dialog } from '@headlessui/react';
import { format} from 'date-fns';
import { Club } from '@/types/club';
import ConfirmDialog from '@/components/ConfirmDialog';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

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
  date.setDate(date.getDate() + 1);
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

const getAvailableSlots = (club: Club) => {
  const registeredCount = club.applicants?.length || 0;
  const totalSlots = club.slots || 0;
  return Math.max(0, totalSlots - registeredCount);
};

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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    visitId: string;
  }>({ isOpen: false, visitId: '' });

  const fetchClubs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const clubsRef = collection(db, 'opportunities');
      const querySnapshot = await getDocs(clubsRef);
      
      const clubsData = querySnapshot.docs
        .map(doc => {
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
            sponsorEmail: data.sponsorEmail || '',
            startTime: data.startTime || '',
            time: data.time || '',
            slots: data.slots || 0,
            contactEmail: data.contactEmail || '',
            applicants: data.applicants || [],
            categories: data.categories || [],
            status: data.status || 'pending',
            completed: data.completed || false,
          };
        })
        .filter(club => club.status === 'approved') // Only show approved visits
        .filter(club => !club.completed); // Filter out completed visits
      
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
            age: data.age || 0,
            school: data.school || '',
            grade: data.grade || 0,
          });
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
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

    // Check if user profile is complete
    if (!userProfile.name || !userProfile.school || !userProfile.grade) {
      setShowProfilePrompt(true);
      return;
    }

    setRegisteringVisit(club);
  };

  const confirmRegistration = async () => {
    if (!registeringVisit || !user?.email || !userProfile.name) return;
    
    try {
      const visitRef = doc(db, 'opportunities', registeringVisit.id);
      
      // Add user to applicants array
      await updateDoc(visitRef, {
        applicants: arrayUnion({
          name: userProfile.name,
          email: user.email,
          grade: userProfile.grade?.toString() || '',
          school: userProfile.school || '',
        })
      });
      
      toast.success('Successfully registered for the visit!');
      setRegisteringVisit(null);
      
      // Refresh the clubs list
      await fetchClubs();
    } catch (err) {
      console.error('Error registering for visit:', err);
      toast.error('Failed to register for the visit');
    }
  };

  const handleEditProfile = () => {
    setShowProfilePrompt(false);
    setShowProfileModal(true);
  };

  const handleDeleteClick = (visitId: string) => {
    setConfirmDelete({ isOpen: true, visitId });
  };

  const handleDelete = async (visitId: string) => {
    try {
      await deleteDoc(doc(db, 'opportunities', visitId));
      toast.success('Visit deleted successfully');
      await fetchClubs(); // Refresh the list
    } catch (err) {
      console.error('Error deleting visit:', err);
      toast.error('Failed to delete visit');
    } finally {
      setConfirmDelete({ isOpen: false, visitId: '' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#0A2540] mb-4">
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
            const availableSlots = getAvailableSlots(club);
            const isFull = availableSlots === 0;
            
            return (
              <div key={club.id} className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all group relative">
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
                  
                  {userRole === 'admin' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(club.id);
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Delete Visit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-3">{club.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-medium">{formatDate(club.date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Time</p>
                    <p className="font-medium">{club.startTime} - {club.endTime}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Available Slots</p>
                    <p className="font-medium">{availableSlots} / {club.slots}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Contact</p>
                    <p className="font-medium truncate">{club.contactEmail}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleRegister(club)}
                  disabled={isFull || isRegistered}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    isRegistered
                      ? 'bg-blue-100 text-blue-600 cursor-default'
                      : isFull
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#38BFA1] text-white hover:bg-[#2DA891]'
                  }`}
                >
                  {isRegistered
                    ? 'Already Registered'
                    : isFull
                      ? 'No Available Slots'
                      : 'Register for Visit'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Registration Confirmation Dialog */}
      <Dialog
        open={registeringVisit !== null}
        onClose={() => setRegisteringVisit(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full rounded-xl bg-white p-6">
            <Dialog.Title className="text-xl font-semibold text-[#0A2540] mb-4">
              Confirm Registration
            </Dialog.Title>
            <p className="text-gray-600 mb-6">
              Are you sure you want to register for {registeringVisit?.name}?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setRegisteringVisit(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRegistration}
                className="px-4 py-2 bg-[#38BFA1] text-white rounded-lg hover:bg-[#2DA891] transition-colors"
              >
                Confirm
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Profile Prompt Dialog */}
      <Dialog
        open={showProfilePrompt}
        onClose={() => setShowProfilePrompt(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full rounded-xl bg-white p-6">
            <Dialog.Title className="text-xl font-semibold text-[#0A2540] mb-4">
              Complete Your Profile
            </Dialog.Title>
            <p className="text-gray-600 mb-6">
              Please complete your profile information before registering for opportunities.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowProfilePrompt(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditProfile}
                className="px-4 py-2 bg-[#38BFA1] text-white rounded-lg hover:bg-[#2DA891] transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, visitId: '' })}
        onConfirm={() => handleDelete(confirmDelete.visitId)}
        title="Delete Visit"
        message="Are you sure you want to delete this visit? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
      />
    </div>
  );
} 