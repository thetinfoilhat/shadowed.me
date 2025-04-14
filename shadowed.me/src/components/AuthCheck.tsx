'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog } from '@headlessui/react';
import LoadingSpinner from './LoadingSpinner';
import { ClubSite } from '@/types/club';

export default function AuthCheck() {
  const { user, setUserRole, setCaptainClubs } = useAuth();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [clubs, setClubs] = useState<ClubSite[]>([]);
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
        // Updated to use clubSites collection instead of clubs
        const clubsSnapshot = await getDocs(collection(db, 'clubSites'));
        const clubsData = clubsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ClubSite[];
        
        // Sort clubs alphabetically to ensure consistent order
        clubsData.sort((a, b) => (a.clubName || '').localeCompare(b.clubName || ''));
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
      
      // Set role to captain if clubs are selected, otherwise preserve existing role
      const role = selectedClubs.length > 0 
        ? 'captain' 
        : (userDoc.exists() && userDoc.data().role) 
          ? userDoc.data().role 
          : 'student'; // Default to student if no clubs selected and no previous role
      
      // Update user data
      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        email: email,
        role: role,
        createdAt: new Date(),
        photoURL: user.photoURL,
        captainClubs: selectedClubs
      });
      
      // If captain role and clubs were selected, update them
      if (role === 'captain' && selectedClubs.length > 0) {
        for (const clubId of selectedClubs) {
          const clubRef = doc(db, 'clubSites', clubId);
          const clubDoc = await getDoc(clubRef);
          
          if (clubDoc.exists()) {
            const clubData = clubDoc.data();
            
            // Format captain data with display name - standardized format
            const formattedCaptain = `${name} (${email})`;
            
            // Get or create the jamboreeMeetingInfo object
            const jamboreeMeetingInfo = clubData.jamboreeMeetingInfo || {};
            
            // Format captains as a comma-separated string with display names and emails
            let captainsString = "";
            
            // If captains exist in jamboreeMeetingInfo, parse and add the new captain
            if (jamboreeMeetingInfo.captains) {
              const existingCaptains = jamboreeMeetingInfo.captains.split(/,\s*/).filter(Boolean);
              // Check if the new captain is already in the list (check for email match)
              const alreadyExists = existingCaptains.some((captain: string) => 
                captain.includes(`(${email})`) || captain === email
              );
              
              if (!alreadyExists) {
                existingCaptains.push(formattedCaptain);
              }
              captainsString = existingCaptains.join(', ');
            } else {
              captainsString = formattedCaptain;
            }
            
            // Update the jamboreeMeetingInfo with the standardized format
            jamboreeMeetingInfo.captains = captainsString;
            
            // Create arrays of captain emails for backwards compatibility
            const emails = captainsString.split(/,\s*/)
              .map(captain => {
                // Extract email from "Display Name (email)" format
                const emailMatch = captain.match(/\(([^)]+)\)/);
                return emailMatch ? emailMatch[1] : captain;
              });
            
            // Update the document with standardized captain information
            // and remove any legacy fields to prevent duplication
            await updateDoc(clubRef, {
              // Include jamboreeMeetingInfo with properly formatted captains
              jamboreeMeetingInfo: jamboreeMeetingInfo,
              // For backwards compatibility, keep the captains array
              captains: emails,
              // Remove legacy fields by setting to null
              captain: null,
              captainsList: null,
              captainsString: null,
              // Update timestamp
              updatedAt: new Date()
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
              assignedAt: new Date()
            })
          });
        } else {
          // Create new record if it doesn't exist
          await setDoc(adminRecordRef, {
            captainAssignments: [{
              captainEmail: email,
              captainName: name,
              clubIds: selectedClubs,
              assignedAt: new Date()
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
                    {clubs.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No clubs found</p>
                    ) : (
                      clubs.map((club, idx) => (
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
                            {club.clubName}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                <p className="mt-2 text-xs text-black">
                  Select the clubs you are a captain of (maximum 8). You can add more later.
                </p>
                {selectedClubs.length >= 8 && (
                  <p className="mt-1 text-xs text-orange-600 font-medium">
                    Maximum selection reached (8 clubs).
                  </p>
                )}
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