'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { doc, setDoc, collection, addDoc, getDocs, getDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { ClubListing } from '@/types/club';
import { XMarkIcon } from '@heroicons/react/24/outline';
import SponsorSelect from './SponsorSelect';

// Enhanced categories for filtering - match with club-listings page
const CATEGORIES = ['STEM', 'Business', 'Arts', 'Performing Arts', 'Language & Culture', 'Community Service', 'Humanities', 'Medical', 'Sports', 'Technology', 'Academic', 'Miscellaneous'] as const;

// Common sense attributes for filtering - match with club-listings page
const ATTRIBUTES = ['Competitive', 'Leadership', 'Teamwork', 'Public Speaking', 'Performance'] as const;

interface ClubModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSubmitAction: () => void;
  initialData?: Partial<ClubListing> | null;
}

interface CaptainUser {
  id: string;
  email: string;
  displayName?: string;
}

export default function ClubModal({ isOpen, onCloseAction, onSubmitAction, initialData }: ClubModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    mission: initialData?.mission || '',
    meetingTimes: initialData?.meetingTimes || '',
    contactInfo: initialData?.contactInfo || '',
    category: initialData?.category || '',
    sponsorEmail: initialData?.sponsorEmail || '',
    roomNumber: initialData?.roomNumber || '',
    attributes: initialData?.attributes || [] as string[],
    captain: initialData?.captain || user?.email || '',
    contactInfoList: initialData?.contactInfoList || [],
    sponsorEmailList: initialData?.sponsorEmailList || [],
  });
  
  const [newContactInfo, setNewContactInfo] = useState('');
  const [newSponsorEmail, setNewSponsorEmail] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [captains, setCaptains] = useState<CaptainUser[]>([]);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  // Fetch captains if user is admin
  useEffect(() => {
    const fetchCaptains = async () => {
      if (!isAdmin) return;

      try {
        const usersRef = collection(db, 'users');
        const captainQuery = query(usersRef, where('role', '==', 'captain'));
        const querySnapshot = await getDocs(captainQuery);
        
        const captainsList: CaptainUser[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          captainsList.push({
            id: doc.id,
            email: userData.email || '',
            displayName: userData.displayName || userData.email || '',
          });
        });
        
        setCaptains(captainsList);
      } catch (error) {
        console.error('Error fetching captains:', error);
      }
    };

    fetchCaptains();
  }, [isAdmin]);

  useEffect(() => {
    if (initialData && !initialData.contactInfoList && initialData.contactInfo) {
      setFormData(prev => ({
        ...prev,
        contactInfoList: initialData.contactInfo ? [initialData.contactInfo] : []
      }));
    }
    
    if (initialData && !initialData.sponsorEmailList && initialData.sponsorEmail) {
      setFormData(prev => ({
        ...prev,
        sponsorEmailList: initialData.sponsorEmail ? [initialData.sponsorEmail] : []
      }));
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    // No field validation required anymore
    setValidationErrors({});

    try {
      setIsSubmitting(true);
      
      const contactInfoList = [...formData.contactInfoList];
      if (formData.contactInfo && !contactInfoList.includes(formData.contactInfo)) {
        contactInfoList.unshift(formData.contactInfo);
      }
      
      const sponsorEmailList = [...formData.sponsorEmailList];
      if (formData.sponsorEmail && !sponsorEmailList.includes(formData.sponsorEmail)) {
        sponsorEmailList.unshift(formData.sponsorEmail);
      }
      
      // Make sure name has a default value
      const clubName = formData.name.trim() || 'Unnamed Club';
      
      const clubData = {
        ...formData,
        name: clubName,
        contactInfoList,
        sponsorEmailList,
        // Captain could be empty now - use current user email as fallback in non-admin mode
        captain: isAdmin ? formData.captain : (formData.captain || user.email),
        createdAt: new Date(),
        updatedAt: new Date(),
        created: true
      };

      if (initialData?.id) {
        // If we're editing an existing club, just update it
        await setDoc(doc(db, 'clubs', initialData.id), clubData, { merge: true });
        toast.success('Club information updated successfully');
      } else {
        // If creating a new club, first check if a club with that name already exists
        const clubNameLower = clubName.toLowerCase();
        const clubsRef = collection(db, 'clubs');
        
        // We'll do a more thorough search by getting all clubs and checking in memory
        // This is more reliable than a direct query which might not handle case sensitivity well
        const allClubsSnapshot = await getDocs(clubsRef);
        
        // Find any club with a matching name (case-insensitive)
        const matchingDocs = allClubsSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.name && data.name.toLowerCase().trim() === clubNameLower;
        });
        
        if (matchingDocs.length > 0) {
          // Found an existing club with the same name, update it instead of creating a new one
          const existingDoc = matchingDocs[0];
          console.log(`Updating existing club: ${clubName} (id: ${existingDoc.id})`);
          await setDoc(doc(db, 'clubs', existingDoc.id), clubData, { merge: true });
          toast.success('Club information updated successfully');
        } else {
          // No existing club found, create a new one
          console.log(`Creating new club: ${clubName}`);
          await addDoc(collection(db, 'clubs'), clubData);
          toast.success('Club created successfully');
        }
      }

      await onSubmitAction();
      onCloseAction();
    } catch (error) {
      console.error('Error saving club:', error);
      toast.error('Failed to save club');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAttribute = (attribute: string) => {
    setFormData(prev => {
      const currentAttributes = [...prev.attributes];
      if (currentAttributes.includes(attribute)) {
        return {
          ...prev,
          attributes: currentAttributes.filter(attr => attr !== attribute)
        };
      } else {
        return {
          ...prev,
          attributes: [...currentAttributes, attribute]
        };
      }
    });
  };

  const addContactInfo = () => {
    if (!newContactInfo.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      contactInfoList: [...prev.contactInfoList, newContactInfo.trim()]
    }));
    setNewContactInfo('');
  };

  const removeContactInfo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contactInfoList: prev.contactInfoList.filter((_, i: number) => i !== index)
    }));
  };

  const handleSponsorChange = (email: string) => {
    setFormData(prev => ({
      ...prev,
      sponsorEmail: email
    }));
  };

  const addSponsorEmail = () => {
    if (!newSponsorEmail.trim()) return;
    
    if (!newSponsorEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Check if email already exists in the list
    if (formData.sponsorEmailList.includes(newSponsorEmail.trim()) || 
        newSponsorEmail.trim() === formData.sponsorEmail) {
      toast.error('This sponsor email is already added');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      sponsorEmailList: [...prev.sponsorEmailList, newSponsorEmail.trim()]
    }));
    setNewSponsorEmail('');
  };

  const removeSponsorEmail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sponsorEmailList: prev.sponsorEmailList.filter((_, i: number) => i !== index)
    }));
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onCloseAction} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-white p-6 relative overflow-y-auto max-h-[90vh]">
              <button
                onClick={onCloseAction}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <Dialog.Title className="text-2xl font-bold text-[#0A2540] mb-6">
                {initialData ? 'Edit Club' : 'Create New Club'}
              </Dialog.Title>

              {isAdmin && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-black">
                        <strong>Admin Mode:</strong> You can create or edit club information for any captain. Select a captain from the dropdown below.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-black">
                      <strong>Important:</strong> All fields are now optional. You can create club entries without captains, sponsors, or room numbers. Fill in what you have now, and you can complete the details later.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-[#0A2540] mb-2">
                      Captain Email <span className="text-gray-500">(Optional)</span>
                    </label>
                    <select
                      value={formData.captain}
                      onChange={(e) => setFormData({ ...formData, captain: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                    >
                      <option value="">Select a captain</option>
                      {captains.map((captain) => (
                        <option key={captain.id} value={captain.email}>
                          {captain.displayName || captain.email}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-black opacity-70 mt-1">
                      You can create a club without assigning a captain
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Club Name <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Club name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black placeholder-black placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Category <span className="text-gray-500">(Optional)</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category} className="text-black">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Activity Types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ATTRIBUTES.map((attribute) => (
                      <button
                        key={attribute}
                        type="button"
                        onClick={() => toggleAttribute(attribute)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          formData.attributes.includes(attribute)
                            ? attribute === 'Competitive' 
                              ? 'bg-amber-500 text-white shadow-sm' 
                              : 'bg-[#38BFA1] text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {attribute}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-black opacity-70 mt-1">Optional: Select all that apply</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Description <span className="text-gray-500">(Optional)</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black placeholder-black placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Mission Statement <span className="text-gray-500">(Optional)</span>
                  </label>
                  <textarea
                    value={formData.mission}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black placeholder-black placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Room Number <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="e.g., Room 123"
                    className={`w-full rounded-lg border ${validationErrors.roomNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'} px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#38BFA1]`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Meeting Times <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.meetingTimes}
                    onChange={(e) => setFormData({ ...formData, meetingTimes: e.target.value })}
                    placeholder="e.g., Mondays at 3:30 PM"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black placeholder-black placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Contact Information <span className="text-gray-500">(Optional)</span>
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newContactInfo}
                      onChange={(e) => setNewContactInfo(e.target.value)}
                      placeholder="Social media, website, etc."
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-black placeholder-black placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                    />
                    <button
                      type="button"
                      onClick={addContactInfo}
                      className="rounded-lg bg-[#38BFA1] px-4 py-2 text-white hover:bg-[#2da88e] focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                    >
                      Add
                    </button>
                  </div>
                  {formData.contactInfoList.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {formData.contactInfoList.map((info, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                          <span className="text-sm text-black">{info}</span>
                          <button
                            type="button"
                            onClick={() => removeContactInfo(index)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Sponsor Email <span className="text-gray-500">(Optional)</span>
                  </label>
                  <SponsorSelect 
                    value={formData.sponsorEmail}
                    onChange={handleSponsorChange}
                  />
                  
                  <div className="mt-2 flex space-x-2">
                    <input
                      type="email"
                      value={newSponsorEmail}
                      onChange={(e) => setNewSponsorEmail(e.target.value)}
                      placeholder="sponsor@school.edu"
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-black placeholder-black placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                    />
                    <button
                      type="button"
                      onClick={addSponsorEmail}
                      className="rounded-lg bg-[#38BFA1] px-4 py-2 text-white hover:bg-[#2da88e] focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                    >
                      Add
                    </button>
                  </div>
                  
                  {formData.sponsorEmailList.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {formData.sponsorEmailList.map((email, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                          <span className="text-sm text-black">{email}</span>
                          <button
                            type="button"
                            onClick={() => removeSponsorEmail(index)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-[#38BFA1] px-4 py-2 text-white hover:bg-[#2da88e] focus:outline-none focus:ring-2 focus:ring-[#38BFA1] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : initialData ? 'Update Club' : 'Create Club'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}