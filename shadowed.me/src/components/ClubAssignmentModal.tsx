'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { doc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { ClubListing } from '@/types/club';
import LoadingSpinner from './LoadingSpinner';

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
  const [selectedCaptain, setSelectedCaptain] = useState<string>(club.captain || '');
  const [selectedSponsor, setSelectedSponsor] = useState<string>(club.sponsorEmail || '');
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
        
        // Set initial values
        setSelectedCaptain(club.captain || '');
        setSelectedSponsor(club.sponsorEmail || '');
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
      
      // Update club with new captain and sponsor
      await updateDoc(doc(db, 'clubs', club.id), {
        captain: selectedCaptain,
        sponsorEmail: selectedSponsor,
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
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <Dialog.Title className="text-2xl font-bold text-[#0A2540] mb-6">
                Assign Club: {club.name}
              </Dialog.Title>

              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="captain" className="block text-sm font-medium text-gray-700 mb-1">
                      Captain
                    </label>
                    <select
                      id="captain"
                      value={selectedCaptain}
                      onChange={(e) => setSelectedCaptain(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                    >
                      <option value="">-- Select Captain --</option>
                      {captains.map((captain) => (
                        <option key={captain.id} value={captain.email}>
                          {captain.displayName || captain.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="sponsor" className="block text-sm font-medium text-gray-700 mb-1">
                      Sponsor
                    </label>
                    <select
                      id="sponsor"
                      value={selectedSponsor}
                      onChange={(e) => setSelectedSponsor(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                    >
                      <option value="">-- Select Sponsor --</option>
                      {sponsors.map((sponsor) => (
                        <option key={sponsor.id} value={sponsor.email}>
                          {sponsor.displayName || sponsor.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-3">
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
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
} 