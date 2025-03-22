'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { doc, updateDoc, collection, getDocs, query, where, setDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { ClubListing } from '@/types/club';
import LoadingSpinner from './LoadingSpinner';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface ClubAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: ClubListing;
  onAssignmentComplete: () => void;
}

export default function ClubAssignmentModal({
  isOpen,
  onClose,
  club,
  onAssignmentComplete
}: ClubAssignmentModalProps) {
  const [captains, setCaptains] = useState<User[]>([]);
  const [sponsors, setSponsors] = useState<User[]>([]);
  const [selectedCaptains, setSelectedCaptains] = useState<string[]>(
    club.captains ? club.captains : club.captain ? [club.captain] : []
  );
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>(
    club.sponsorEmails ? club.sponsorEmails : club.sponsorEmail ? [club.sponsorEmail] : []
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // New state for adding entities
  const [showAddCaptain, setShowAddCaptain] = useState(false);
  const [showAddSponsor, setShowAddSponsor] = useState(false);
  const [newCaptainEmail, setNewCaptainEmail] = useState('');
  const [newCaptainName, setNewCaptainName] = useState('');
  const [newSponsorEmail, setNewSponsorEmail] = useState('');
  const [newSponsorName, setNewSponsorName] = useState('');
  const [addingCaptain, setAddingCaptain] = useState(false);
  const [addingSponsor, setAddingSponsor] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersCollection = collection(db, 'users');
        
        // Fetch captains
        const captainsQuery = query(usersCollection, where('role', '==', 'captain'));
        const captainsSnapshot = await getDocs(captainsQuery);
        const captainsData = captainsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        setCaptains(captainsData);
        
        // Fetch sponsors
        const sponsorsQuery = query(usersCollection, where('role', '==', 'sponsor'));
        const sponsorsSnapshot = await getDocs(sponsorsQuery);
        const sponsorsData = sponsorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        setSponsors(sponsorsData);
        
        // Set initial values
        setSelectedCaptains(club.captains ? club.captains : club.captain ? [club.captain] : []);
        setSelectedSponsors(club.sponsorEmails ? club.sponsorEmails : club.sponsorEmail ? [club.sponsorEmail] : []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, club]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Update club with multiple captains and sponsors
      const updateData: Record<string, unknown> = {
        updatedAt: new Date()
      };
      
      // Keep backward compatibility by setting the primary captain/sponsor
      if (selectedCaptains.length > 0) {
        updateData.captain = selectedCaptains[0];
        updateData.captains = selectedCaptains;
      }
      
      if (selectedSponsors.length > 0) {
        updateData.sponsorEmail = selectedSponsors[0];
        updateData.sponsorEmails = selectedSponsors;
      }
      
      await updateDoc(doc(db, 'clubs', club.id), updateData as DocumentData);
      
      toast.success('Club assignments updated successfully');
      onAssignmentComplete();
      onClose();
    } catch (error) {
      console.error('Error updating club assignments:', error);
      toast.error('Failed to update club assignments');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCaptain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaptainEmail || !newCaptainName) {
      toast.error('Please provide both email and name for the new captain');
      return;
    }

    try {
      setAddingCaptain(true);
      
      // Add new user with captain role
      const userRef = doc(collection(db, 'users'));
      await setDoc(userRef, {
        email: newCaptainEmail,
        displayName: newCaptainName,
        role: 'captain',
        createdAt: new Date()
      });
      
      // Add to local state
      const newCaptain = {
        id: userRef.id,
        email: newCaptainEmail,
        displayName: newCaptainName,
        role: 'captain'
      };
      
      setCaptains([...captains, newCaptain]);
      setSelectedCaptains([...selectedCaptains, newCaptainEmail]);
      
      // Reset form
      setNewCaptainEmail('');
      setNewCaptainName('');
      setShowAddCaptain(false);
      
      toast.success('New captain added successfully');
    } catch (error) {
      console.error('Error adding captain:', error);
      toast.error('Failed to add new captain');
    } finally {
      setAddingCaptain(false);
    }
  };

  const handleAddSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSponsorEmail || !newSponsorName) {
      toast.error('Please provide both email and name for the new sponsor');
      return;
    }

    try {
      setAddingSponsor(true);
      
      // Add new user with sponsor role
      const userRef = doc(collection(db, 'users'));
      await setDoc(userRef, {
        email: newSponsorEmail,
        displayName: newSponsorName,
        role: 'sponsor',
        createdAt: new Date()
      });
      
      // Add to local state
      const newSponsor = {
        id: userRef.id,
        email: newSponsorEmail,
        displayName: newSponsorName,
        role: 'sponsor'
      };
      
      setSponsors([...sponsors, newSponsor]);
      setSelectedSponsors([...selectedSponsors, newSponsorEmail]);
      
      // Reset form
      setNewSponsorEmail('');
      setNewSponsorName('');
      setShowAddSponsor(false);
      
      toast.success('New sponsor added successfully');
    } catch (error) {
      console.error('Error adding sponsor:', error);
      toast.error('Failed to add new sponsor');
    } finally {
      setAddingSponsor(false);
    }
  };

  const addCaptainSelection = () => {
    if (selectedCaptains.length < 4) {
      setSelectedCaptains([...selectedCaptains, '']);
    }
  };

  const removeCaptainSelection = (index: number) => {
    setSelectedCaptains(selectedCaptains.filter((_, i) => i !== index));
  };

  const updateCaptainSelection = (index: number, value: string) => {
    const newCaptains = [...selectedCaptains];
    newCaptains[index] = value;
    setSelectedCaptains(newCaptains);
  };

  const addSponsorSelection = () => {
    if (selectedSponsors.length < 4) {
      setSelectedSponsors([...selectedSponsors, '']);
    }
  };

  const removeSponsorSelection = (index: number) => {
    setSelectedSponsors(selectedSponsors.filter((_, i) => i !== index));
  };

  const updateSponsorSelection = (index: number, value: string) => {
    const newSponsors = [...selectedSponsors];
    newSponsors[index] = value;
    setSelectedSponsors(newSponsors);
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
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
            <Dialog.Panel className="mx-auto max-w-md w-full rounded-xl bg-white p-6 relative overflow-y-auto max-h-[90vh]">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <Dialog.Title className="text-xl font-semibold text-[#0A2540] mb-6 pr-8">
                {club.id ? `Assign Club: ${club.name}` : 'Create New Club Assignment'}
              </Dialog.Title>

              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Captains (up to 4)
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowAddCaptain(!showAddCaptain)}
                          className="text-xs flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <PlusCircleIcon className="w-3 h-3 mr-1" />
                          Add New
                        </button>
                      </div>
                      
                      {showAddCaptain && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                          <h4 className="text-xs font-medium text-blue-800 mb-2">Add New Captain</h4>
                          <form onSubmit={handleAddCaptain} className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Email
                              </label>
                              <input
                                type="email"
                                value={newCaptainEmail}
                                onChange={(e) => setNewCaptainEmail(e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="captain@example.com"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Name
                              </label>
                              <input
                                type="text"
                                value={newCaptainName}
                                onChange={(e) => setNewCaptainName(e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Full Name"
                              />
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => setShowAddCaptain(false)}
                                className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleAddCaptain}
                                disabled={addingCaptain}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {addingCaptain ? 'Adding...' : 'Add Captain'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {selectedCaptains.map((captainEmail, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <select
                              value={captainEmail}
                              onChange={(e) => updateCaptainSelection(index, e.target.value)}
                              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                            >
                              <option value="">-- Select Captain --</option>
                              {captains.map((captain) => (
                                <option key={captain.id} value={captain.email}>
                                  {captain.displayName || captain.email}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeCaptainSelection(index)}
                              className="p-1 text-red-500 hover:text-red-700 rounded"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      {selectedCaptains.length < 4 && (
                        <button
                          type="button"
                          onClick={addCaptainSelection}
                          className="mt-2 text-xs flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <PlusCircleIcon className="w-3 h-3 mr-1" />
                          Add Another Captain
                        </button>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Sponsors (up to 4)
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowAddSponsor(!showAddSponsor)}
                          className="text-xs flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <PlusCircleIcon className="w-3 h-3 mr-1" />
                          Add New
                        </button>
                      </div>
                      
                      {showAddSponsor && (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                          <h4 className="text-xs font-medium text-blue-800 mb-2">Add New Sponsor</h4>
                          <form onSubmit={handleAddSponsor} className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Email
                              </label>
                              <input
                                type="email"
                                value={newSponsorEmail}
                                onChange={(e) => setNewSponsorEmail(e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="sponsor@example.com"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Name
                              </label>
                              <input
                                type="text"
                                value={newSponsorName}
                                onChange={(e) => setNewSponsorName(e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Full Name"
                              />
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => setShowAddSponsor(false)}
                                className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleAddSponsor}
                                disabled={addingSponsor}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {addingSponsor ? 'Adding...' : 'Add Sponsor'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {selectedSponsors.map((sponsorEmail, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <select
                              value={sponsorEmail}
                              onChange={(e) => updateSponsorSelection(index, e.target.value)}
                              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                            >
                              <option value="">-- Select Sponsor --</option>
                              {sponsors.map((sponsor) => (
                                <option key={sponsor.id} value={sponsor.email}>
                                  {sponsor.displayName || sponsor.email}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeSponsorSelection(index)}
                              className="p-1 text-red-500 hover:text-red-700 rounded"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      {selectedSponsors.length < 4 && (
                        <button
                          type="button"
                          onClick={addSponsorSelection}
                          className="mt-2 text-xs flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <PlusCircleIcon className="w-3 h-3 mr-1" />
                          Add Another Sponsor
                        </button>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 bg-[#38BFA1] text-white rounded-md hover:bg-[#2A8E9E] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Saving...' : 'Save Assignments'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
} 