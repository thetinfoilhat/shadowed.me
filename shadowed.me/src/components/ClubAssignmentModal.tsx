'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { doc, updateDoc, collection, getDocs, query, where, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { ClubSite } from '@/types/club';
import LoadingSpinner from './LoadingSpinner';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

// Update the imported ClubSite type to include captain and sponsor details
declare module '@/types/club' {
  interface ClubSite {
    captainDetails?: {
      email: string;
      displayName: string;
    }[];
    sponsorDetails?: {
      email: string;
      displayName: string;
    }[];
  }
}

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface ClubAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Partial<ClubSite>;
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
        
        // Initialize arrays to hold selected captains and sponsors
        let captainEmailsToSelect: string[] = [];
        let sponsorEmailsToSelect: string[] = [];
        
        // PRIORITY 1: Use captainDetails and sponsorDetails (most accurate with both email and display name)
        if (club.captainDetails && club.captainDetails.length > 0) {
          captainEmailsToSelect = club.captainDetails.map(captain => captain.email);
        } 
        // PRIORITY 2: Use captains array (direct emails) 
        else if (club.captains && club.captains.length > 0) {
          captainEmailsToSelect = club.captains;
        } 
        // PRIORITY 3: Use single captain value (legacy)
        else if (club.captain) {
          captainEmailsToSelect = [club.captain];
        }
        
        // Same priority order for sponsors
        // PRIORITY 1: Use sponsorDetails
        if (club.sponsorDetails && club.sponsorDetails.length > 0) {
          sponsorEmailsToSelect = club.sponsorDetails.map(sponsor => sponsor.email);
        }
        // PRIORITY 2: Use sponsorEmails array 
        else if (club.sponsorEmails && club.sponsorEmails.length > 0) {
          sponsorEmailsToSelect = club.sponsorEmails;
        } 
        // PRIORITY 3: Use single sponsorEmail value (legacy)
        else if (club.sponsorEmail) {
          sponsorEmailsToSelect = [club.sponsorEmail];
        }
        
        // Set initial values
        setSelectedCaptains(captainEmailsToSelect.length > 0 ? captainEmailsToSelect : []);
        setSelectedSponsors(sponsorEmailsToSelect.length > 0 ? sponsorEmailsToSelect : []);
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
      
      // Create or update jamboreeMeetingInfo field
      const jamboreeMeetingInfo: Record<string, unknown> = { 
        ...(club.jamboreeMeetingInfo as Record<string, unknown> || {})
      };
      
      // Filter out any empty values
      const filteredCaptains = selectedCaptains.filter(email => email.trim() !== '');
      const filteredSponsors = selectedSponsors.filter(email => email.trim() !== '');
      
      // Update captains and sponsors in jamboreeMeetingInfo
      if (filteredCaptains.length > 0) {
        // Create captain details array with both email and display name
        const captainDetailsArray = filteredCaptains.map(email => {
          const captain = captains.find(c => c.email === email);
          const displayName = captain && captain.displayName ? captain.displayName : email;
          return { email, displayName };
        });
        
        // Format captain data with display names
        const formattedCaptains = captainDetailsArray
          .map(captain => captain.displayName)
          .join(', ');
        
        // Also keep backward compatibility 
        updateData.captain = filteredCaptains[0];
        updateData.captains = filteredCaptains;
        updateData.captainDetails = captainDetailsArray;
        
        // Format for jamboreeMeetingInfo as comma-separated string with display names
        jamboreeMeetingInfo.captains = formattedCaptains;
      } else {
        // Clear captains if the filtered array is empty
        updateData.captain = '';
        updateData.captains = [];
        updateData.captainDetails = [];
        jamboreeMeetingInfo.captains = '';
      }
      
      if (filteredSponsors.length > 0) {
        // Create sponsor details array with both email and display name
        const sponsorDetailsArray = filteredSponsors.map(email => {
          const sponsor = sponsors.find(s => s.email === email);
          const displayName = sponsor && sponsor.displayName ? sponsor.displayName : email;
          return { email, displayName };
        });
        
        // Format sponsor data with display names
        const formattedSponsors = sponsorDetailsArray
          .map(sponsor => sponsor.displayName)
          .join(', ');
        
        // Also keep backward compatibility
        updateData.sponsorEmail = filteredSponsors[0];
        updateData.sponsorEmails = filteredSponsors;
        updateData.sponsorDetails = sponsorDetailsArray;
        
        // Format for jamboreeMeetingInfo as comma-separated string with display names
        jamboreeMeetingInfo.sponsor = formattedSponsors;
      } else {
        // Clear sponsors if the filtered array is empty
        updateData.sponsorEmail = '';
        updateData.sponsorEmails = [];
        updateData.sponsorDetails = [];
        jamboreeMeetingInfo.sponsor = '';
      }
      
      // Add jamboreeMeetingInfo to update data
      updateData.jamboreeMeetingInfo = jamboreeMeetingInfo;
      
      // Add a check to ensure club.id is defined
      if (club.id) {
        await updateDoc(doc(db, 'clubSites', club.id), updateData as DocumentData);
        
        toast.success('Club assignments updated successfully');
        onAssignmentComplete();
        onClose();
      } else {
        toast.error('Club ID is missing');
      }
    } catch (error) {
      console.error('Error updating club assignments:', error);
      toast.error('Failed to update club assignments');
    } finally {
      setSubmitting(false);
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
                {club.id ? `Assign Club: ${club.clubName || 'Unnamed Club'}` : 'Create New Club Assignment'}
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
                      </div>
                      
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
                      </div>
                      
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