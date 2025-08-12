'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, updateDoc, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClubSite, MeetingOpportunity } from '@/types/club';

// Personal Event Interface
interface PersonalEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';
import { getColorById } from '@/utils/colors';
import { toast } from 'react-hot-toast';
import { CalendarIcon, ClockIcon, MapPinIcon, UserGroupIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ClubEvents from '@/components/ClubEvents';
import ClubPosts from '@/components/ClubPosts';

// Category color mapping from clubs page
const CATEGORY_COLORS: Record<string, { bg: string, text: string, lighter: string }> = {
  'STEM': { bg: '#4285F4', text: '#ffffff', lighter: '#d0e0ff' },
  'Humanities': { bg: '#E67E22', text: '#ffffff', lighter: '#fae0cc' },
  'Business': { bg: '#34A853', text: '#ffffff', lighter: '#d0f0d9' },
  'Music, Arts, & Performing Arts': { bg: '#FBBC05', text: '#000000', lighter: '#fff2d0' },
  'Academic': { bg: '#F1C40F', text: '#000000', lighter: '#fef7d0' },
  'Language & Culture': { bg: '#8E44AD', text: '#ffffff', lighter: '#e9d0f0' },
  'Medical': { bg: '#1ABC9C', text: '#ffffff', lighter: '#d0f5ef' },
  'Community Service & Leadership': { bg: '#3498DB', text: '#ffffff', lighter: '#d0e8f7' },
  'Miscellaneous': { bg: '#95A5A6', text: '#ffffff', lighter: '#ebeeee' },
  // Keeping these for backward compatibility
  'Arts': { bg: '#FBBC05', text: '#000000', lighter: '#fff2d0' },
  'Community Service': { bg: '#3498DB', text: '#ffffff', lighter: '#d0e8f7' },
  'Sports': { bg: '#2ECC71', text: '#ffffff', lighter: '#d5f9e0' },
  'Technology': { bg: '#9B59B6', text: '#ffffff', lighter: '#ebdaf2' },
  'Performing Arts': { bg: '#E74C3C', text: '#ffffff', lighter: '#fad6d1' }
};

// Function to get color for category
const getCategoryColor = (category: string | undefined): { bg: string, text: string, lighter: string } => {
  if (!category || !(category in CATEGORY_COLORS)) {
    return { bg: '#38BFA1', text: '#ffffff', lighter: '#d9f5f0' }; // Default
  }
  return CATEGORY_COLORS[category];
};

// Activity Type color mapping
const ACTIVITY_COLORS: Record<string, { bg: string, text: string, lighter: string }> = {
  'Competitive': { bg: '#FF5722', text: '#ffffff', lighter: '#ffdfd5' },
  'Leaders': { bg: '#795548', text: '#ffffff', lighter: '#e4d5d0' },
  'Tryout': { bg: '#607D8B', text: '#ffffff', lighter: '#dfe5e8' },
  'Public Speaking': { bg: '#009688', text: '#ffffff', lighter: '#ccece8' },
  'Performance': { bg: '#673AB7', text: '#ffffff', lighter: '#e1d8f2' },
  'Casual': { bg: '#00BCD4', text: '#000000', lighter: '#ccf2f6' },
  'Academic': { bg: '#FFC107', text: '#000000', lighter: '#fff2cc' }
};

// Function to get color for activity type
const getActivityColor = (activityType: string | undefined): { bg: string, text: string, lighter: string } => {
  if (!activityType || !(activityType in ACTIVITY_COLORS)) {
    return { bg: '#4361EE', text: '#ffffff', lighter: '#d7ddfb' }; // Default
  }
  return ACTIVITY_COLORS[activityType];
};

// Club Card Component - Similar to the one in clubs page
const ClubCard = ({ club, onRemove }: { club: ClubSite; onRemove: (clubId: string) => Promise<void> }) => {
  const primaryColor = getColorById(club.theme?.primaryColor || 'blue').value;
  const [showAllMeetings, setShowAllMeetings] = useState(false);
  
  // Get category and activity colors
  const categoryColor = getCategoryColor(club.category);
  const activityColor = getActivityColor(club.activityType);
  
  // Helper function to determine if there are multiple meeting days
  const hasMultipleMeetingDays = (): boolean => {
    if (!club.meetingInfo) return false;
    return club.meetingInfo.includes('|');
  };

  // Function to get a brief preview of meeting info
  const getMeetingPreview = (): string => {
    if (!club.meetingInfo) return 'TBD';
    
    // If it doesn't have multiple days, show as is
    if (!hasMultipleMeetingDays()) {
      return club.meetingInfo;
    }
    
    // If it has multiple days, just show the first day
    const firstDay = club.meetingInfo.split('|')[0].trim();
    return `${firstDay}...`;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full"
    >
      {/* Colored Header Bar with Club Name */}
      <div 
        className="py-6 px-5 flex items-center justify-center"
        style={{ backgroundColor: primaryColor }}
      >
        <h2 className="text-2xl font-bold text-white text-center">
          {club.clubName}
        </h2>
      </div>
      
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div className="space-y-4">
          {/* Category and Activity Type Pills */}
          <div className="flex flex-wrap gap-2">
            {club.category && (
              <span 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                style={{ 
                  backgroundColor: categoryColor.lighter, 
                  color: categoryColor.bg 
                }}
              >
                {club.category}
              </span>
            )}
            {club.activityType && (
              <span 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                style={{ 
                  backgroundColor: activityColor.lighter, 
                  color: activityColor.bg
                }}
              >
                {club.activityType}
              </span>
            )}
          </div>
          
          {/* Club info list */}
          <div className="space-y-3.5 py-2">
            {/* Meetings */}
            {club.meetingInfo && (
              <div className="flex flex-col">
                <div className="flex items-center">
                  <div className="w-6 h-6 flex-shrink-0 mr-2 text-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-gray-900 mr-2">Meetings:</span>
                    
                    {/* Meeting times display */}
                    {hasMultipleMeetingDays() ? (
                      <div className="relative">
                        <button
                          onClick={() => setShowAllMeetings(!showAllMeetings)}
                          className="font-medium text-gray-900 flex items-center"
                        >
                          View All Times
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-4 w-4 ml-1 transition-transform ${showAllMeetings ? "rotate-180" : ""}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {/* Dropdown */}
                        {showAllMeetings && (
                          <div className="absolute left-0 mt-2 w-64 p-3 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            {/* Extract frequency if it exists in the meetingInfo */}
                            {club.meetingInfo && (club.meetingInfo.includes('weekly') || 
                                                 club.meetingInfo.includes('monthly') || 
                                                 club.meetingInfo.includes('biweekly')) && (
                              <div className="mb-2 pb-2 border-b border-gray-100">
                                <span className="text-sm font-medium text-gray-700">
                                  Frequency: <span className="font-bold text-[#38BFA1]">
                                    {club.meetingInfo.includes('weekly') ? 'Weekly' : 
                                     club.meetingInfo.includes('monthly') ? 'Monthly' : 
                                     club.meetingInfo.includes('biweekly') ? 'Biweekly' : ''}
                                  </span>
                                </span>
                              </div>
                            )}
                            <div className="py-1 space-y-2">
                              {club.meetingInfo?.split('|').map((meetingDay, index) => (
                                <div key={index} className="text-sm text-gray-800 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                  {/* Remove any frequency information from individual meeting times */}
                                  {meetingDay.trim().replace(/\s*\([^)]*\)\s*$/, '')} 
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="font-medium text-gray-900">{getMeetingPreview()}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Contact Email */}
            {club.jamboreeMeetingInfo?.email && (
              <div className="flex items-center">
                <div className="w-6 h-6 flex-shrink-0 mr-2 text-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex items-baseline">
                  <span className="text-gray-900 mr-2">Contact:</span>
                  <a href={`mailto:${club.jamboreeMeetingInfo.email}`} className="font-medium text-blue-600 hover:underline">
                    {club.jamboreeMeetingInfo.email}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <hr className="border-t border-gray-200 my-3" />
        
        <div className="flex justify-between items-center px-5 pb-4">
          <span className="text-xs text-gray-800">
            Updated {new Date(club.updatedAt).toLocaleDateString()}
          </span>
          <div className="flex gap-2">
            {/* Remove button */}
            <button
              onClick={() => onRemove(club.id)}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              Remove
            </button>
            <a
              href={`/${club.slug}`}
              className="inline-flex items-center px-5 py-2 text-sm font-medium text-white rounded-lg"
              style={{ backgroundColor: primaryColor }}
            >
              Visit Site
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [joinedClubs, setJoinedClubs] = useState<ClubSite[]>([]);
  const [isRemoving, setIsRemoving] = useState(false);
  
  // Calendar state
  const [meetings, setMeetings] = useState<MeetingOpportunity[]>([]);
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarView, setCalendarView] = useState<'month' | 'list'>('month');
  
  // Personal event modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDayViewOpen, setIsDayViewOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    meetings: MeetingOpportunity[];
    personalEvents: PersonalEvent[];
    date: Date;
  }>({ meetings: [], personalEvents: [], date: new Date() });
  const [editingEvent, setEditingEvent] = useState<PersonalEvent | null>(null);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    color: '#38BFA1'
  });

  // Function to leave a club
  const handleLeaveClub = async (clubId: string) => {
    if (!user?.email || isRemoving) return;
    
    try {
      setIsRemoving(true);
      
      // Get the user document
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        setIsRemoving(false);
        return;
      }
      
      const userData = userDoc.data();
      const joinedClubs = userData.joinedClubs || [];
      
      // Remove the club from user's joined clubs
      const updatedJoinedClubs = joinedClubs.filter((id: string) => id !== clubId);
      
      // Update the user document
      await updateDoc(userRef, {
        joinedClubs: updatedJoinedClubs
      });
      
      // Also remove from club's submissions for backward compatibility
      try {
        const clubRef = doc(db, 'clubSites', clubId);
        const clubDoc = await getDoc(clubRef);
        
        if (clubDoc.exists()) {
          const clubData = clubDoc.data();
          const submissions = clubData.interestForm?.submissions || [];
          const userSubmission = submissions.find(
            (submission: { email: string }) => submission.email === user.email
          );
          
          if (userSubmission) {
            await updateDoc(clubRef, {
              'interestForm.submissions': arrayRemove(userSubmission)
            });
          }
        }
      } catch (error) {
        console.error('Error removing from club submissions:', error);
        // Don't fail the main operation if this fails
      }
      
      // Update the local state
      setJoinedClubs(prev => prev.filter(club => club.id !== clubId));
      
      toast.success('Successfully left club');
    } catch (error) {
      console.error('Error leaving club:', error);
      toast.error('Failed to leave club');
    } finally {
      setIsRemoving(false);
    }
  };

  // Calendar functions
  const fetchMeetings = useCallback(async () => {
    if (!user?.email) return;

    try {
      // Get all meetings from the meetings collection
      const meetingsRef = collection(db, 'meetings');
      const meetingsSnapshot = await getDocs(meetingsRef);
      
      const allMeetings: MeetingOpportunity[] = [];
      
      meetingsSnapshot.forEach((doc) => {
        const meetingData = doc.data() as MeetingOpportunity;
        const meeting = { ...meetingData, id: doc.id };
        allMeetings.push(meeting);
      });
      
      setMeetings(allMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    }
  }, [user?.email]);

  const handleJoinMeeting = async (meetingId: string) => {
    if (!user?.email) return;

    try {
      const response = await fetch('/api/meetings/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId,
          participant: {
            name: user.displayName || user.email || '',
            email: user.email,
            grade: '', // Will be filled from user profile
            school: '', // Will be filled from user profile
            signupDate: new Date(),
          },
        }),
      });

      if (response.ok) {
        toast.success('Successfully joined meeting!');
        fetchMeetings(); // Refresh meetings
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to join meeting');
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      toast.error('Failed to join meeting');
    }
  };

  const handleLeaveMeeting = async (meetingId: string) => {
    if (!user?.email) return;

    try {
      const response = await fetch('/api/meetings/signup', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId,
          participantEmail: user.email,
        }),
      });

      if (response.ok) {
        toast.success('Successfully left meeting');
        fetchMeetings(); // Refresh meetings
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to leave meeting');
      }
    } catch (error) {
      console.error('Error leaving meeting:', error);
      toast.error('Failed to leave meeting');
    }
  };

  // Personal event functions
  const fetchPersonalEvents = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const events = userData.personalEvents || [];
        setPersonalEvents(events);
      }
    } catch (error) {
      console.error('Error fetching personal events:', error);
    }
  }, [user?.uid]);

  const savePersonalEvent = async (eventData: Partial<PersonalEvent>) => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      const existingEvents = userData.personalEvents || [];
      
      if (editingEvent) {
        // Update existing event
        const updatedEvents = existingEvents.map((event: PersonalEvent) => 
          event.id === editingEvent.id 
            ? { ...event, ...eventData, updatedAt: new Date() }
            : event
        );
        
        await updateDoc(userRef, {
          personalEvents: updatedEvents
        });
        
        setPersonalEvents(updatedEvents);
        toast.success('Event updated successfully');
      } else {
        // Create new event
        const newEvent: PersonalEvent = {
          id: Date.now().toString(),
          title: eventData.title || '',
          description: eventData.description || '',
          date: eventData.date || '',
          startTime: eventData.startTime || '',
          endTime: eventData.endTime || '',
          location: eventData.location || '',
          color: eventData.color || '#38BFA1',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const updatedEvents = [...existingEvents, newEvent];
        
        await updateDoc(userRef, {
          personalEvents: updatedEvents
        });
        
        setPersonalEvents(updatedEvents);
        toast.success('Event created successfully');
      }
      
      setIsEventModalOpen(false);
      setEditingEvent(null);
      setEventFormData({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        color: '#38BFA1'
      });
    } catch (error) {
      console.error('Error saving personal event:', error);
      toast.error('Failed to save event');
    }
  };

  const deletePersonalEvent = async (eventId: string) => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      const existingEvents = userData.personalEvents || [];
      const updatedEvents = existingEvents.filter((event: PersonalEvent) => event.id !== eventId);
      
      await updateDoc(userRef, {
        personalEvents: updatedEvents
      });
      
      setPersonalEvents(updatedEvents);
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting personal event:', error);
      toast.error('Failed to delete event');
    }
  };

  const openDayView = (date: Date) => {
    const dayMeetings = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.startDate);
      return meetingDate.toDateString() === date.toDateString();
    });
    const dayPersonalEvents = personalEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
    
    setSelectedDayEvents({
      meetings: dayMeetings,
      personalEvents: dayPersonalEvents,
      date
    });
    setSelectedDate(date);
    setIsDayViewOpen(true);
  };

  const openEventModal = (date: Date, event?: PersonalEvent) => {
    setSelectedDate(date);
    if (event) {
      setEditingEvent(event);
      setEventFormData({
        title: event.title,
        description: event.description || '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        location: event.location || '',
        color: event.color || '#38BFA1'
      });
    } else {
      setEditingEvent(null);
      setEventFormData({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        color: '#38BFA1'
      });
    }
    setIsEventModalOpen(true);
  };

  const fetchJoinedClubs = useCallback(async () => {
    if (!user?.email) return;

    try {
      // First get the user's joined clubs from their profile
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        setJoinedClubs([]);
        return;
      }
      
      const userData = userDoc.data();
      const joinedClubIds = userData.joinedClubs || [];
      
      if (joinedClubIds.length === 0) {
        setJoinedClubs([]);
        return;
      }
      
      // Get all club websites
      const clubSitesRef = collection(db, 'clubSites');
      const clubSitesSnapshot = await getDocs(clubSitesRef);
      
      const joinedClubsList: ClubSite[] = [];
      
      // Loop through each club site and check if it's in the user's joined clubs
      for (const docSnapshot of clubSitesSnapshot.docs) {
        const siteData = docSnapshot.data() as ClubSite;
        
        // Check if this club is in the user's joined clubs list
        if (joinedClubIds.includes(docSnapshot.id)) {
          // Convert Firestore timestamps to JS Date objects
          let createdAt: Date;
          let updatedAt: Date;
          
          if (siteData.createdAt && typeof siteData.createdAt === 'object' && 'seconds' in siteData.createdAt) {
            // It's a Firestore Timestamp-like object
            const seconds = (siteData.createdAt as { seconds: number }).seconds;
            createdAt = new Date(seconds * 1000);
          } else {
            // It's already a Date or a string/number
            createdAt = new Date(siteData.createdAt as string | number | Date);
          }
          
          if (siteData.updatedAt && typeof siteData.updatedAt === 'object' && 'seconds' in siteData.updatedAt) {
            // It's a Firestore Timestamp-like object
            const seconds = (siteData.updatedAt as { seconds: number }).seconds;
            updatedAt = new Date(seconds * 1000);
          } else {
            // It's already a Date or a string/number
            updatedAt = new Date(siteData.updatedAt as string | number | Date);
          }
          
          joinedClubsList.push({
            ...siteData,
            id: docSnapshot.id,
            createdAt,
            updatedAt
          });
        }
      }
      
      setJoinedClubs(joinedClubsList);
    } catch (error) {
      console.error('Error fetching joined clubs:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      Promise.all([fetchJoinedClubs(), fetchMeetings(), fetchPersonalEvents()]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, fetchJoinedClubs, fetchMeetings, fetchPersonalEvents]);

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
            <p className="text-gray-600 mb-8">
              Sign in to view your dashboard, upcoming visits, and completed visits
            </p>
            <button
              onClick={() => document.querySelector<HTMLButtonElement>('button[data-login-button]')?.click()}
              className="bg-[#38BFA1] text-white px-8 py-3 rounded-lg hover:bg-[#2DA891] transition-colors inline-flex items-center gap-2"
            >
              <span>Sign In</span>
              <span>→</span>
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            Looking to explore opportunities?{' '}
            <Link href="/school-clubs" className="text-[#38BFA1] hover:underline">
              Browse available clubs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-8 py-16">
        <div className="flex justify-between items-start gap-16 mb-12">
          <div className="relative max-w-2xl">
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#38BFA1]/10 rounded-full blur-3xl"></div>
            </div>
            <h1 className="text-4xl font-semibold text-[#0A2540] mb-4">
              Student Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Track clubs you&apos;ve joined
            </p>
          </div>
        </div>
        
        {/* Joined Clubs Section */}
        <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-12">
          <h2 className="text-xl font-semibold text-[#0A2540] mb-6 flex items-center">
            <span>Clubs I&apos;ve Joined</span>
            <span className="ml-2 px-2 py-1 bg-[#38BFA1]/10 text-[#38BFA1] text-sm rounded-full">
              {joinedClubs.length}
            </span>
          </h2>
          
          {joinedClubs.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-[#0A2540] mb-2">
                  No Clubs Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start exploring club websites and join clubs to see them here.
                </p>
                <Link 
                  href="/clubs"
                  className="bg-[#38BFA1]/10 text-[#38BFA1] px-6 py-3 rounded-md hover:bg-[#38BFA1]/20 transition-all inline-flex items-center gap-2"
                >
                  <span>Explore Clubs</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {joinedClubs.map((club) => (
                <ClubCard 
                  key={club.id} 
                  club={club} 
                  onRemove={handleLeaveClub}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Club Events Section */}
        {joinedClubs.length > 0 && (
          <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-12">
            <h2 className="text-xl font-semibold text-[#0A2540] mb-6 flex items-center">
              <CalendarIcon className="h-6 w-6 mr-2" />
              <span>Club Events</span>
            </h2>
            
            <div className="space-y-8">
              {joinedClubs.map((club) => (
                <div key={club.id} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{club.clubName} Events</h3>
                  <ClubEvents
                    clubId={club.id}
                    clubName={club.clubName}
                    userEmail={user?.email || ''}
                    userName={user?.displayName || user?.email || ''}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Club Posts Section */}
        {joinedClubs.length > 0 && (
          <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-12">
            <h2 className="text-xl font-semibold text-[#0A2540] mb-6 flex items-center">
              <CalendarIcon className="h-6 w-6 mr-2" />
              <span>Club Posts & Announcements</span>
            </h2>
            
            <div className="space-y-8">
              {joinedClubs.map((club) => (
                <div key={club.id} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{club.clubName} Posts</h3>
                  <ClubPosts
                    clubId={club.id}
                    clubName={club.clubName}
                    userEmail={user?.email || ''}
                    userName={user?.displayName || user?.email || ''}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Calendar Section */}
        <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#0A2540] flex items-center">
              <CalendarIcon className="h-6 w-6 mr-2" />
              My Calendar
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCalendarView('month')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  calendarView === 'month' 
                    ? 'bg-[#38BFA1] text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Month View
              </button>
              <button
                onClick={() => setCalendarView('list')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  calendarView === 'list' 
                    ? 'bg-[#38BFA1] text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                List View
              </button>
            </div>
          </div>
          
          {calendarView === 'month' ? (
            <div className="space-y-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                
                {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }, (_, i) => (
                  <div key={`empty-start-${i}`} className="p-2"></div>
                ))}
                
                {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }, (_, i) => {
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
                  const dayMeetings = meetings.filter(meeting => {
                    const meetingDate = new Date(meeting.startDate);
                    return meetingDate.toDateString() === date.toDateString();
                  });
                  const dayPersonalEvents = personalEvents.filter(event => {
                    const eventDate = new Date(event.date);
                    return eventDate.toDateString() === date.toDateString();
                  });
                  
                  return (
                    <div
                      key={i}
                      className={`p-2 min-h-[80px] border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedDate?.toDateString() === date.toDateString() ? 'bg-[#38BFA1]/10 border-[#38BFA1]' : ''
                      }`}
                      onClick={() => openDayView(date)}
                    >
                      <div className="text-sm font-medium text-gray-900 mb-1 flex items-center justify-between">
                        <span>{i + 1}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEventModal(date);
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                          title="Add personal event"
                        >
                          <PlusIcon className="h-3 w-3 text-gray-500" />
                        </button>
                      </div>
                      
                      {/* Club Meetings */}
                      {dayMeetings.map((meeting, idx) => (
                        <div
                          key={`meeting-${idx}`}
                          className="text-xs p-1 mb-1 rounded bg-blue-100 text-blue-800 truncate"
                          title={meeting.title}
                        >
                          {meeting.title}
                        </div>
                      ))}
                      
                      {/* Personal Events */}
                      {dayPersonalEvents.map((event, idx) => (
                        <div
                          key={`event-${idx}`}
                          className="text-xs p-1 mb-1 rounded truncate"
                          style={{ 
                            backgroundColor: `${event.color}20`, 
                            color: event.color,
                            border: `1px solid ${event.color}40`
                          }}
                          title={event.title}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEventModal(date, event);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
                
                {Array.from({ length: 6 - new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDay() }, (_, i) => (
                  <div key={`empty-end-${i}`} className="p-2"></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">All Available Meetings</h3>
                <div className="text-sm text-gray-500">
                  {meetings.filter(m => m.status === 'active').length} meetings available
                </div>
              </div>
              
              <div className="space-y-3">
                {meetings
                  .filter(meeting => meeting.status === 'active')
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map((meeting) => {
                    const isJoined = meeting.participants?.some(
                      (participant: { email: string }) => participant.email === user?.email
                    );
                    
                    return (
                      <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                          {isJoined && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Joined
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3 text-sm">{meeting.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            <span>{new Date(meeting.startDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            <span>{new Date(`2000-01-01T${meeting.startTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - {new Date(`2000-01-01T${meeting.endTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-2" />
                            <span>Room {meeting.roomNumber}</span>
                          </div>
                          <div className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 mr-2" />
                            <span>{meeting.currentParticipants}/{meeting.maxParticipants || '∞'} participants</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">{meeting.clubName}</span>
                          </div>
                          <button
                            onClick={() => isJoined ? handleLeaveMeeting(meeting.id) : handleJoinMeeting(meeting.id)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              isJoined
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-[#38BFA1] text-white hover:bg-[#2DA891]'
                            }`}
                          >
                            {isJoined ? 'Leave Meeting' : 'Join Meeting'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
        
        {/* Day View Modal */}
        {isDayViewOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedDayEvents.date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedDayEvents.meetings.length + selectedDayEvents.personalEvents.length} events scheduled
                  </p>
                </div>
                <button
                  onClick={() => setIsDayViewOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Club Meetings Section */}
                {selectedDayEvents.meetings.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Club Meetings ({selectedDayEvents.meetings.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedDayEvents.meetings.map((meeting) => {
                        const isJoined = meeting.participants?.some(
                          (participant: { email: string }) => participant.email === user?.email
                        );
                        
                        return (
                          <div key={meeting.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-semibold text-gray-900">{meeting.title}</h5>
                              {isJoined && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Joined
                                </span>
                              )}
                            </div>
                            
                            <p className="text-gray-600 mb-3 text-sm">{meeting.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 mb-3">
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-2" />
                                <span>{new Date(`2000-01-01T${meeting.startTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - {new Date(`2000-01-01T${meeting.endTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPinIcon className="h-4 w-4 mr-2" />
                                <span>Room {meeting.roomNumber}</span>
                              </div>
                              <div className="flex items-center">
                                <UserGroupIcon className="h-4 w-4 mr-2" />
                                <span>{meeting.currentParticipants}/{meeting.maxParticipants || '∞'} participants</span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium text-blue-600">{meeting.clubName}</span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => isJoined ? handleLeaveMeeting(meeting.id) : handleJoinMeeting(meeting.id)}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                isJoined
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {isJoined ? 'Leave Meeting' : 'Join Meeting'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Personal Events Section */}
                {selectedDayEvents.personalEvents.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2 text-[#38BFA1]" />
                      Personal Events ({selectedDayEvents.personalEvents.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedDayEvents.personalEvents.map((event) => (
                        <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-semibold text-gray-900">{event.title}</h5>
                            <button
                              onClick={() => {
                                setIsDayViewOpen(false);
                                openEventModal(selectedDayEvents.date, event);
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                          
                          {event.description && (
                            <p className="text-gray-600 mb-3 text-sm">{event.description}</p>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                            {event.startTime && event.endTime && (
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-2" />
                                <span>{new Date(`2000-01-01T${event.startTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - {new Date(`2000-01-01T${event.endTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center">
                                <MapPinIcon className="h-4 w-4 mr-2" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: event.color }}></div>
                              <span>Personal Event</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* No Events Message */}
                {selectedDayEvents.meetings.length === 0 && selectedDayEvents.personalEvents.length === 0 && (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Events Scheduled</h4>
                    <p className="text-gray-500 mb-4">This day is free! Add a personal event or join a club meeting.</p>
                  </div>
                )}
                
                {/* Add Personal Event Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setIsDayViewOpen(false);
                      openEventModal(selectedDayEvents.date);
                    }}
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-[#38BFA1] hover:bg-[#2DA891] transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Personal Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Personal Event Modal */}
        {isEventModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingEvent ? 'Edit Event' : 'Add Personal Event'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedDate?.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsEventModalOpen(false);
                    setEditingEvent(null);
                    setEventFormData({
                      title: '',
                      description: '',
                      startTime: '',
                      endTime: '',
                      location: '',
                      color: '#38BFA1'
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                savePersonalEvent({
                  ...eventFormData,
                  date: selectedDate?.toISOString().split('T')[0] || ''
                });
              }} className="p-6 space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={eventFormData.title}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Study Session, Doctor Appointment"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={eventFormData.description}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional details about your event..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={eventFormData.startTime}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={eventFormData.endTime}
                      onChange={(e) => setEventFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={eventFormData.location}
                    onChange={(e) => setEventFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Library, Room 201, Home"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {['#38BFA1', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981', '#F97316'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEventFormData(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          eventFormData.color === color ? 'border-gray-400 scale-110' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  {editingEvent && (
                    <button
                      type="button"
                      onClick={() => deletePersonalEvent(editingEvent.id)}
                      className="px-4 py-2 text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      Delete Event
                    </button>
                  )}
                  <div className="flex gap-3 ml-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEventModalOpen(false);
                        setEditingEvent(null);
                        setEventFormData({
                          title: '',
                          description: '',
                          startTime: '',
                          endTime: '',
                          location: '',
                          color: '#38BFA1'
                        });
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#38BFA1] text-white rounded-md hover:bg-[#2DA891] transition-colors font-medium text-sm"
                    >
                      {editingEvent ? 'Update Event' : 'Create Event'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 