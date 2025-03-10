'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect, useRef } from 'react';
import { doc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { ClubListing } from '@/types/club';
import LoadingSpinner from './LoadingSpinner';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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
  const [selectedCaptains, setSelectedCaptains] = useState<User[]>([]);
  const [selectedSponsors, setSelectedSponsors] = useState<User[]>([]);
  const [captainSearch, setCaptainSearch] = useState('');
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const captainSearchRef = useRef<HTMLInputElement>(null);
  const sponsorSearchRef = useRef<HTMLInputElement>(null);

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
        if (club.captain) {
          const initialCaptain = captainsData.find(c => c.email === club.captain);
          if (initialCaptain) {
            setSelectedCaptains([initialCaptain]);
          }
        }
        
        if (club.sponsorEmail) {
          const initialSponsor = sponsorsData.find(s => s.email === club.sponsorEmail);
          if (initialSponsor) {
            setSelectedSponsors([initialSponsor]);
          }
        }
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

  const filteredCaptains = captains.filter(captain => 
    !selectedCaptains.some(selected => selected.id === captain.id) &&
    (captain.displayName?.toLowerCase().includes(captainSearch.toLowerCase()) || 
     captain.email.toLowerCase().includes(captainSearch.toLowerCase()))
  );

  const filteredSponsors = sponsors.filter(sponsor => 
    !selectedSponsors.some(selected => selected.id === sponsor.id) &&
    (sponsor.displayName?.toLowerCase().includes(sponsorSearch.toLowerCase()) || 
     sponsor.email.toLowerCase().includes(sponsorSearch.toLowerCase()))
  );

  const addCaptain = (captain: User) => {
    setSelectedCaptains([...selectedCaptains, captain]);
    setCaptainSearch('');
    setTimeout(() => captainSearchRef.current?.focus(), 0);
  };

  const removeCaptain = (captainId: string) => {
    setSelectedCaptains(selectedCaptains.filter(c => c.id !== captainId));
  };

  const addSponsor = (sponsor: User) => {
    setSelectedSponsors([...selectedSponsors, sponsor]);
    setSponsorSearch('');
    setTimeout(() => sponsorSearchRef.current?.focus(), 0);
  };

  const removeSponsor = (sponsorId: string) => {
    setSelectedSponsors(selectedSponsors.filter(s => s.id !== sponsorId));
  };

  const handleCaptainKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredCaptains.length > 0) {
      e.preventDefault();
      addCaptain(filteredCaptains[0]);
    }
  };

  const handleSponsorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredSponsors.length > 0) {
      e.preventDefault();
      addSponsor(filteredSponsors[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      // Update club with new captains and sponsors
      await updateDoc(doc(db, 'clubs', club.id), {
        captains: selectedCaptains.map(c => c.email),
        sponsorEmails: selectedSponsors.map(s => s.email),
        // Keep the original single fields for backward compatibility
        captain: selectedCaptains.length > 0 ? selectedCaptains[0].email : '',
        sponsorEmail: selectedSponsors.length > 0 ? selectedSponsors[0].email : '',
        updatedAt: new Date()
      });
      
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
            <Dialog.Panel className="mx-auto max-w-md w-full rounded-xl bg-white p-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              <Dialog.Title className="text-2xl font-bold text-black mb-6">
                Assign Club: {club.name}
              </Dialog.Title>

              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Captains Section */}
                  <div>
                    <label htmlFor="captains" className="block text-sm font-medium text-black mb-2">
                      Captains
                    </label>
                    
                    {/* Selected Captains */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedCaptains.map(captain => (
                        <div 
                          key={captain.id} 
                          className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                        >
                          <span>{captain.displayName || captain.email}</span>
                          <button 
                            type="button" 
                            onClick={() => removeCaptain(captain.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Captain Search */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        ref={captainSearchRef}
                        type="text"
                        id="captains"
                        placeholder="Search for captains..."
                        value={captainSearch}
                        onChange={(e) => setCaptainSearch(e.target.value)}
                        onKeyDown={handleCaptainKeyDown}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                      />
                    </div>
                    
                    {/* Captain Search Results */}
                    {captainSearch && filteredCaptains.length > 0 && (
                      <ul className="mt-1 max-h-40 overflow-auto border border-gray-200 rounded-md shadow-sm bg-white z-10">
                        {filteredCaptains.map(captain => (
                          <li 
                            key={captain.id}
                            onClick={() => addCaptain(captain)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-black"
                          >
                            {captain.displayName || captain.email}
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    {captainSearch && filteredCaptains.length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">No matching captains found</p>
                    )}
                    
                    <p className="mt-2 text-sm text-gray-500">Selected: {selectedCaptains.length}</p>
                  </div>

                  {/* Sponsors Section */}
                  <div>
                    <label htmlFor="sponsors" className="block text-sm font-medium text-black mb-2">
                      Sponsors
                    </label>
                    
                    {/* Selected Sponsors */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedSponsors.map(sponsor => (
                        <div 
                          key={sponsor.id} 
                          className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full"
                        >
                          <span>{sponsor.displayName || sponsor.email}</span>
                          <button 
                            type="button" 
                            onClick={() => removeSponsor(sponsor.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Sponsor Search */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        ref={sponsorSearchRef}
                        type="text"
                        id="sponsors"
                        placeholder="Search for sponsors..."
                        value={sponsorSearch}
                        onChange={(e) => setSponsorSearch(e.target.value)}
                        onKeyDown={handleSponsorKeyDown}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                      />
                    </div>
                    
                    {/* Sponsor Search Results */}
                    {sponsorSearch && filteredSponsors.length > 0 && (
                      <ul className="mt-1 max-h-40 overflow-auto border border-gray-200 rounded-md shadow-sm bg-white z-10">
                        {filteredSponsors.map(sponsor => (
                          <li 
                            key={sponsor.id}
                            onClick={() => addSponsor(sponsor)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-black"
                          >
                            {sponsor.displayName || sponsor.email}
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    {sponsorSearch && filteredSponsors.length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">No matching sponsors found</p>
                    )}
                    
                    <p className="mt-2 text-sm text-gray-500">Selected: {selectedSponsors.length}</p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300 transition-colors"
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
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
} 