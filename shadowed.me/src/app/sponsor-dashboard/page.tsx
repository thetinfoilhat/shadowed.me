'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { XCircleIcon, PencilIcon, UserIcon, EyeIcon, MagnifyingGlassIcon, PlusIcon, UserGroupIcon, SparklesIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import ClubEventManager from '@/components/ClubEventManager';
import ClubPostManager from '@/components/ClubPostManager';

interface ClubSite {
  id: string;
  clubName: string;
  slug: string;
  category?: string;
  sponsorEmail?: string;
  sponsorEmails?: string[];
  captainEmail?: string;
  captainEmails?: string[]; // Array of captain emails (up to 4)
  captains?: string[]; // Legacy captain array
  description?: string;
  meetingInfo?: string;
  jamboreeMeetingInfo?: {
    email?: string;
    captains?: string; // Legacy captains as comma-separated string
  };
  activityTypes?: string[];
  updatedAt: Date;
}

interface User {
  uid: string;
  email: string;
  name: string;
  role?: string;
}

export default function SponsorDashboard() {
  const { user, userRole, refreshUserData } = useAuth();
  const [sponsoredClubs, setSponsoredClubs] = useState<ClubSite[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [availableClubs, setAvailableClubs] = useState<ClubSite[]>([]);
  const [selectedClub, setSelectedClub] = useState<ClubSite | null>(null);
  const [selectedCaptains, setSelectedCaptains] = useState<string[]>([]);
  const [showClubInfoModal, setShowClubInfoModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showEventManager, setShowEventManager] = useState(false);
  const [selectedClubForInfo, setSelectedClubForInfo] = useState<ClubSite | null>(null);
  const [selectedClubForMembers, setSelectedClubForMembers] = useState<ClubSite | null>(null);
  const [selectedClubForEvents, setSelectedClubForEvents] = useState<ClubSite | null>(null);
  
  // Post management state
  const [showPostManager, setShowPostManager] = useState(false);
  const [selectedClubForPosts, setSelectedClubForPosts] = useState<ClubSite | null>(null);
  const [clubMembers, setClubMembers] = useState<{ name: string; email: string }[]>([]);
  const [clubInfoForm, setClubInfoForm] = useState({
    description: '',
    meetingInfo: '',
    category: '',
    activityTypes: [] as string[],

    contactEmail: '',
    captains: [] as string[]
  });
  const [captainSearchQuery, setCaptainSearchQuery] = useState<string>('');
  const [clubCaptainSearchQuery, setClubCaptainSearchQuery] = useState<string>('');

  const fetchSponsoredClubs = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      const clubsRef = collection(db, 'clubSites');
      
      let clubsData: ClubSite[];
      
      if (userRole === 'admin') {
        // Admins see all clubs
        const querySnapshot = await getDocs(clubsRef);
        clubsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as ClubSite[];
      } else {
        // Sponsors see clubs where they're in the sponsorEmails array
        const querySnapshot = await getDocs(clubsRef);
        const allClubs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as ClubSite[];
        
        clubsData = allClubs.filter((club: ClubSite) => {
          const sponsorEmails = club.sponsorEmails || [];
          const legacySponsorEmail = club.sponsorEmail;
          return sponsorEmails.includes(user.email!) || legacySponsorEmail === user.email;
        });
      }
      
      setSponsoredClubs(clubsData);
    } catch (error) {
      console.error('Error fetching sponsored clubs:', error);
      toast.error('Failed to load sponsored clubs');
    } finally {
      setLoading(false);
    }
  }, [user?.email, userRole]);

  const fetchAllStudents = useCallback(async () => {
    try {
      const usersRef = collection(db, 'users');
      // Fetch both students and captains for captain assignment
      const studentQuery = query(usersRef, where('role', '==', 'student'));
      const captainQuery = query(usersRef, where('role', '==', 'captain'));
      
      const [studentSnapshot, captainSnapshot] = await Promise.all([
        getDocs(studentQuery),
        getDocs(captainQuery)
      ]);
      
      const studentsData = studentSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email || '',
          name: data.displayName || data.name || data.email || 'No name',
          role: data.role || 'student',
        } as User;
      });
      
      const captainsData = captainSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email || '',
          name: data.displayName || data.name || data.email || 'No name',
          role: data.role || 'captain',
        } as User;
      });
      
      // Combine students and captains
      const allUsers = [...studentsData, ...captainsData];
      setAllStudents(allUsers);
    } catch (error) {
      console.error('Error fetching students and captains:', error);
    }
  }, []);

  const fetchAvailableClubs = useCallback(async () => {
    try {
      const clubsRef = collection(db, 'clubSites');
      const querySnapshot = await getDocs(clubsRef);
      
      const allClubs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as ClubSite[];
      
      const clubsData = allClubs.filter((club: ClubSite) => {
        const sponsorEmails = club.sponsorEmails || [];
        const legacySponsorEmail = club.sponsorEmail;
        const totalSponsors = sponsorEmails.length + (legacySponsorEmail ? 1 : 0);
        return totalSponsors < 4;
      });
      
      setAvailableClubs(clubsData);
    } catch (error) {
      console.error('Error fetching available clubs:', error);
    }
  }, []);

  const handleAssignSponsor = async (clubId: string) => {
    if (!user?.email) return;
    
    try {
      const clubRef = doc(db, 'clubSites', clubId);
      const clubDoc = await getDoc(clubRef);
      
      if (clubDoc.exists()) {
        const clubData = clubDoc.data();
        const currentSponsorEmails = clubData.sponsorEmails || [];
        const legacySponsorEmail = clubData.sponsorEmail;
        
        // Calculate total sponsors (including legacy)
        const totalSponsors = currentSponsorEmails.length + (legacySponsorEmail ? 1 : 0);
        
        if (totalSponsors >= 4) {
          toast.error('This club already has the maximum number of sponsors (4)');
          return;
        }
        
        // Add user to sponsorEmails array if not already there
        if (!currentSponsorEmails.includes(user.email)) {
          const updatedSponsorEmails = [...currentSponsorEmails, user.email];
          
          await updateDoc(clubRef, {
            sponsorEmails: updatedSponsorEmails,
            updatedAt: new Date()
          });
          
          toast.success('Successfully assigned as sponsor');
          setShowDiscoverModal(false);
          fetchSponsoredClubs();
          fetchAvailableClubs();
        } else {
          toast.error('You are already a sponsor of this club');
        }
      }
    } catch (error) {
      console.error('Error assigning sponsor:', error);
      toast.error('Failed to assign sponsor');
    }
  };

  const handleRemoveSponsor = async (clubId: string) => {
    if (!user?.email) return;
    if (!confirm('Are you sure you want to stop sponsoring this club?')) return;
    
    try {
      const clubRef = doc(db, 'clubSites', clubId);
      const clubDoc = await getDoc(clubRef);
      
      if (clubDoc.exists()) {
        const clubData = clubDoc.data();
        const currentSponsorEmails = clubData.sponsorEmails || [];
        
        // Remove user from sponsorEmails array
        const updatedSponsorEmails = currentSponsorEmails.filter((email: string) => email !== user.email);
        
        await updateDoc(clubRef, {
          sponsorEmails: updatedSponsorEmails,
          updatedAt: new Date()
        });
        
        toast.success('Successfully removed as sponsor');
        fetchSponsoredClubs();
        fetchAvailableClubs();
      }
    } catch (error) {
      console.error('Error removing sponsor:', error);
      toast.error('Failed to remove sponsor');
    }
  };

  const handleAssignCaptains = async () => {
    if (!selectedClub || selectedCaptains.length === 0) return;
    
    try {
      // Get captain display names for jamboreeMeetingInfo
      const captainDisplayNames = [];
      for (const captainEmail of selectedCaptains) {
        const captain = allStudents.find(s => s.email === captainEmail);
        const displayName = captain?.name || captainEmail;
        captainDisplayNames.push(displayName);
      }
      
      const clubRef = doc(db, 'clubSites', selectedClub.id);
      await updateDoc(clubRef, {
        captainEmails: selectedCaptains,
        'jamboreeMeetingInfo.captains': captainDisplayNames.join(', '),
        updatedAt: new Date()
      });
      
      // Update user roles to captain for all selected captains using the new API
      const promotedUsers: string[] = [];
      
      for (const captainEmail of selectedCaptains) {
        const userQuery = query(collection(db, 'users'), where('email', '==', captainEmail));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          
          // Use the new API route to update user role and ensure continuity
          const response = await fetch('/api/user-role', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userDoc.id,
              newRole: 'captain',
              clubId: selectedClub.id,
              action: 'add'
            }),
          });

          if (response.ok) {
            promotedUsers.push(captainEmail);
          } else {
            console.error(`Failed to promote ${captainEmail} to captain`);
          }
        }
      }
      
      // If the current user was promoted, refresh their data
      if (promotedUsers.includes(user?.email || '')) {
        // Add a small delay to ensure the API route has finished updating the user document
        setTimeout(async () => {
          await refreshUserData();
        }, 1000);
        
        // Also poll for updates to ensure we get the latest data
        let attempts = 0;
        const maxAttempts = 5;
        const pollInterval = setInterval(async () => {
          attempts++;
          await refreshUserData();
          
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
          }
        }, 2000);
      }
      
      toast.success(`Successfully assigned ${selectedCaptains.length} captain${selectedCaptains.length > 1 ? 's' : ''}. They now have full captain access!`);
      setSelectedClub(null);
      setSelectedCaptains([]);
      fetchSponsoredClubs();
      fetchAllStudents();
    } catch (error) {
      console.error('Error assigning captains:', error);
      toast.error('Failed to assign captains');
    }
  };

  const handleOpenClubInfo = (club: ClubSite) => {
    setSelectedClubForInfo(club);
    
    // Get existing captains from multiple possible sources
    let existingCaptains: string[] = [];
    if (club.captainEmails && club.captainEmails.length > 0) {
      existingCaptains = club.captainEmails;
    } else if (club.captainEmail) {
      existingCaptains = [club.captainEmail];
    } else if (club.captains && club.captains.length > 0) {
      existingCaptains = club.captains;
    } else if (club.jamboreeMeetingInfo?.captains) {
      // Handle legacy captains stored as comma-separated string
      const captainNames = club.jamboreeMeetingInfo.captains.split(/,\s*/).filter(Boolean);
      // Try to match names to emails (this is a fallback)
      existingCaptains = captainNames;
    }
    
    setClubInfoForm({
      description: club.description || '',
      meetingInfo: club.meetingInfo || '',
      category: club.category || '',
      activityTypes: club.activityTypes || [],
      contactEmail: club.jamboreeMeetingInfo?.email || '',
      captains: existingCaptains
    });
    setShowClubInfoModal(true);
  };

  const handleSaveClubInfo = async () => {
    if (!selectedClubForInfo) return;
    
    try {
      // Get the current club data to find removed captains
      const clubRef = doc(db, 'clubSites', selectedClubForInfo.id);
      const clubDoc = await getDoc(clubRef);
      let previousCaptains: string[] = [];
      
      if (clubDoc.exists()) {
        const clubData = clubDoc.data();
        previousCaptains = clubData.captainEmails || clubData.captains || [];
      }
      
      // Find captains that have been removed
      const removedCaptains = previousCaptains.filter(email => !clubInfoForm.captains.includes(email));
      
      // Remove club from captainClubs array for removed captains using the new API
      if (removedCaptains.length > 0) {
        const usersRef = collection(db, 'users');
        for (const captainEmail of removedCaptains) {
          const userQuery = query(usersRef, where('email', '==', captainEmail));
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            
            // Use the new API route to remove captain role
            await fetch('/api/user-role', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: userDoc.id,
                newRole: 'student',
                clubId: selectedClubForInfo.id,
                action: 'remove'
              }),
            });
          }
        }
      }
      
      // Get captain display names for jamboreeMeetingInfo
      const captainDisplayNames = [];
      if (clubInfoForm.captains && clubInfoForm.captains.length > 0) {
        for (const captainEmail of clubInfoForm.captains) {
          const captain = allStudents.find(s => s.email === captainEmail);
          const displayName = captain?.name || captainEmail;
          captainDisplayNames.push(displayName);
        }
      }
      
      await updateDoc(clubRef, {
        description: clubInfoForm.description,
        meetingInfo: clubInfoForm.meetingInfo,
        category: clubInfoForm.category,
        activityTypes: clubInfoForm.activityTypes,

        'jamboreeMeetingInfo.email': clubInfoForm.contactEmail,
        captainEmails: clubInfoForm.captains,
        'jamboreeMeetingInfo.captains': captainDisplayNames.join(', '),
        updatedAt: new Date()
      });
      
      // Update user roles to captain for all assigned captains using the new API
      const promotedUsers: string[] = [];
      if (clubInfoForm.captains && clubInfoForm.captains.length > 0) {
        const usersRef = collection(db, 'users');
        for (const captainEmail of clubInfoForm.captains) {
          const userQuery = query(usersRef, where('email', '==', captainEmail));
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            
            // Use the new API route to update user role and ensure continuity
            const response = await fetch('/api/user-role', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: userDoc.id,
                newRole: 'captain',
                clubId: selectedClubForInfo.id,
                action: 'add'
              }),
            });

            if (response.ok) {
              promotedUsers.push(captainEmail);
            }
          }
        }
      }
      
      // If the current user was promoted, refresh their data
      if (promotedUsers.includes(user?.email || '')) {
        await refreshUserData();
      }
      
      toast.success('Club information updated successfully');
      setShowClubInfoModal(false);
      setSelectedClubForInfo(null);
      fetchSponsoredClubs();
    } catch (error) {
      console.error('Error updating club info:', error);
      toast.error('Failed to update club information');
    }
  };

  const handleOpenMembers = async (club: ClubSite) => {
    setSelectedClubForMembers(club);
    setShowMembersModal(true);
    
    try {
      const clubRef = doc(db, 'clubSites', club.id);
      const clubDoc = await getDoc(clubRef);
      
      if (clubDoc.exists()) {
        const clubData = clubDoc.data();
        const submissions = clubData.interestForm?.submissions || [];
        setClubMembers(submissions);
      } else {
        setClubMembers([]);
      }
    } catch (error) {
      console.error('Error fetching club members:', error);
      toast.error('Failed to load club members');
      setClubMembers([]);
    }
  };

  // Helper function to get captain count from multiple possible sources
  const getCaptainCount = (club: ClubSite): number => {
    if (club.captainEmails && club.captainEmails.length > 0) {
      return club.captainEmails.length;
    } else if (club.captainEmail) {
      return 1;
    } else if (club.captains && club.captains.length > 0) {
      return club.captains.length;
    } else if (club.jamboreeMeetingInfo?.captains) {
      const captainNames = club.jamboreeMeetingInfo.captains.split(/,\s*/).filter(Boolean);
      return captainNames.length;
    }
    return 0;
  };

  const handleRemoveMember = async (memberEmail: string) => {
    if (!selectedClubForMembers) return;
    
    try {
      const clubRef = doc(db, 'clubSites', selectedClubForMembers.id);
      const clubDoc = await getDoc(clubRef);
      
      if (clubDoc.exists()) {
        const clubData = clubDoc.data();
        const submissions = clubData.interestForm?.submissions || [];
        const updatedSubmissions = submissions.filter((sub: { email: string }) => sub.email !== memberEmail);
        
        await updateDoc(clubRef, {
          'interestForm.submissions': updatedSubmissions
        });
        
        // Also remove from user's joined clubs
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('email', '==', memberEmail));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const userData = userDoc.data();
          const joinedClubs = userData.joinedClubs || [];
          const updatedJoinedClubs = joinedClubs.filter((clubId: string) => clubId !== selectedClubForMembers.id);
          
          await updateDoc(doc(db, 'users', userDoc.id), {
            joinedClubs: updatedJoinedClubs
          });
        }
        
        setClubMembers(updatedSubmissions);
        toast.success('Member removed successfully');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  useEffect(() => {
    fetchSponsoredClubs();
    fetchAllStudents();
    fetchAvailableClubs();
  }, [fetchSponsoredClubs, fetchAllStudents, fetchAvailableClubs]);

  const filteredClubs = sponsoredClubs.filter(club =>
    club.clubName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = allStudents.filter(student =>
    !selectedCaptains.includes(student.email) &&
    (student.name?.toLowerCase().includes(captainSearchQuery.toLowerCase()) ||
     student.email.toLowerCase().includes(captainSearchQuery.toLowerCase()))
  );

  const filteredClubStudents = allStudents.filter(student =>
    !clubInfoForm.captains?.includes(student.email) &&
    (student.name?.toLowerCase().includes(clubCaptainSearchQuery.toLowerCase()) ||
     student.email.toLowerCase().includes(clubCaptainSearchQuery.toLowerCase()))
  );

  if (loading) {
    return <LoadingSpinner />;
  }

    return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
          <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {userRole === 'admin' ? 'Admin Dashboard' : 'Sponsor Dashboard'}
            </h1>
            <p className="text-lg text-gray-600">
              Manage your sponsored clubs and guide student leaders
            </p>
          </div>
        </div>

        {/* Sponsored Clubs Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                <SparklesIcon className="h-6 w-6 mr-2 text-[#38BFA1]" />
                Your Sponsored Clubs
              </h2>
              <p className="text-gray-600 mt-1">
                {filteredClubs.length} club{filteredClubs.length !== 1 ? 's' : ''} under your guidance
              </p>
            </div>
            <div className="flex gap-3">
            <button
                onClick={async () => {
                  await refreshUserData();
                  fetchSponsoredClubs();
                  fetchAllStudents();
                  toast.success('Data refreshed!');
                }}
                className="inline-flex items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38BFA1] transition-all duration-200"
                title="Refresh your data and club assignments"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </button>
              <button
                onClick={() => setShowDiscoverModal(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#38BFA1] hover:bg-[#2DA891] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38BFA1] transition-all duration-200"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Discover More Clubs
            </button>
          </div>
        </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search your clubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] bg-white shadow-sm"
              />
      </div>
      </div>

          {/* Clubs Grid */}
          {filteredClubs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                <UserGroupIcon className="h-16 w-16" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clubs found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchQuery.trim() 
                  ? 'Try adjusting your search terms'
                  : userRole === 'admin' 
                    ? 'You haven\'t been assigned to sponsor any clubs yet'
                    : 'You haven\'t sponsored any clubs yet. Discover clubs to get started!'
                }
              </p>
              <button
                onClick={() => setShowDiscoverModal(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-[#38BFA1] hover:bg-[#2DA891] transition-all duration-200"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Discover Your First Club
              </button>
          </div>
        ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {filteredClubs.map((club) => (
                <div key={club.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-[#38BFA1]/20 transition-all duration-300 overflow-hidden group transform hover:-translate-y-1">
                  {/* Club Header with Gradient Background */}
                  <div className="relative bg-gradient-to-br from-[#38BFA1] to-[#2DA891] p-6 text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-white/90 transition-colors">
                            {club.clubName}
                          </h3>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white backdrop-blur-sm">
                              {club.category || 'Uncategorized'}
                            </span>
                            <span className="text-white/80 text-sm">
                              Updated {club.updatedAt.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveSponsor(club.id)}
                          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
                          title="Remove as sponsor"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                      
                      {/* Status Indicators */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                          <span className="text-sm font-medium text-white">
                            {((club.sponsorEmails?.length || 0) + (club.sponsorEmail ? 1 : 0))}/4 Sponsors
                          </span>
                        </div>
                        <div className={`flex items-center gap-2 backdrop-blur-sm rounded-full px-3 py-1 ${
                          getCaptainCount(club) > 0 ? 'bg-green-500/30' : 'bg-yellow-500/30'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            getCaptainCount(club) > 0 ? 'bg-green-300' : 'bg-yellow-300'
                          }`}></div>
                          <span className="text-sm font-medium text-white">
                            {getCaptainCount(club) > 0 
                              ? `${getCaptainCount(club)}/4 Captains` 
                              : 'No Captains'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Club Content - Tabulated Layout */}
                  <div className="p-6">
                    {/* Information Table */}
                    <div className="mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Club Description */}
                        {club.description && (
                          <div className="md:col-span-2">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                            <p className="text-gray-700 leading-relaxed line-clamp-3">{club.description}</p>
                          </div>
                        )}

                        {/* Meeting Information */}
                        {club.meetingInfo && (
                          <div className="md:col-span-2">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Meeting Schedule</h4>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-6 h-6 bg-[#38BFA1]/10 rounded-md flex items-center justify-center">
                                  <CalendarIcon className="h-3 w-3 text-[#38BFA1]" />
                                </div>
                                <p className="text-gray-600 text-sm">{club.meetingInfo}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Activity Types */}
                        {club.activityTypes && club.activityTypes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Activity Types</h4>
                            <div className="flex flex-wrap gap-1">
                              {club.activityTypes.map((type, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Contact Information */}
                        {club.jamboreeMeetingInfo?.email && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Contact</h4>
                            <p className="text-gray-600 text-sm">{club.jamboreeMeetingInfo.email}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons - Tabulated Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => handleOpenClubInfo(club)}
                        className="flex flex-col items-center justify-center gap-2 px-3 py-4 text-xs font-medium rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:shadow-md"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span>Edit Info</span>
                      </button>
                      <button
                        onClick={() => handleOpenMembers(club)}
                        className="flex flex-col items-center justify-center gap-2 px-3 py-4 text-xs font-medium rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:shadow-md"
                      >
                        <UserGroupIcon className="h-4 w-4" />
                        <span>Members</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClub(club);
                          setSelectedCaptains(club.captainEmails || []);
                        }}
                        className="flex flex-col items-center justify-center gap-2 px-3 py-4 text-xs font-medium rounded-xl text-blue-700 bg-blue-100 hover:bg-blue-200 transition-all duration-200 hover:shadow-md"
                      >
                        <UserIcon className="h-4 w-4" />
                        <span>Captains</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClubForEvents(club);
                          setShowEventManager(true);
                        }}
                        className="flex flex-col items-center justify-center gap-2 px-3 py-4 text-xs font-medium rounded-xl text-purple-700 bg-purple-100 hover:bg-purple-200 transition-all duration-200 hover:shadow-md"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        <span>Events</span>
                      </button>
                      <button
                        onClick={() => {
                          console.log('Sponsor Dashboard: Opening post manager for club:', { id: club.id, name: club.clubName });
                          setSelectedClubForPosts(club);
                          setShowPostManager(true);
                        }}
                        className="flex flex-col items-center justify-center gap-2 px-3 py-4 text-xs font-medium rounded-xl text-green-700 bg-green-100 hover:bg-green-200 transition-all duration-200 hover:shadow-md"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        <span>Posts</span>
                      </button>
                      <a
                        href={`/${club.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-2 px-3 py-4 text-xs font-medium rounded-xl text-white bg-[#38BFA1] hover:bg-[#2DA891] transition-all duration-200 hover:shadow-md"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>View Site</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
                      )}
                    </div>
                  </div>
                  
      {/* Discover Clubs Modal */}
      {showDiscoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b border-gray-200">
              <div className="flex items-center justify-between">
                    <div>
                  <h2 className="text-2xl font-bold text-gray-900">Discover Clubs</h2>
                  <p className="text-gray-600 mt-1">
                    Find clubs that need sponsorship and guidance
                  </p>
                    </div>
                <button
                  onClick={() => setShowDiscoverModal(false)}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
                    </div>
                    </div>
            
            <div className="p-8">
              {availableClubs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                    <SparklesIcon className="h-16 w-16" />
                    </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No clubs available</h3>
                  <p className="text-gray-500">
                    All clubs are currently assigned to sponsors.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableClubs.map((club) => (
                    <div key={club.id} className="border border-gray-200 rounded-lg p-6 hover:border-[#38BFA1] transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{club.clubName}</h3>
                          <p className="text-sm text-gray-500">{club.category || 'Uncategorized'}</p>
                          {/* Show current sponsor count */}
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              {((club.sponsorEmails?.length || 0) + (club.sponsorEmail ? 1 : 0))}/4 Sponsors
                            </span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ((club.sponsorEmails?.length || 0) + (club.sponsorEmail ? 1 : 0)) >= 4
                            ? 'bg-red-100 text-red-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {((club.sponsorEmails?.length || 0) + (club.sponsorEmail ? 1 : 0)) >= 4 ? 'Full' : 'Needs Sponsor'}
                        </span>
                  </div>
                  
                      {club.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{club.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Captains: {getCaptainCount(club) > 0 
                            ? `${getCaptainCount(club)}/4` 
                            : 'Not assigned'}
                        </div>
                    <button
                          onClick={() => handleAssignSponsor(club.id)}
                          disabled={((club.sponsorEmails?.length || 0) + (club.sponsorEmail ? 1 : 0)) >= 4}
                          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            ((club.sponsorEmails?.length || 0) + (club.sponsorEmail ? 1 : 0)) >= 4
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'text-white bg-[#38BFA1] hover:bg-[#2DA891]'
                          }`}
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          {((club.sponsorEmails?.length || 0) + (club.sponsorEmail ? 1 : 0)) >= 4 ? 'Full' : 'Become Sponsor'}
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Captains Modal */}
      {selectedClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Assign Captains</h2>
              <p className="text-gray-600 mt-1 text-sm">
                Assign up to 4 captains to {selectedClub.clubName}
            </p>
          </div>
          
            <div className="p-6">
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search students by name or email..."
                    value={captainSearchQuery}
                    onChange={(e) => setCaptainSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Selected Captains */}
              {selectedCaptains.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Captains ({selectedCaptains.length}/4)</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCaptains.map((email) => {
                      const student = allStudents.find(s => s.email === email);
                      return (
                        <div key={email} className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                          <span>{student?.name || email}</span>
                          <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            student?.role === 'captain' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {student?.role || 'student'}
                          </span>
          <button
                            onClick={() => setSelectedCaptains(selectedCaptains.filter(e => e !== email))}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            <XCircleIcon className="h-4 w-4" />
          </button>
        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Students and Captains */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Available Students & Captains</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.uid}
                      onClick={() => {
                        if (!selectedCaptains.includes(student.email)) {
                          if (selectedCaptains.length < 4) {
                            setSelectedCaptains([...selectedCaptains, student.email]);
                          } else {
                            toast.error('Maximum 4 captains allowed');
                          }
                        }
                      }}
                      disabled={selectedCaptains.includes(student.email)}
                      className={`p-3 text-left rounded-lg border transition-all ${
                        selectedCaptains.includes(student.email)
                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-gray-200 hover:border-[#38BFA1] hover:bg-[#38BFA1]/5 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{student.name || 'No name'}</div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          student.role === 'captain' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.role || 'student'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                    </button>
                  ))}
                </div>
              </div>

              {filteredStudents.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No students or captains found matching your search.
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedClub(null);
                  setSelectedCaptains([]);
                  setCaptainSearchQuery('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignCaptains}
                disabled={selectedCaptains.length === 0}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCaptains.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#38BFA1] text-white hover:bg-[#2DA891]'
                }`}
              >
                Assign {selectedCaptains.length} Captain{selectedCaptains.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Club Info Modal */}
      {showClubInfoModal && selectedClubForInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Edit Club Information</h2>
              <p className="text-gray-600 mt-1 text-sm">
                Update information for {selectedClubForInfo.clubName}
              </p>
                </div>
            
            <div className="p-6 space-y-4">
                          <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Description
                </label>
                <textarea
                  value={clubInfoForm.description}
                  onChange={(e) => setClubInfoForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                  rows={4}
                  placeholder="Enter club description"
                />
                          </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Meeting Information
                </label>
                <textarea
                  value={clubInfoForm.meetingInfo}
                  onChange={(e) => setClubInfoForm(prev => ({ ...prev, meetingInfo: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                  rows={3}
                  placeholder="Enter meeting times and location"
                />
                        </div>
                        
                          <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Category
                </label>
                <select
                  value={clubInfoForm.category}
                  onChange={(e) => setClubInfoForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                >
                  <option value="">Select Category</option>
                  <option value="STEM">STEM</option>
                  <option value="Humanities">Humanities</option>
                  <option value="Business">Business</option>
                  <option value="Music, Arts, & Performing Arts">Music, Arts, & Performing Arts</option>
                  <option value="Academic">Academic</option>
                  <option value="Language & Culture">Language & Culture</option>
                  <option value="Medical">Medical</option>
                  <option value="Sports">Sports</option>
                  <option value="Community Service & Leadership">Community Service & Leadership</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
                          </div>

                          <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Activity Types
                </label>
                <div className="space-y-2">
                  {['Competitive', 'Leadership', 'Tryout', 'Public Speaking', 'Performance', 'Casual', 'Academic'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={clubInfoForm.activityTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setClubInfoForm(prev => ({ 
                              ...prev, 
                              activityTypes: [...prev.activityTypes, type] 
                            }));
                          } else {
                            setClubInfoForm(prev => ({ 
                              ...prev, 
                              activityTypes: prev.activityTypes.filter(t => t !== type) 
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-[#38BFA1] focus:ring-[#38BFA1]"
                      />
                      <span className="ml-2 text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                          </div>
              </div>

                          <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={clubInfoForm.contactEmail}
                  onChange={(e) => setClubInfoForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                  placeholder="Enter contact email"
                />
                          </div>

                          <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Captains (up to 4)
                </label>
                
                {/* Search for captains */}
                <div className="mb-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search students by name or email..."
                      value={clubCaptainSearchQuery}
                      onChange={(e) => setClubCaptainSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-sm"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        
                {/* Selected Captains */}
                {clubInfoForm.captains && clubInfoForm.captains.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {clubInfoForm.captains.map((email) => {
                        const student = allStudents.find(s => s.email === email);
                        return (
                          <div key={email} className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            <span>{student?.name || email}</span>
                            <span className={`ml-1 inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium ${
                              student?.role === 'captain' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {student?.role || 'student'}
                            </span>
                          <button
                              onClick={() => {
                                setClubInfoForm(prev => ({ 
                                  ...prev, 
                                  captains: prev.captains.filter(e => e !== email) 
                                }));
                              }}
                              className="ml-1 text-green-600 hover:text-green-800"
                            >
                              <XCircleIcon className="h-3 w-3" />
                          </button>
                        </div>
                        );
                      })}
                      </div>
                </div>
              )}

                {/* Available Students */}
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {filteredClubStudents.map((student) => (
                          <button
                      key={student.uid}
                      onClick={() => {
                        const currentCaptains = clubInfoForm.captains || [];
                        if (!currentCaptains.includes(student.email)) {
                          if (currentCaptains.length < 4) {
                            setClubInfoForm(prev => ({ 
                              ...prev, 
                              captains: [...currentCaptains, student.email] 
                            }));
                          } else {
                            toast.error('Maximum 4 captains allowed');
                          }
                        }
                      }}
                      disabled={clubInfoForm.captains?.includes(student.email)}
                      className={`w-full p-2 text-left rounded transition-all ${
                        clubInfoForm.captains?.includes(student.email)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white hover:bg-[#38BFA1]/5 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-xs">{student.name || 'No name'}</div>
                        <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium ${
                          student.role === 'captain' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.role || 'student'}
                        </span>
                </div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                          </button>
                  ))}
                        </div>
                
                <p className="text-xs text-gray-500 mt-1">
                  {(clubInfoForm.captains?.length || 0)}/4 captains selected
                            </p>
                      </div>
                    </div>
                        
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowClubInfoModal(false);
                  setSelectedClubForInfo(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveClubInfo}
                className="px-4 py-2 bg-[#38BFA1] text-white rounded-lg hover:bg-[#2DA891] transition-colors"
              >
                Save Changes
              </button>
                          </div>
                          </div>
                </div>
              )}

      {/* Members Modal */}
      {showMembersModal && selectedClubForMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Club Members</h2>
              <p className="text-gray-600 mt-1 text-sm">
                Manage members for {selectedClubForMembers.clubName}
              </p>
                          </div>
            
            <div className="p-6">
              {clubMembers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No members have joined this club yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 px-4 py-2 bg-gray-50 rounded-lg font-medium text-sm">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Actions</div>
                        </div>
                        
                  {clubMembers.map((member, index) => (
                    <div key={index} className="grid grid-cols-3 gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
                      <div className="text-sm">{member.name}</div>
                      <div className="text-sm">{member.email}</div>
                          <div>
                          <button
                          onClick={() => handleRemoveMember(member.email)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                          Remove
                          </button>
                          </div>
                          </div>
                  ))}
                          </div>
              )}
                        </div>
                        
            <div className="p-6 border-t border-gray-200 flex justify-end">
                          <button
                onClick={() => {
                  setShowMembersModal(false);
                  setSelectedClubForMembers(null);
                  setClubMembers([]);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Close
                          </button>
                        </div>
                      </div>
                </div>
              )}

      {/* Club Event Manager */}
      {showEventManager && selectedClubForEvents && (
        <ClubEventManager
          clubId={selectedClubForEvents.id}
          clubName={selectedClubForEvents.clubName}
          userEmail={user?.email || ''}
          isOpen={showEventManager}
          onClose={() => {
            setShowEventManager(false);
            setSelectedClubForEvents(null);
          }}
        />
      )}

      {/* Club Post Manager */}
      {showPostManager && selectedClubForPosts && (
        <ClubPostManager
          clubId={selectedClubForPosts.id}
          clubName={selectedClubForPosts.clubName}
          userEmail={user?.email || ''}
          isOpen={showPostManager}
          onClose={() => {
            setShowPostManager(false);
            setSelectedClubForPosts(null);
          }}
        />
      )}
    </div>
  );
} 