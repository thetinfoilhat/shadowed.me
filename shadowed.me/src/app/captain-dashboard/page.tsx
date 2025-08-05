'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, arrayUnion, query, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
// import { format } from 'date-fns';
import VisitModal from '@/components/VisitModal';
import ApplicantsDialog from '@/components/ApplicantsDialog';
import { Club, CompletedVisit, ClubSite, MeetingOpportunity /* , ClubListing */ } from '@/types/club';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { getColorById } from '@/utils/colors';
import MeetingOpportunityModal from '@/components/MeetingOpportunityModal';
import MeetingCalendar from '@/components/MeetingCalendar';

interface Applicant {
  name: string;
  email: string;
  grade: string;
  school: string;
}

interface FirestoreData {
  applicants?: {
    name?: string;
    email?: string;
    grade?: string;
    school?: string;
  }[];
  createdAt?: { toDate(): Date };
}

interface VisitData {
  id?: string;
  name: string;
  school?: string;
  sponsorEmail?: string;
  category: string;
  contactEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  slots: number;
  description: string;
  status?: 'pending' | 'approved' | 'rejected';
  captain?: string;
  applicants?: Applicant[];
  createdAt?: Date;
}

export default function CaptainDashboard() {
  const { user, userRole, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Club | null>(null);
  const [viewingApplicants, setViewingApplicants] = useState<Club | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    visitId: string;
  }>({ isOpen: false, visitId: '' });
  const [confirmCompletion, setConfirmCompletion] = useState<{
    isOpen: boolean;
    visit: Club | null;
    completing: boolean;
  }>({ isOpen: false, visit: null, completing: false });
  const [isAdmin, setIsAdmin] = useState(false);
  const [websites, setWebsites] = useState<ClubSite[]>([]);
  const [websitesExpanded, setWebsitesExpanded] = useState(true);
  const [assignedClubs, setAssignedClubs] = useState<ClubSite[]>([]);
  const [assignedClubsExpanded, setAssignedClubsExpanded] = useState(true);
  const [confirmRemoveCaptain, setConfirmRemoveCaptain] = useState<{
    isOpen: boolean;
    club: ClubSite | null;
  }>({ isOpen: false, club: null });
  
  // Meeting management state
  const [meetings, setMeetings] = useState<MeetingOpportunity[]>([]);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingOpportunity | null>(null);
  const [selectedClubForMeeting, setSelectedClubForMeeting] = useState<ClubSite | null>(null);
  const [meetingsExpanded, setMeetingsExpanded] = useState(true);
  
  // Ref to track assigned clubs to prevent infinite loops
  const assignedClubsRef = useRef<string[]>([]);
  
  const router = useRouter();

  // Fetch user role and refresh user data
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().role === 'admin');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    
    fetchUserRole();
    
    // Refresh user data to ensure captainClubs is up to date
    if (user) {
      refreshUserData();
    }
  }, [user, refreshUserData]);

  // Fetch meetings for all assigned clubs
  const fetchMeetings = useCallback(async () => {
    const currentAssignedClubs = assignedClubs;
    if (!currentAssignedClubs.length) return;
    
    // Check if we've already fetched meetings for these clubs
    const currentClubIds = currentAssignedClubs.map(club => club.id).sort();
    const previousClubIds = assignedClubsRef.current.sort();
    
    if (JSON.stringify(currentClubIds) === JSON.stringify(previousClubIds)) {
      return; // Already fetched for these clubs
    }
    
    try {
      const allMeetings: MeetingOpportunity[] = [];
      
      for (const club of currentAssignedClubs) {
        const response = await fetch(`/api/meetings?clubId=${club.id}&status=active`);
        if (response.ok) {
          const data = await response.json();
          allMeetings.push(...data.meetings);
        }
      }
      
      setMeetings(allMeetings);
      assignedClubsRef.current = currentClubIds;
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to fetch meetings');
    }
  }, [assignedClubs]);

  // Store fetchMeetings in a ref to avoid dependency issues
  const fetchMeetingsRef = useRef(fetchMeetings);
  fetchMeetingsRef.current = fetchMeetings;

  // Meeting management functions
  const handleCreateMeeting = async (meetingData: Partial<MeetingOpportunity>) => {
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      if (response.ok) {
        toast.success('Meeting created successfully');
        fetchMeetings();
        setIsMeetingModalOpen(false);
        setEditingMeeting(null);
        setSelectedClubForMeeting(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create meeting');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error('Failed to create meeting');
    }
  };

  const handleUpdateMeeting = async (meetingData: Partial<MeetingOpportunity>) => {
    if (!editingMeeting) return;
    
    try {
      const response = await fetch('/api/meetings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: editingMeeting.id,
          ...meetingData,
        }),
      });

      if (response.ok) {
        toast.success('Meeting updated successfully');
        fetchMeetings();
        setIsMeetingModalOpen(false);
        setEditingMeeting(null);
        setSelectedClubForMeeting(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update meeting');
      }
    } catch (error) {
      console.error('Error updating meeting:', error);
      toast.error('Failed to update meeting');
    }
  };



  const openMeetingModal = (club: ClubSite, meeting?: MeetingOpportunity) => {
    setSelectedClubForMeeting(club);
    setEditingMeeting(meeting || null);
    setIsMeetingModalOpen(true);
  };

  // Fetch meetings when assigned clubs change
  useEffect(() => {
    if (assignedClubs.length > 0) {
      fetchMeetingsRef.current();
    }
  }, [assignedClubs]);

  // Add function to fetch sponsor names
  const fetchSponsorNames = useCallback(async (visits: Club[]) => {
    const emails = visits
      .map(visit => visit.sponsorEmail)
      .filter((email): email is string => !!email);
    
    const uniqueEmails = [...new Set(emails)];
    const namesMap: Record<string, string> = {};
    
    try {
      for (const email of uniqueEmails) {
        const usersQuery = await getDocs(collection(db, 'users'));
        const userDoc = usersQuery.docs.find(doc => doc.data().email === email);
        
        if (userDoc) {
          const userData = userDoc.data();
          namesMap[email] = userData.displayName || '';
        }
      }
      
      // setSponsorNames(namesMap);
    } catch (err) {
      console.error('Error fetching sponsor names:', err);
    }
  }, []);

  const fetchCaptainVisits = useCallback(async () => {
    try {
      const clubsRef = collection(db, 'opportunities');
      const querySnapshot = await getDocs(clubsRef);
      
      const visits = querySnapshot.docs
        .map(doc => {
          const data = doc.data() as FirestoreData;
          return {
            id: doc.id,
            ...data,
            applicants: (data.applicants || []).map((applicant): Applicant => ({
              name: applicant.name || '',
              email: applicant.email || '',
              grade: applicant.grade || '',
              school: applicant.school || ''
            })),
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Club;
        })
        // If user is admin, show all visits, otherwise only show visits where user is captain
        .filter(visit => isAdmin || visit.captain === user?.email)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // setCaptainVisits(visits);
      
      // Fetch sponsor names after getting visits
      fetchSponsorNames(visits);
    } catch (err) {
      console.error('Error fetching visits:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, fetchSponsorNames]);

  // Fetch captain websites
  const fetchCaptainWebsites = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      
      // Get all club websites from the collection
      const allWebsitesSnapshot = await getDocs(collection(db, 'clubSites'));
      const websitesData: ClubSite[] = [];
      const userEmail = user.email; // Cache the user email
      
      // Filter websites where the user is a captain
      allWebsitesSnapshot.forEach(doc => {
        const data = doc.data() as Partial<ClubSite>;
        const siteData = {
          ...data,
          id: doc.id
        } as ClubSite;
        
        const isCreator = siteData.createdBy === userEmail;
        const isCaptain = 
          // Check various captain fields, handle null/undefined values
          (typeof siteData.captain === 'string' && siteData.captain === userEmail) || 
          (Array.isArray(siteData.captains) && siteData.captains.includes(userEmail)) ||
          (Array.isArray(siteData.captainEmails) && siteData.captainEmails.includes(userEmail)) ||
          (siteData.jamboreeMeetingInfo?.captains && 
           typeof siteData.jamboreeMeetingInfo.captains === 'string' && 
           siteData.jamboreeMeetingInfo.captains.includes(userEmail));
        
        // Add website if user is creator or captain
        if (isCreator || isCaptain) {
          websitesData.push(siteData);
        }
      });
      
      setWebsites(websitesData);
    } catch (error) {
      console.error('Error fetching captain websites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch captain clubs
  const fetchCaptainClubs = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      const clubsData: ClubSite[] = [];
      
      // Get all club sites and filter by captain assignment
      const clubSitesRef = collection(db, 'clubSites');
      const querySnapshot = await getDocs(clubSitesRef);
      
      querySnapshot.forEach(doc => {
        const data = doc.data() as Partial<ClubSite>;
        const siteData = {
          ...data,
          id: doc.id
        } as ClubSite;
        
        // Check if user is a captain of this club
        const isCaptain = 
          (typeof siteData.captain === 'string' && siteData.captain === user.email) || 
          (Array.isArray(siteData.captains) && siteData.captains.includes(user.email!)) ||
          (Array.isArray(siteData.captainEmails) && siteData.captainEmails.includes(user.email!)) ||
          (siteData.jamboreeMeetingInfo?.captains && 
           typeof siteData.jamboreeMeetingInfo.captains === 'string' && 
           siteData.jamboreeMeetingInfo.captains.includes(user.email!));
        
        if (isCaptain) {
          clubsData.push(siteData);
        }
      });
      
      setAssignedClubs(clubsData);
    } catch (error) {
      console.error('Error fetching captain clubs:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCaptainVisits();
      fetchCaptainWebsites();
      fetchCaptainClubs();
    } else {
      setLoading(false);
    }
  }, [user, fetchCaptainVisits, fetchCaptainWebsites, fetchCaptainClubs]);
  
  // Refresh data when user role changes (e.g., when promoted to captain)
  useEffect(() => {
    if (user && userRole === 'captain') {
      refreshUserData();
    }
  }, [user, userRole, refreshUserData]);
  
  // Function to remove captain from a club
  const handleRemoveCaptain = async (club: ClubSite) => {
    if (!user?.email) return;
    
    try {
      const clubRef = doc(db, 'clubSites', club.id);
      
      // Remove from captainEmails array
      const updatedCaptainEmails = (club.captainEmails || []).filter(email => email !== user.email);
      
      // Remove from legacy captain fields
      const updatedCaptains = (club.captains || []).filter(email => email !== user.email);
      const updatedCaptain = club.captain === user.email ? null : club.captain;
      
      // Update captain display names in jamboreeMeetingInfo
      const currentCaptains = club.jamboreeMeetingInfo?.captains || '';
      
      // Get user's display name
      const userDocForDisplay = await getDoc(doc(db, 'users', user.uid));
      let userDisplayName = user.email;
      if (userDocForDisplay.exists()) {
        const userData = userDocForDisplay.data();
        userDisplayName = userData.displayName || userData.name || user.email;
      }
      
      const captainNames = currentCaptains.split(/,\s*/).filter(name => name !== userDisplayName);
      
      // Update the club document
      await updateDoc(clubRef, {
        captainEmails: updatedCaptainEmails,
        captains: updatedCaptains,
        captain: updatedCaptain,
        'jamboreeMeetingInfo.captains': captainNames.join(', '),
        updatedAt: new Date()
      });
      
      // Remove club from user's captainClubs array
      const userRef = doc(db, 'users', user.uid);
      const userDocForClubs = await getDoc(userRef);
      if (userDocForClubs.exists()) {
        const userData = userDocForClubs.data();
        const updatedCaptainClubs = (userData.captainClubs || []).filter((clubId: string) => clubId !== club.id);
        
        await updateDoc(userRef, {
          captainClubs: updatedCaptainClubs
        });
      }
      
      // Refresh user data and club lists
      await refreshUserData();
      fetchCaptainClubs();
      fetchCaptainWebsites();
      
      toast.success(`Successfully removed yourself as captain of ${club.clubName}`);
      setConfirmRemoveCaptain({ isOpen: false, club: null });
      
    } catch (error) {
      console.error('Error removing captain:', error);
      toast.error('Failed to remove captain assignment');
    }
  };

  const saveVisit = async (data: VisitData) => {
    try {
      const visitData = {
        name: data.name,
        school: data.school || '',
        sponsorEmail: data.sponsorEmail,
        category: data.category,
        contactEmail: data.contactEmail,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description,
        time: `${data.startTime} - ${data.endTime}`,
        captain: user?.email,
        applicants: [],
        status: 'pending',
        slots: data.slots || 0,
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
      
      await fetchCaptainVisits();
    } catch (error) {
      console.error('Error saving visit:', error);
      throw error;
    }
  };

  const handleDelete = async (visitId: string) => {
    try {
      await deleteDoc(doc(db, 'opportunities', visitId));
      await fetchCaptainVisits();
    } catch (error) {
      console.error('Error deleting visit:', error);
    }
  };

  /* 
  const handleCompletionClick = (visit: Club, completing: boolean) => {
    setConfirmCompletion({ 
      isOpen: true, 
      visit, 
      completing 
    });
  };
  */

  const handleMarkCompleted = async (visit: Club, completed: boolean) => {
    try {
      const visitRef = doc(db, 'opportunities', visit.id);
      await updateDoc(visitRef, {
        completed: completed
      });

      const completedVisitData = {
        id: visit.id,
        name: visit.name,
        school: visit.school,
        category: visit.category,
        date: visit.date,
        time: visit.time,
        description: visit.description,
        completedAt: new Date().toISOString()
      };

      // Process each applicant
      for (const applicant of visit.applicants || []) {
        const userQuery = query(
          collection(db, 'users'), 
          where('email', '==', applicant.email)
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const userData = userDoc.data();
          
          if (completed) {
            // Add to completedVisits if not already present
            const existingVisit = (userData.completedVisits || [])
              .find((v: CompletedVisit) => v.id === visit.id);
            
            if (!existingVisit) {
              await updateDoc(doc(db, 'users', userDoc.id), {
                completedVisits: arrayUnion(completedVisitData)
              });
            }
          } else {
            // Remove from completedVisits
            const updatedCompletedVisits = (userData.completedVisits || [])
              .filter((v: CompletedVisit) => v.id !== visit.id);
            
            await updateDoc(doc(db, 'users', userDoc.id), {
              completedVisits: updatedCompletedVisits
            });
          }
        }
      }

      toast.success(completed ? 'Visit marked as completed' : 'Visit unmarked as completed');
      await fetchCaptainVisits();
    } catch (error) {
      console.error('Error updating visit completion status:', error);
      toast.error('Failed to update visit status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full px-6 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-[#38BFA1]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-3xl font-semibold text-[#0A2540] mb-4">
              Please Sign In
            </h1>
            <p className="text-black mb-8">
              Sign in to manage your club websites
            </p>
            <button
              onClick={() => document.querySelector<HTMLButtonElement>('[data-login-button]')?.click()}
              className="bg-[#38BFA1] text-white px-8 py-3 rounded-lg hover:bg-[#2DA891] transition-colors inline-flex items-center gap-2"
            >
              <span>Sign In</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Captain Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your club websites and captain assignments</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-gray-500">Welcome back</div>
                <div className="font-medium text-gray-900">{user?.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Club Websites</div>
                <div className="text-2xl font-bold text-gray-900">{websites.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Captain Assignments</div>
                <div className="text-2xl font-bold text-gray-900">{assignedClubs.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Last Updated</div>
                <div className="text-2xl font-bold text-gray-900">Today</div>
              </div>
            </div>
          </div>
        </div>

        {/* Club Websites Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Your Club Websites</h2>
                  <p className="text-sm text-gray-500">Manage and edit your club websites</p>
                </div>
              </div>
              <button 
                onClick={() => setWebsitesExpanded(!websitesExpanded)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {websitesExpanded ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {websitesExpanded && (
            <div className="p-6">
              {websites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {websites.map((website) => (
                    <div
                      key={website.id}
                      className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors group"
                    >
                      <div 
                        className="h-32 bg-cover bg-center relative" 
                        style={{ 
                          backgroundColor: getColorById(website.theme?.primaryColor || 'blue').value,
                          backgroundImage: website.bannerImage ? `url(${website.bannerImage})` : undefined
                        }}
                      >
                        {!website.bannerImage && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <h3 className="text-xl font-bold text-white px-4 text-center">
                              {website.clubName}
                            </h3>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700">
                            Website
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                          {website.clubName}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {website.slogan || website.description?.substring(0, 80) || 'No description available.'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Updated {new Date(website.updatedAt).toLocaleDateString()}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/${website.slug}?edit=true`)}
                              className="px-3 py-1.5 text-xs font-medium text-white rounded-md hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: getColorById(website.theme?.primaryColor || 'blue').value }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => router.push(`/${website.slug}`)}
                              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                                     <h3 className="text-lg font-medium text-gray-900 mb-2">No websites yet</h3>
                   <p className="text-gray-500 mb-6">You haven&apos;t created any club websites yet.</p>
                  <button
                    onClick={() => router.push('/clubs')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Create Website
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Captain Assignments Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Captain Assignments</h2>
                  <p className="text-sm text-gray-500">Clubs where you are assigned as captain</p>
                </div>
              </div>
              <button 
                onClick={() => setAssignedClubsExpanded(!assignedClubsExpanded)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {assignedClubsExpanded ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {assignedClubsExpanded && (
            <div className="p-6">
              {assignedClubs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assignedClubs.map((club) => (
                    <div
                      key={club.id}
                      className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors group"
                    >
                      <div 
                        className="h-32 bg-cover bg-center relative" 
                        style={{ 
                          backgroundColor: getColorById(club.theme?.primaryColor || 'blue').value,
                          backgroundImage: club.bannerImage ? `url(${club.bannerImage})` : undefined
                        }}
                      >
                        {!club.bannerImage && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <h3 className="text-xl font-bold text-white px-4 text-center">
                              {club.clubName}
                            </h3>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Captain
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                          {club.clubName}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {club.slogan || club.description?.substring(0, 80) || 'No description available.'}
                        </p>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {club.category || 'Club'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Updated {new Date(club.updatedAt).toLocaleDateString()}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/${club.slug}?edit=true`)}
                              className="px-3 py-1.5 text-xs font-medium text-white rounded-md hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: getColorById(club.theme?.primaryColor || 'blue').value }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmRemoveCaptain({ isOpen: true, club })}
                              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                                     <h3 className="text-lg font-medium text-gray-900 mb-2">No captain assignments</h3>
                   <p className="text-gray-500 mb-6">You&apos;re not assigned as captain to any clubs yet.</p>
                  <p className="text-sm text-gray-400">Admins or sponsors can assign you as captain to clubs.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Meetings Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Club Meetings</h2>
                  <p className="text-sm text-gray-500">Manage meetings and opportunities for your clubs</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMeetingsExpanded(!meetingsExpanded)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {meetingsExpanded ? (
                    <ChevronUpIcon className="h-5 w-5" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5" />
                  )}
                </button>
                {assignedClubs.length > 0 && (
                  <button
                    onClick={() => openMeetingModal(assignedClubs[0])}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Create Meeting
                  </button>
                )}
              </div>
            </div>
          </div>

          {meetingsExpanded && (
            <div className="p-6">
              {meetings.length > 0 ? (
                <MeetingCalendar
                  meetings={meetings}
                  onMeetingClick={(meeting) => {
                    const club = assignedClubs.find(c => c.id === meeting.clubId);
                    if (club) {
                      openMeetingModal(club, meeting);
                    }
                  }}
                  userRole="captain"
                  showSignUpButton={false}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="h-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings scheduled</h3>
                  <p className="text-gray-500 mb-6">You haven&apos;t created any meetings for your clubs yet.</p>
                  {assignedClubs.length > 0 && (
                    <button
                      onClick={() => openMeetingModal(assignedClubs[0])}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Your First Meeting
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Club Assignments Section - commented out
        <div>
          <button 
            onClick={() => setClubsExpanded(!clubsExpanded)}
            className="w-full flex justify-between items-center bg-gray-100 p-4 rounded-lg mb-4 hover:bg-gray-200 transition-colors"
          >
            <h2 className="text-xl font-semibold text-[#0A2540] flex items-center">
              Your Club Assignments
              <span className="ml-2 bg-[#38BFA1] text-white text-sm px-2 py-0.5 rounded-full">
                {clubs.length}
              </span>
            </h2>
            {clubsExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {clubsExpanded && (
            <div className="space-y-4 animate-fadeIn">
              {clubs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clubs.map((club) => (
                    <div
                      key={club.id}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
                    >
                      <div className="h-2" style={{ backgroundColor: club.bgColor || '#38BFA1' }} />
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-black mb-2">
                          {club.name}
                        </h3>
                        
                        <div className="mb-4 flex flex-wrap gap-2">
                          <span 
                            className="text-xs font-medium px-2.5 py-1 rounded-full text-white"
                            style={{ 
                              background: club.bgGradient || `linear-gradient(135deg, ${club.bgColor || '#38BFA1'}, ${club.bgColor || '#38BFA1'}dd)`,
                            }}
                          >
                            {club.category || 'Club'}
                          </span>
                          
                          {club.attributes && club.attributes.length > 0 && (
                            <span className="text-xs bg-gray-100 text-black px-2.5 py-1 rounded-full font-medium">
                              {club.attributes[0]}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-black border-t pt-3 space-y-2">
                          {club.meetingTimes && (
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{club.meetingTimes}</span>
                            </div>
                          )}
                          
                          {club.roomNumber && (
                            <div className="flex items-center">
                              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span>Room: {club.roomNumber}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4">
                          <button
                            onClick={() => router.push('/clubs')}
                            className="w-full px-3 py-2 text-white rounded-md hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: club.bgColor || '#38BFA1' }}
                          >
                            Create Website
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-black">You&apos;re not assigned to any clubs yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
        */}

        {/* Upcoming Visits Section - commented out
        <div>
          <button 
            onClick={() => setUpcomingExpanded(!upcomingExpanded)}
            className="w-full flex justify-between items-center bg-gray-100 p-4 rounded-lg mb-4 hover:bg-gray-200 transition-colors"
          >
            <h2 className="text-xl font-semibold text-[#0A2540] flex items-center">
              Upcoming Club Visits
              <span className="ml-2 bg-[#38BFA1] text-white text-sm px-2 py-0.5 rounded-full">
                {captainVisits.filter(visit => !visit.completed).length}
              </span>
            </h2>
            {upcomingExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {upcomingExpanded && (
            <div className="space-y-4 animate-fadeIn">
              {captainVisits
                .filter(visit => !visit.completed)
                .map((visit) => (
                  <div 
                    key={visit.id} 
                    className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all group relative"
                    onClick={() => setViewingApplicants(visit)}
                  >
                    <div className="flex items-start gap-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[#0A2540] mb-2">{visit.name}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">{visit.description}</p>
                        
                        {/* Approval Status Bar */}{/*
                        {visit.status && (
                          <div className={`mb-3 px-3 py-1.5 rounded-md text-sm font-medium ${
                            visit.status === 'pending' 
                              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                              : visit.status === 'approved' 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {visit.status === 'pending' && (
                              <span>Waiting for approval from <span className="font-semibold">
                                {visit.sponsorEmail} {visit.sponsorEmail && sponsorNames[visit.sponsorEmail] ? `(${sponsorNames[visit.sponsorEmail]})` : ''}
                              </span></span>
                            )}
                            {visit.status === 'approved' && (
                              <span>Approved by <span className="font-semibold">
                                {visit.sponsorEmail} {visit.sponsorEmail && sponsorNames[visit.sponsorEmail] ? `(${sponsorNames[visit.sponsorEmail]})` : ''}
                              </span></span>
                            )}
                            {visit.status === 'rejected' && (
                              <span>Rejected by <span className="font-semibold">
                                {visit.sponsorEmail} {visit.sponsorEmail && sponsorNames[visit.sponsorEmail] ? `(${sponsorNames[visit.sponsorEmail]})` : ''}
                              </span></span>
                            )}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">School</p>
                            <p className="font-medium">{visit.school}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Date</p>
                            <p className="font-medium">{formatDate(visit.date)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Time</p>
                            <p className="font-medium">{formatTime(visit.time)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Available Slots</p>
                            <p className="font-medium">{visit.slots}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Applicants</p>
                            <p className="font-medium">{visit.applicants?.length || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Category</p>
                            <p className="font-medium text-[#38BFA1]">{visit.category}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}{/*
                    <div className="absolute right-6 top-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <button 
                        className="bg-[#38BFA1]/10 text-[#38BFA1] p-2 rounded-md hover:bg-[#38BFA1]/20 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompletionClick(visit, !visit.completed);
                        }}
                      >
                        <span className="text-sm">Mark as Completed</span>
                      </button>
                      <button 
                        className="bg-[#38BFA1]/10 text-[#38BFA1] p-2 rounded-md hover:bg-[#38BFA1]/20 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingVisit(visit);
                          setIsCreateModalOpen(true);
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete({ isOpen: true, visitId: visit.id });
                        }}
                        className="bg-red-100 text-red-600 p-2 rounded-md hover:bg-red-200 transition-colors"
                      >
                        <span className="text-sm">Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {upcomingExpanded && captainVisits.filter(visit => !visit.completed).length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No upcoming club visits</p>
            </div>
          )}
        </div>
        */}

        {/* Completed Visits Section - commented out
        <div>
          <button 
            onClick={() => setCompletedExpanded(!completedExpanded)}
            className="w-full flex justify-between items-center bg-gray-100 p-4 rounded-lg mb-4 hover:bg-gray-200 transition-colors"
          >
            <h2 className="text-xl font-semibold text-[#0A2540] flex items-center">
              Completed Club Visits
              <span className="ml-2 bg-gray-500 text-white text-sm px-2 py-0.5 rounded-full">
                {captainVisits.filter(visit => visit.completed).length}
              </span>
            </h2>
            {completedExpanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            )}
          </button>

          {completedExpanded && (
            <div className="space-y-4 animate-fadeIn">
              {captainVisits
                .filter(visit => visit.completed)
                .map((visit) => (
                  <div 
                    key={visit.id} 
                    className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all group relative"
                    onClick={() => setViewingApplicants(visit)}
                  >
                    <div className="flex items-start gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-[#0A2540]">{visit.name}</h3>
                          <span className="px-2 py-1 bg-[#38BFA1]/10 text-[#38BFA1] text-sm rounded-full">
                            Completed
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-2">{visit.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">School</p>
                            <p className="font-medium">{visit.school}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Date</p>
                            <p className="font-medium">{formatDate(visit.date)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Time</p>
                            <p className="font-medium">{formatTime(visit.time)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total Slots</p>
                            <p className="font-medium">{visit.slots}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Participants</p>
                            <p className="font-medium">{visit.applicants?.length || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Category</p>
                            <p className="font-medium text-[#38BFA1]">{visit.category}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}{/*
                    <div className="absolute right-6 top-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <button 
                        className="bg-[#38BFA1]/10 text-[#38BFA1] p-2 rounded-md hover:bg-[#38BFA1]/20 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompletionClick(visit, !visit.completed);
                        }}
                      >
                        <span className="text-sm">Unmark as Completed</span>
                      </button>
                      <button 
                        className="bg-[#38BFA1]/10 text-[#38BFA1] p-2 rounded-md hover:bg-[#38BFA1]/20 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingApplicants(visit);
                        }}
                      >
                        <span className="text-sm">View Participants</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete({ isOpen: true, visitId: visit.id });
                        }}
                        className="bg-red-100 text-red-600 p-2 rounded-md hover:bg-red-200 transition-colors"
                      >
                        <span className="text-sm">Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {completedExpanded && captainVisits.filter(visit => visit.completed).length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No completed club visits</p>
            </div>
          )}
        </div>
        */}

        {/* Create/Edit Visit Modal */}
        <VisitModal
          isOpen={isCreateModalOpen}
          onCloseAction={() => {
            setIsCreateModalOpen(false);
            setEditingVisit(null);
          }}
          onSubmitAction={saveVisit}
          initialData={editingVisit ? {
            id: editingVisit.id,
            name: editingVisit.name,
            school: editingVisit.school,
            sponsorEmail: editingVisit.sponsorEmail || '',
            category: editingVisit.category,
            contactEmail: editingVisit.contactEmail || '',
            date: editingVisit.date,
            startTime: editingVisit.startTime || '',
            endTime: editingVisit.endTime || '',
            slots: editingVisit.slots,
            description: editingVisit.description,
            status: editingVisit.status,
            captain: editingVisit.captain,
            applicants: editingVisit.applicants,
            createdAt: editingVisit.createdAt
          } : null}
        />

        {/* Applicants Dialog */}
        <ApplicantsDialog
          isOpen={!!viewingApplicants}
          onCloseAction={() => setViewingApplicants(null)}
          applicants={viewingApplicants?.applicants || []}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete({ isOpen: false, visitId: '' })}
          onConfirm={() => handleDelete(confirmDelete.visitId)}
          title="Delete Visit"
          message="Are you sure you want to delete this visit? This action cannot be undone."
          confirmText="Delete"
        />

        {/* Completion Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmCompletion.isOpen}
          onClose={() => setConfirmCompletion({ isOpen: false, visit: null, completing: false })}
          onConfirm={async () => {
            if (confirmCompletion.visit) {
              await handleMarkCompleted(confirmCompletion.visit, confirmCompletion.completing);
              setConfirmCompletion({ isOpen: false, visit: null, completing: false });
            }
          }}
          title={confirmCompletion.completing ? "Mark Visit as Completed" : "Unmark Visit as Completed"}
          message={confirmCompletion.completing 
            ? "Are you sure you want to mark this visit as completed? This will move it to students' completed visits."
            : "Are you sure you want to unmark this visit as completed? This will remove it from students' completed visits."
          }
          confirmText={confirmCompletion.completing ? "Mark as Completed" : "Unmark as Completed"}
        />

        {/* Remove Captain Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmRemoveCaptain.isOpen}
          onClose={() => setConfirmRemoveCaptain({ isOpen: false, club: null })}
          onConfirm={async () => {
            if (confirmRemoveCaptain.club) {
              await handleRemoveCaptain(confirmRemoveCaptain.club);
            }
          }}
          title="Remove Captain Assignment"
          message={`Are you sure you want to remove yourself as captain of "${confirmRemoveCaptain.club?.clubName}"? This action cannot be undone and you will lose access to edit this club's website.`}
          confirmText="Remove Self"
        />

        {/* Meeting Opportunity Modal */}
        {selectedClubForMeeting && (
          <MeetingOpportunityModal
            isOpen={isMeetingModalOpen}
            onClose={() => {
              setIsMeetingModalOpen(false);
              setEditingMeeting(null);
              setSelectedClubForMeeting(null);
            }}
            onSubmit={editingMeeting ? handleUpdateMeeting : handleCreateMeeting}
            initialData={editingMeeting}
            clubId={selectedClubForMeeting.id}
            clubName={selectedClubForMeeting.clubName}
            userEmail={user?.email || ''}
          />
        )}
      </div>
    </div>
  );
} 