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
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  TrophyIcon
} from "@heroicons/react/20/solid";

// Enhanced categories for filtering - match with club-listings page
const CATEGORIES = ['STEM', 'Business', 'Arts', 'Performing Arts', 'Language & Culture', 'Community Service', 'Humanities', 'Medical', 'Sports', 'Technology', 'Academic', 'Miscellaneous', 'All'] as const;

// Common sense attributes for filtering
const ATTRIBUTES = ['Competitive', 'Leadership', 'Teamwork', 'Public Speaking', 'Performance'] as const;

// Get category color function
const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    'STEM': '#4361EE', // Brighter blue
    'Humanities': '#F77F00', // Bright orange
    'Business': '#3A0CA3', // Rich purple
    'Music, Arts, & Performing Arts': '#F72585', // Vibrant pink
    'Academic': '#FFD60A', // Bright yellow
    'Language & Culture': '#E5446D', // Vibrant rose/pink
    'Medical': '#06D6A0', // Bright teal
    'Community Service & Leadership': '#4CC9F0', // Bright cyan
    'Miscellaneous': '#4895EF', // Bright blue
    // Legacy categories for backward compatibility
    'Arts': '#F72585',
    'Performing Arts': '#FF0054',
    'Community Service': '#4CC9F0',
    'Sports': '#D90429',
    'Technology': '#7B2CBF'
  };
  
  return colorMap[category] || '#4361EE'; // Default to bright blue
};

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
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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
    
    // Check if club has all selected attributes
    const matchesAttributes = selectedAttributes.length === 0 || 
                            selectedAttributes.every(attr => 
                              club.attributes?.includes(attr)
                            );
    
    return matchesCategory && matchesSearch && matchesAttributes;
  });

  // Toggle attribute selection
  const toggleAttribute = (attribute: string) => {
    setSelectedAttributes(prev => 
      prev.includes(attribute)
        ? prev.filter(attr => attr !== attribute)
        : [...prev, attribute]
    );
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedAttributes([]);
    setSearchQuery('');
  };

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
          <h1 className="text-4xl font-bold text-black mb-4">
            High School Club Visits
          </h1>
          <p className="text-lg text-black">
            Get a firsthand look at club meetings, events, and volunteer opportunities at Naperville North to find activities you&apos;re passionate about
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <input
                type="text"
                placeholder="Search clubs..."
                className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540] placeholder-gray-500 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all ${
                showFilters 
                  ? 'bg-gradient-to-r from-[#38BFA1] to-[#4CC9F0] text-white shadow-lg' 
                  : 'bg-[#38BFA1]/10 text-[#38BFA1] hover:bg-[#38BFA1]/20 border border-[#38BFA1]/20'
              }`}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              <span className="font-medium">Filters</span>
              {(selectedCategory !== 'All' || selectedAttributes.length > 0 || searchQuery) && (
                <span className={`ml-1 ${showFilters ? 'bg-white text-[#38BFA1]' : 'bg-[#38BFA1] text-white'} text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>
                  {(selectedCategory !== 'All' ? 1 : 0) + selectedAttributes.length + (searchQuery ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="bg-gradient-to-r from-slate-50 to-white rounded-lg border border-gray-200 p-6 mb-4 animate-fadeIn shadow-md">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-semibold text-[#0A2540] text-lg">Filters</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm font-medium bg-gradient-to-r from-[#4361EE] to-[#4CC9F0] bg-clip-text text-transparent hover:opacity-80 flex items-center"
                >
                  <XMarkIcon className="h-4 w-4 mr-1 text-[#4361EE]" />
                  Reset all
                </button>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === 'All'
                        ? 'bg-gradient-to-r from-[#4361EE] to-[#4CC9F0] text-white shadow-md transform -translate-y-0.5'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                    }`}
                  >
                    All
                  </button>
                  
                  {CATEGORIES.filter(c => c !== 'All').map((category) => {
                    const categoryColor = getCategoryColor(category);
                    const isSelected = selectedCategory === category;
                    
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className="transition-all"
                      >
                        <span 
                          className="block text-sm font-medium px-3 py-1.5 rounded-full transition-all"
                          style={{
                            background: isSelected 
                              ? `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)` 
                              : '#f3f4f6',
                            color: isSelected ? 'white' : categoryColor,
                            boxShadow: isSelected ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none',
                            transform: isSelected ? 'translateY(-1px)' : 'none',
                          }}
                        >
                          {category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Activity Type</h4>
                <div className="flex flex-wrap gap-2">
                  {ATTRIBUTES.map((attribute) => (
                    <button
                      key={attribute}
                      onClick={() => toggleAttribute(attribute)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedAttributes.includes(attribute)
                          ? attribute === 'Competitive' 
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-md transform -translate-y-0.5' 
                            : 'bg-gradient-to-r from-[#38BFA1] to-[#4CC9F0] text-white shadow-md transform -translate-y-0.5'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                      }`}
                    >
                      {attribute === 'Competitive' && (
                        <TrophyIcon className="h-3.5 w-3.5 inline-block mr-1" />
                      )}
                      {attribute}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-black">Loading clubs...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && filteredClubs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-black">No clubs found</p>
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
                    <h3 className="text-xl font-semibold text-black">{club.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* Category tag */}
                      <span 
                        key={club.category}
                        style={{ backgroundColor: getCategoryColor(club.category) + '20', color: getCategoryColor(club.category) }}
                        className="inline-block px-3 py-1 text-sm rounded-full"
                      >
                        {club.category}
                      </span>
                      
                      {/* Attribute tags */}
                      {club.attributes?.slice(0, 2).map(attr => (
                        <span 
                          key={attr}
                          className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                            attr === 'Competitive' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                              : attr === 'Leadership'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : attr === 'Teamwork'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : attr === 'Public Speaking'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : attr === 'Performance'
                              ? 'bg-pink-100 text-pink-800 border border-pink-200'
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}
                        >
                          {attr}
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
                
                <p className="text-black mb-4 line-clamp-3">{club.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-black font-medium">Date</p>
                    <p className="font-medium text-black">{formatDate(club.date)}</p>
                  </div>
                  <div>
                    <p className="text-black font-medium">Time</p>
                    <p className="font-medium text-black">{club.startTime} - {club.endTime}</p>
                  </div>
                  <div>
                    <p className="text-black font-medium">Available Slots</p>
                    <p className="font-medium text-black">{availableSlots} / {club.slots}</p>
                  </div>
                  <div>
                    <p className="text-black font-medium">Contact</p>
                    <p className="font-medium truncate text-black">{club.contactEmail}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleRegister(club)}
                  disabled={isFull || isRegistered}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    isRegistered
                      ? 'bg-blue-100 text-blue-600 cursor-default'
                      : isFull
                        ? 'bg-gray-100 text-black cursor-not-allowed'
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
            <Dialog.Title className="text-xl font-semibold text-black mb-4">
              Confirm Registration
            </Dialog.Title>
            <p className="text-black mb-6">
              Are you sure you want to register for {registeringVisit?.name}?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setRegisteringVisit(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-black"
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
            <Dialog.Title className="text-xl font-semibold text-black mb-4">
              Complete Your Profile
            </Dialog.Title>
            <p className="text-black mb-6">
              Please complete your profile information before registering for opportunities.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowProfilePrompt(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-black"
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
      />
    </div>
  );
} 