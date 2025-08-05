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
  const [selectedCaptains, setSelectedCaptains] = useState<string[]>([]);
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [renderKey, setRenderKey] = useState(Date.now());

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
        
        console.log("Club data:", JSON.stringify({
          id: club.id,
          clubName: club.clubName,
          captain: club.captain,
          captains: club.captains,
          captainDetails: club.captainDetails,
          jamboreeMeetingInfo: club.jamboreeMeetingInfo
        }, null, 2));
        
        // PRIORITY 1: Use captainEmails array (new standard)
        if (club.captainEmails && club.captainEmails.length > 0) {
          captainEmailsToSelect = club.captainEmails;
          console.log("Using captainEmails:", captainEmailsToSelect);
        }
        // PRIORITY 2: Use captainDetails and sponsorDetails (most accurate with both email and display name)
        else if (club.captainDetails && club.captainDetails.length > 0) {
          captainEmailsToSelect = club.captainDetails.map(captain => captain.email);
          console.log("Using captainDetails:", captainEmailsToSelect);
        } 
        // PRIORITY 3: Use captains array (direct emails) 
        else if (club.captains && club.captains.length > 0) {
          captainEmailsToSelect = club.captains;
          console.log("Using captains array:", captainEmailsToSelect);
        } 
        // PRIORITY 4: Use single captain value (legacy)
        else if (club.captain) {
          captainEmailsToSelect = [club.captain];
          console.log("Using single captain:", captainEmailsToSelect);
        }
        // PRIORITY 4: Use jamboreeMeetingInfo.captains (display names only, try to match to emails)
        else if (club.jamboreeMeetingInfo?.captains) {
          const captainNames = club.jamboreeMeetingInfo.captains.split(/,\s*/).filter(Boolean);
          console.log("Found captainNames from jamboreeMeetingInfo:", captainNames);
          
          // For each name, try to find a matching captain by display name
          captainNames.forEach(name => {
            const nameTrimmed = name.trim();
            console.log(`Looking for captain matching '${nameTrimmed}'`);
            
            // Check all captains for an exact or partial match
            for (const captain of captainsData) {
              const displayName = (captain.displayName || '').trim();
              console.log(`Comparing with captain: '${displayName}'`);
              
              if (displayName === nameTrimmed || 
                  nameTrimmed.includes(displayName) ||
                  displayName.includes(nameTrimmed)) {
                console.log(`Found match: '${displayName}' → ${captain.email}`);
                captainEmailsToSelect.push(captain.email);
                break;
              }
            }
          });

          // Special case: "Aiden Xie" in jamboreeMeetingInfo
          if (club.jamboreeMeetingInfo.captains.includes("Aiden Xie")) {
            console.log("Special case: Found Aiden Xie in jamboreeMeetingInfo");
            const aidenCaptain = captainsData.find(c => c.displayName === "Aiden Xie");
            if (aidenCaptain && !captainEmailsToSelect.includes(aidenCaptain.email)) {
              console.log(`Adding Aiden's email: ${aidenCaptain.email}`);
              captainEmailsToSelect.push(aidenCaptain.email);
            }
          }
        }
        
        // Same priority order for sponsors
        // PRIORITY 1: Use sponsorDetails
        if (club.sponsorDetails && club.sponsorDetails.length > 0) {
          sponsorEmailsToSelect = club.sponsorDetails.map(sponsor => sponsor.email);
          console.log("Using sponsorDetails:", sponsorEmailsToSelect);
        }
        // PRIORITY 2: Use sponsorEmails array 
        else if (club.sponsorEmails && club.sponsorEmails.length > 0) {
          sponsorEmailsToSelect = club.sponsorEmails;
          console.log("Using sponsorEmails array:", sponsorEmailsToSelect);
        } 
        // PRIORITY 3: Use single sponsorEmail value (legacy)
        else if (club.sponsorEmail) {
          sponsorEmailsToSelect = [club.sponsorEmail];
          console.log("Using single sponsorEmail:", sponsorEmailsToSelect);
        }
        // PRIORITY 4: Use jamboreeMeetingInfo.sponsor (display names only, try to match to emails)
        else if (club.jamboreeMeetingInfo?.sponsor) {
          const sponsorNames = club.jamboreeMeetingInfo.sponsor.split(/,\s*/).filter(Boolean);
          console.log("Found sponsorNames from jamboreeMeetingInfo:", sponsorNames);
          
          // For each name, try to find a matching sponsor by display name
          sponsorNames.forEach(name => {
            const nameTrimmed = name.trim();
            console.log(`Looking for sponsor matching '${nameTrimmed}'`);
            
            // Check all sponsors for an exact or partial match
            for (const sponsor of sponsorsData) {
              const displayName = (sponsor.displayName || '').trim();
              console.log(`Comparing with sponsor: '${displayName}'`);
              
              if (displayName === nameTrimmed || 
                  nameTrimmed.includes(displayName) ||
                  displayName.includes(nameTrimmed)) {
                console.log(`Found match: '${displayName}' → ${sponsor.email}`);
                sponsorEmailsToSelect.push(sponsor.email);
                break;
              }
            }
          });
        }
        
        // Ensure we have the correct number of empty selections if nothing is set
        if (captainEmailsToSelect.length === 0) {
          captainEmailsToSelect = [''];  // Start with one empty entry for captain
        }
        
        if (sponsorEmailsToSelect.length === 0) {
          sponsorEmailsToSelect = [''];  // Start with one empty entry for sponsor
        }
        
        // Force a re-render of the form when we have the actual data
        console.log("Final captains to select:", captainEmailsToSelect);
        console.log("Final sponsors to select:", sponsorEmailsToSelect);
        
        // Set initial values
        setSelectedCaptains(captainEmailsToSelect);
        setSelectedSponsors(sponsorEmailsToSelect);
        
        console.log("Final state after initialization:");
        console.log("- Captains data:", captainsData);
        console.log("- Selected captains:", captainEmailsToSelect);
        console.log("- Sponsors data:", sponsorsData);
        console.log("- Selected sponsors:", sponsorEmailsToSelect);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      setRenderKey(Date.now()); // Force a re-render by updating the key
      fetchUsers();
    }
  }, [isOpen, club]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log the current state for debugging
    console.log("Submitting with captains:", selectedCaptains);
    console.log("Submitting with sponsors:", selectedSponsors);
    
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
      
      // Find captains that have been removed by comparing initial and current lists
      const initialCaptains = club.captainEmails || club.captains || (club.captain ? [club.captain] : []);
      const removedCaptains = initialCaptains.filter(email => !filteredCaptains.includes(email));
      
      // For each removed captain, update their user document to remove this club from captainClubs
      if (removedCaptains.length > 0 && club.id) {
        const usersCollection = collection(db, 'users');
        
        for (const captainEmail of removedCaptains) {
          const captainQuery = query(usersCollection, where('email', '==', captainEmail));
          const captainSnapshot = await getDocs(captainQuery);
          
          if (!captainSnapshot.empty) {
            const captainDoc = captainSnapshot.docs[0];
            const captainData = captainDoc.data();
            
            // Remove club ID from captainClubs array
            if (captainData.captainClubs && Array.isArray(captainData.captainClubs)) {
              const updatedClubs = captainData.captainClubs.filter((id: string) => id !== club.id);
              
              // Update the user document
              await updateDoc(doc(db, 'users', captainDoc.id), {
                captainClubs: updatedClubs
              });
            }
          }
        }
      }
      
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
        
        // Use new data structure as primary
        updateData.captainEmails = filteredCaptains;
        updateData.captainDetails = captainDetailsArray;
        // Keep backward compatibility 
        updateData.captain = filteredCaptains[0];
        updateData.captains = filteredCaptains;
        
        // Update captainClubs array for all assigned captains
        if (club.id) {
          const usersCollection = collection(db, 'users');
          for (const captainEmail of filteredCaptains) {
            const captainQuery = query(usersCollection, where('email', '==', captainEmail));
            const captainSnapshot = await getDocs(captainQuery);
            
            if (!captainSnapshot.empty) {
              const captainDoc = captainSnapshot.docs[0];
              const captainData = captainDoc.data();
              const currentCaptainClubs = captainData.captainClubs || [];
              
              // Add club to captain's captainClubs array if not already there
              const updatedCaptainClubs = currentCaptainClubs.includes(club.id) 
                ? currentCaptainClubs 
                : [...currentCaptainClubs, club.id];
              
              // Update the user document
              await updateDoc(doc(db, 'users', captainDoc.id), {
                captainClubs: updatedCaptainClubs
              });
            }
          }
        }
        
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
        
        // Use new data structure as primary
        updateData.sponsorEmails = filteredSponsors;
        updateData.sponsorDetails = sponsorDetailsArray;
        // Keep backward compatibility
        updateData.sponsorEmail = filteredSponsors[0];
        
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

  // Captain selection dropdown
  const updateCaptainSelection = (index: number, value: string) => {
    const newSelections = [...selectedCaptains];
    newSelections[index] = value;
    setSelectedCaptains(newSelections);
    
    console.log("Updated captain selections:", newSelections);
  };

  const addCaptainSelection = () => {
    if (selectedCaptains.length < 4) {
      setSelectedCaptains([...selectedCaptains, '']);
    }
  };

  const removeCaptainSelection = (index: number) => {
    const newSelections = [...selectedCaptains];
    newSelections.splice(index, 1);
    setSelectedCaptains(newSelections);
    
    console.log("After removing captain:", newSelections);
  };

  // Sponsor selection dropdown
  const updateSponsorSelection = (index: number, value: string) => {
    const newSelections = [...selectedSponsors];
    newSelections[index] = value;
    setSelectedSponsors(newSelections);
    
    console.log("Updated sponsor selections:", newSelections);
  };

  const addSponsorSelection = () => {
    if (selectedSponsors.length < 4) {
      setSelectedSponsors([...selectedSponsors, '']);
    }
  };

  const removeSponsorSelection = (index: number) => {
    const newSelections = [...selectedSponsors];
    newSelections.splice(index, 1);
    setSelectedSponsors(newSelections);
    
    console.log("After removing sponsor:", newSelections);
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog 
        key={`club-assignment-modal-${club.id || 'new'}-${renderKey}`} 
        onClose={onClose} 
        className="relative z-50"
      >
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
                  <form 
                    key={`club-form-${club.id}-${renderKey}`}
                    onSubmit={handleSubmit} 
                    className="space-y-5"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Captains (up to 4)
                        </label>
                      </div>
                      
                      <div className="space-y-2">
                        {selectedCaptains.map((captainEmail, index) => (
                          <div key={`captain-${index}-${captainEmail}-${renderKey}`} className="flex items-center space-x-2">
                            <select
                              value={captainEmail}
                              defaultValue={captainEmail}
                              onChange={(e) => updateCaptainSelection(index, e.target.value)}
                              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                              disabled={submitting}
                            >
                              <option value="">-- Select Captain --</option>
                              {captains.map((captain) => (
                                <option 
                                  key={captain.id} 
                                  value={captain.email}
                                >
                                  {captain.displayName || captain.email}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeCaptainSelection(index)}
                              className="p-1 text-red-500 hover:text-red-700 rounded"
                              disabled={submitting}
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
                          <div key={`sponsor-${index}-${sponsorEmail}-${renderKey}`} className="flex items-center space-x-2">
                            <select
                              value={sponsorEmail}
                              defaultValue={sponsorEmail}
                              onChange={(e) => updateSponsorSelection(index, e.target.value)}
                              className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                              disabled={submitting}
                            >
                              <option value="">-- Select Sponsor --</option>
                              {sponsors.map((sponsor) => (
                                <option 
                                  key={sponsor.id} 
                                  value={sponsor.email}
                                >
                                  {sponsor.displayName || sponsor.email}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeSponsorSelection(index)}
                              className="p-1 text-red-500 hover:text-red-700 rounded"
                              disabled={submitting}
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