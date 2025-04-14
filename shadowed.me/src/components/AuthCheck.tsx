'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog } from '@headlessui/react';
import LoadingSpinner from './LoadingSpinner';
import { ClubListing } from '@/types/club';

export default function AuthCheck() {
  const { user, setUserRole, setCaptainClubs } = useAuth();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [clubs, setClubs] = useState<ClubListing[]>([]);
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // If name and role exist, user has completed setup
          if (userData.displayName && userData.role) {
            setShowProfileSetup(false);
            setUserRole(userData.role);
            setCaptainClubs(userData.captainClubs || []);
          } else {
            // User needs to complete profile setup
            setName(userData.displayName || user.displayName || '');
            setEmail(userData.email || user.email || '');
            setShowProfileSetup(true);
          }
        } else {
          // New user, show profile setup
          setName(user.displayName || '');
          setEmail(user.email || '');
          setShowProfileSetup(true);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    const fetchClubs = async () => {
      try {
        setLoadingClubs(true);
        const clubsSnapshot = await getDocs(collection(db, 'clubs'));
        const clubsData = clubsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ClubListing[];
        
        // Sort clubs alphabetically to ensure consistent order
        clubsData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setClubs(clubsData);
      } catch (error) {
        console.error('Error fetching clubs:', error);
      } finally {
        setLoadingClubs(false);
      }
    };

    fetchUserProfile();
    fetchClubs();
  }, [user, setUserRole, setCaptainClubs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // Check if user already exists and has a role
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      // Preserve existing role if user already has one
      const role = userDoc.exists() && userDoc.data().role 
        ? userDoc.data().role 
        : 'captain'; // Default to captain only for new users
      
      // Update user data
      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        email: email,
        role: role,
        createdAt: new Date().toISOString(),
        photoURL: user.photoURL,
        captainClubs: selectedClubs
      });
      
      // If captain role and clubs were selected, update them
      if (role === 'captain' && selectedClubs.length > 0) {
        for (const clubId of selectedClubs) {
          const clubRef = doc(db, 'clubs', clubId);
          const clubDoc = await getDoc(clubRef);
          
          if (clubDoc.exists()) {
            const clubData = clubDoc.data();
            const captains = clubData.captains || [];
            
            // Check if email already exists in captains array
            if (!captains.includes(email)) {
              captains.push(email);
            }
            
            await updateDoc(clubRef, {
              captain: email, // Set as primary captain
              captains: captains, // Update all captains
              updated: new Date().toISOString()
            });
          }
        }
        
        // Update admin records to ensure captain assignments are tracked
        const adminRecordRef = doc(db, 'adminRecords', 'captainAssignments');
        const adminDoc = await getDoc(adminRecordRef);
        
        if (adminDoc.exists()) {
          // Update existing record
          await updateDoc(adminRecordRef, {
            captainAssignments: arrayUnion({
              captainEmail: email,
              captainName: name,
              clubIds: selectedClubs,
              assignedAt: new Date().toISOString()
            })
          });
        } else {
          // Create new record if it doesn't exist
          await setDoc(adminRecordRef, {
            captainAssignments: [{
              captainEmail: email,
              captainName: name,
              clubIds: selectedClubs,
              assignedAt: new Date().toISOString()
            }]
          });
        }
      }
      
      setUserRole(role);
      setCaptainClubs(selectedClubs);
      setShowProfileSetup(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show the dialog when we need to set up the profile
  if (!user || !showProfileSetup) return null;

  return (
    <Dialog open={showProfileSetup} onClose={() => {}} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-2xl font-semibold text-black mb-6">
            Complete Your Profile
          </Dialog.Title>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#38BFA1] focus:border-[#38BFA1] outline-none text-black"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#38BFA1] focus:border-[#38BFA1] outline-none text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-3">
                  Select Clubs You Captain (up to 8)
                </label>
                
                {loadingClubs ? (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {clubs.map((club, idx) => (
                      <div key={`club-item-${club.id}-${idx}`} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={`club-${club.id}`}
                          checked={selectedClubs.includes(club.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (selectedClubs.length < 8) {
                                setSelectedClubs([...selectedClubs, club.id]);
                              }
                            } else {
                              setSelectedClubs(selectedClubs.filter(id => id !== club.id));
                            }
                          }}
                          className="h-4 w-4 text-[#38BFA1] border-gray-300 rounded focus:ring-[#38BFA1]"
                        />
                        <label htmlFor={`club-${club.id}`} className="ml-2 block text-sm text-black">
                          {club.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="mt-2 text-xs text-black">
                  Select the clubs you are a captain of. You can add more later.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#38BFA1] text-white rounded-lg shadow hover:bg-[#2DA891] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 