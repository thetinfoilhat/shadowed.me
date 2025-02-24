'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Dialog } from '@headlessui/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

const CATEGORIES = ['All', 'STEM', 'Business', 'Humanities', 'Medical', 'Community Service', 'Arts'] as const;

type Club = {
  id: string;
  captain: string;
  category: string;
  createdAt: Date;
  date: string;
  description: string;
  endTime: string;
  name: string;
  school: string;
  startTime: string;
  time: string;
  slots: number;
  contactEmail: string;
  applicants?: Array<{
    name: string;
    email: string;
  }>;
  categories?: string[];
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

function VisitModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Club | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData ? [initialData.category] : []
  );
  
  // Create defaultValues for the form
  const defaultValues = initialData ? {
    name: initialData.name,
    school: initialData.school,
    club: initialData.category,
    slots: initialData.slots,
    date: initialData.date,
    description: initialData.description,
    contactEmail: initialData.contactEmail,
    startTime: initialData.time.split(' - ')[0],
    endTime: initialData.time.split(' - ')[1],
  } : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (selectedCategories.length === 0) {
        setError('Please select at least one category');
        setLoading(false);
        return;
      }

      const form = e.currentTarget;
      const formData = new FormData(form);
      
      await onSubmit({
        id: initialData?.id,
        name: formData.get('name'),
        school: formData.get('school'),
        categories: selectedCategories,
        category: selectedCategories[0],
        contactEmail: formData.get('contactEmail'),
        slots: formData.get('slots'),
        date: formData.get('date'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        description: formData.get('description'),
      });
      onClose();
    } catch (err) {
      console.error('Error saving visit:', err);
      setError('Failed to save visit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategories(prev => {
      const isSelected = prev.includes(category);
      return isSelected 
        ? prev.filter(c => c !== category)
        : [...prev, category];
    });
  };

  useEffect(() => {
    if (initialData && isOpen) {
      // Initialize with all categories if editing
      setSelectedCategories(initialData.categories || [initialData.category]);
    } else {
      // Reset when opening new form
      setSelectedCategories([]);
    }
  }, [initialData, isOpen]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl my-8 max-h-[90vh] flex flex-col">
          <div className="p-6 overflow-y-auto">
            <Dialog.Title className="text-3xl font-semibold text-[#0A2540] mb-6">
              {initialData ? 'Edit Club Visit' : 'Create New Club Visit'}
            </Dialog.Title>

            <form id="visitForm" onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-lg text-[#0A2540] mb-2">
                  Visit Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  defaultValue={defaultValues?.name}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-[#0A2540]"
                  placeholder="Enter visit name"
                />
              </div>

              <div>
                <label htmlFor="school" className="block text-lg text-[#0A2540] mb-2">
                  School
                </label>
                <input
                  type="text"
                  id="school"
                  name="school"
                  required
                  defaultValue={defaultValues?.school}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-[#0A2540]"
                  placeholder="Enter school name"
                />
              </div>

              <div>
                <label htmlFor="categories" className="block text-lg text-[#0A2540] mb-2">
                  Club Categories (Select multiple)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {CATEGORIES.filter(cat => cat !== 'All').map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        selectedCategories.includes(category)
                          ? 'bg-[#38BFA1] text-white'
                          : 'bg-[#38BFA1]/10 text-[#38BFA1] hover:bg-[#38BFA1]/20'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                {selectedCategories.length === 0 && (
                  <p className="text-sm text-red-500">Please select at least one category</p>
                )}
              </div>

              <div>
                <label htmlFor="contactEmail" className="block text-lg text-[#0A2540] mb-2">
                  Point of Contact Email
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  required
                  defaultValue={defaultValues?.contactEmail}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-[#0A2540]"
                  placeholder="Enter contact email"
                />
              </div>

              <div>
                <label htmlFor="slots" className="block text-lg text-[#0A2540] mb-2">
                  Slots Available
                </label>
                <input
                  type="number"
                  id="slots"
                  name="slots"
                  min="1"
                  required
                  defaultValue={defaultValues?.slots}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-[#0A2540]"
                  placeholder="Enter number of slots"
                />
              </div>

              <div>
                <label htmlFor="date" className="block text-lg text-[#0A2540] mb-2">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  defaultValue={defaultValues?.date}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-[#0A2540]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-lg text-[#0A2540] mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    required
                    defaultValue={defaultValues?.startTime}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-[#0A2540]"
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-lg text-[#0A2540] mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    required
                    defaultValue={defaultValues?.endTime}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-[#0A2540]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-lg text-[#0A2540] mb-2">
                  Extended Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  required
                  defaultValue={defaultValues?.description}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-[#0A2540]"
                  placeholder="Enter visit description"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
            </form>
          </div>

          <div className="border-t border-gray-100 p-6 bg-white mt-auto">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-[#0A2540] border border-[#0A2540] rounded-md hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="visitForm"
                disabled={loading}
                className="bg-[#38BFA1] text-white px-6 py-3 rounded-md hover:bg-[#2DA891] transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create Visit')}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
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

function ApplicantsDialog({ isOpen, onClose, applicants }: {
  isOpen: boolean;
  onClose: () => void;
  applicants: Array<{ name: string; email: string; }>;
}) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full rounded-xl bg-white p-6">
          <Dialog.Title className="text-xl font-semibold text-[#0A2540] mb-4">
            Registered Students ({applicants.length})
          </Dialog.Title>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {applicants.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No students registered yet</p>
            ) : (
              <div className="space-y-3">
                {applicants.map((applicant, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-[#0A2540]">{applicant.name}</div>
                    <div className="text-sm text-gray-500">{applicant.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[#0A2540] border border-[#0A2540] rounded-md hover:bg-gray-50 transition-all"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default function SchoolClubs() {
  const { user, loading: authLoading } = useAuth();
  
  // Group all useState hooks together at the top
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCaptain, setIsCaptain] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Club | null>(null);
  const [registeringVisit, setRegisteringVisit] = useState<Club | null>(null);
  const [viewingApplicants, setViewingApplicants] = useState<Club | null>(null);

  // Move fetchClubs outside useEffect so it can be reused
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

  // First useEffect for checking captain status
  useEffect(() => {
    const checkCaptainStatus = async () => {
      if (!user?.uid) {
        setIsCaptain(false);
        setLoading(false);
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        setIsCaptain(userData?.role === 'captain');
      } catch (err) {
        console.error('Error checking captain status:', err);
        setIsCaptain(false);
      } finally {
        setLoading(false);
      }
    };

    checkCaptainStatus();
  }, [user?.uid]);

  // Use fetchClubs in useEffect
  useEffect(() => {
    fetchClubs();
  }, []);

  // Now handleCreateVisit can access fetchClubs
  const handleSaveVisit = async (data: any) => {
    try {
      if (!data.categories || data.categories.length === 0) {
        throw new Error('Please select at least one category');
      }

      const visitData = {
        ...data,
        captain: user?.email,
        categories: data.categories,
        category: data.categories[0],
        slots: Number(data.slots),
        time: `${data.startTime || ''} - ${data.endTime || ''}`,
      };

      if (data.id) {
        const visitRef = doc(db, 'opportunities', data.id);
        await updateDoc(visitRef, visitData);
      } else {
        const visitRef = collection(db, 'opportunities');
        await addDoc(visitRef, {
          ...visitData,
          createdAt: new Date(),
        });
      }
      
      await fetchClubs();
      setEditingVisit(null);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error saving visit:', error);
      throw error;
    }
  };

  // Update the edit button click handler
  const handleEditClick = (visit: Club) => {
    setEditingVisit(visit);
    setIsCreateModalOpen(true);
  };

  // Add registration handler
  const handleRegister = async (club: Club) => {
    if (!user) return; // Handle not logged in case

    try {
      const visitRef = doc(db, 'opportunities', club.id);
      await updateDoc(visitRef, {
        applicants: arrayUnion({
          name: user.displayName || 'Anonymous',
          email: user.email
        })
      });
      await fetchClubs();
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  };

  // Loading state check
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#725A44]">Loading...</div>
      </div>
    );
  }

  console.log("isCaptain value:", isCaptain);

  // Filter clubs logic
  const filteredClubs = clubs.filter(club => {
    const matchesCategory = selectedCategory === 'All' || 
                          club.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         club.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Render captain view
  if (isCaptain) {
    const captainVisits = filteredClubs.filter(club => club.captain === user?.email);
    
    return (
      <div className="min-h-screen bg-white">
        <div className="px-8 py-12 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-[3.5rem] font-semibold leading-[1.1] text-[#0A2540] mb-6">Club Captain Dashboard</h1>
            <p className="text-lg text-gray-600">
              Schedule and manage your club's visit opportunities
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end mb-8">
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#38BFA1] text-white px-6 py-3 rounded-md hover:bg-[#2DA891] transition-all flex items-center gap-2"
            >
              <span>Create Visit</span>
              <span>→</span>
            </button>
          </div>

          {captainVisits.length === 0 ? (
            <div className="bg-white rounded-xl p-16 shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-center">
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">
                  Create Your First Club Visit
                </h2>
                <p className="text-gray-600 mb-8">
                  Let students experience your club by scheduling a visit opportunity.
                </p>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-[#38BFA1]/10 text-[#38BFA1] px-6 py-3 rounded-md hover:bg-[#38BFA1]/20 transition-all inline-flex items-center gap-2"
                >
                  <span>Schedule Visit</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Upcoming Visits Section */}
              <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                <h2 className="text-xl font-semibold text-[#0A2540] mb-6">
                  Scheduled Club Visits ({captainVisits.length})
                </h2>
                
                <div className="space-y-4">
                  {captainVisits.map((visit) => (
                    <div 
                      key={visit.id} 
                      className="group flex items-center gap-6 p-6 rounded-lg border border-gray-100 hover:border-[#38BFA1]/30 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer bg-white relative"
                    >
                      {/* Date Circle */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#38BFA1]/10 flex flex-col items-center justify-center text-[#38BFA1]">
                        <div className="text-sm font-medium">{format(new Date(visit.date), 'MMM')}</div>
                        <div className="text-xl font-bold">{format(new Date(visit.date), 'd')}</div>
                      </div>
                      
                      {/* Visit Details */}
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-[#0A2540] mb-2">
                          {visit.name}
                        </h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">School:</span>
                            <span className="text-[#0A2540]">{visit.school}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Date:</span>
                            <span className="text-[#0A2540]">{formatDate(visit.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Time:</span>
                            <span className="text-[#0A2540]">{formatTime(visit.time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Available Slots:</span>
                            <span className="text-[#0A2540]">{visit.slots}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Category:</span>
                            <span className="text-[#38BFA1]">{visit.category}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Edit Button - Appears on Hover */}
                      <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                        <button 
                          className="bg-[#38BFA1]/10 text-[#38BFA1] p-2 rounded-md hover:bg-[#38BFA1]/20 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(visit);
                          }}
                        >
                          <span className="text-sm">Edit</span>
                        </button>
                        <button 
                          className="bg-[#38BFA1]/10 text-[#38BFA1] p-2 rounded-md hover:bg-[#38BFA1]/20 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingApplicants(visit);
                          }}
                        >
                          <span className="text-sm">View Applicants</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <VisitModal
            isOpen={isCreateModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setEditingVisit(null);
            }}
            onSubmit={handleSaveVisit}
            initialData={editingVisit}
          />

          <ApplicantsDialog
            isOpen={!!viewingApplicants}
            onClose={() => setViewingApplicants(null)}
            applicants={viewingApplicants?.applicants || []}
          />
        </div>
      </div>
    );
  }

  // Render regular view
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
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
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
    </div>
  );
} 