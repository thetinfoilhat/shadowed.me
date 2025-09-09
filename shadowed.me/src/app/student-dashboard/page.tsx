'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, updateDoc, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClubSite, MeetingOpportunity } from '@/types/club';
import { formatDateForInput } from '@/utils/dateUtils';

// Personal Event Interface
interface PersonalEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  color?: string; // Defaults to blue (#3B82F6) if not specified
  createdAt: Date;
  updatedAt: Date;
  isJoinedClubEvent?: boolean; // True if this is a joined club event, false if personal event
  clubId?: string; // ID of the club this event belongs to (for joined events)
  originalPostId?: string; // Original post ID for joined events
}

interface ClubPost {
  id?: string;
  clubId: string;
  clubName: string;
  title: string;
  content: string;
  postType: 'event';
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  maxParticipants?: number;
  currentParticipants: number;
  participants: Array<{
    name: string;
    email: string;
    grade?: string;
    school?: string;
    joinDate: Date;
  }>;
  createdBy: string;
  createdByEmail: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'cancelled' | 'completed';
  tags?: string[];
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringDays?: string[];
}
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';
import { getColorById } from '@/utils/colors';
import { toast } from 'react-hot-toast';
import { CalendarIcon, ClockIcon, MapPinIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Helper function to get the number of days in a month
const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

// Helper function to check if an event is in the past
const isEventInPast = (event: ClubPost | MeetingOpportunity): boolean => {
  const now = new Date();
  
  // Get the event date - ClubPost uses 'date', MeetingOpportunity uses 'startDate'
  const eventDateString = 'date' in event ? event.date : event.startDate;
  const eventDate = new Date(eventDateString);
  
  // If the event has a start time, compare with current time
  if ('startTime' in event && event.startTime) {
    const eventDateTime = new Date(`${eventDateString}T${event.startTime}`);
    return eventDateTime < now;
  }
  
  // Otherwise, just compare dates
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  return eventDay < today;
};

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
  const [joinedClubEvents, setJoinedClubEvents] = useState<PersonalEvent[]>([]);
  const [allClubOpportunities, setAllClubOpportunities] = useState<ClubPost[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarView, setCalendarView] = useState<'month' | 'list'>('month');
  
  // Personal event modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDayViewOpen, setIsDayViewOpen] = useState(false);
  const [isOpportunitiesViewOpen, setIsOpportunitiesViewOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    meetings: (MeetingOpportunity | ClubPost)[];
    personalEvents: PersonalEvent[];
    joinedClubEvents: PersonalEvent[];
    date: Date;
  }>({ meetings: [], personalEvents: [], joinedClubEvents: [], date: new Date() });
  const [selectedOpportunitiesEvents, setSelectedOpportunitiesEvents] = useState<{
    opportunities: (MeetingOpportunity | ClubPost)[];
    date: Date;
  }>({ opportunities: [], date: new Date() });
  const [editingEvent, setEditingEvent] = useState<PersonalEvent | null>(null);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: ''
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

  // Fetch all opportunities from all joined clubs
  const fetchAllClubOpportunities = useCallback(async () => {
    if (!user?.email || joinedClubs.length === 0) return;

    try {
      const allOpportunities: ClubPost[] = [];
      
      // Fetch opportunities from each joined club
      for (const club of joinedClubs) {
        try {
          const response = await fetch(`/api/club-posts?clubId=${club.id}&status=active`);
          if (response.ok) {
            const data = await response.json();
            const clubPosts = data.posts || [];
            
            // Add club name to each post for display
            const postsWithClubName = clubPosts.map((post: ClubPost) => ({
              ...post,
              clubName: club.clubName
            }));
            
            allOpportunities.push(...postsWithClubName);
          }
        } catch (error) {
          console.error(`Error fetching opportunities for club ${club.clubName}:`, error);
        }
      }
      
      // Sort by date
      allOpportunities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setAllClubOpportunities(allOpportunities);
    } catch (error) {
      console.error('Error fetching all club opportunities:', error);
      toast.error('Failed to load club opportunities');
    }
  }, [user?.email, joinedClubs]);


  // Personal event functions
  const fetchPersonalEvents = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const allEvents = userData.personalEvents || [];
        
        // Separate personal events from joined club events
        const personalEvents = allEvents.filter((event: PersonalEvent) => !event.isJoinedClubEvent);
        const joinedClubEvents = allEvents.filter((event: PersonalEvent) => event.isJoinedClubEvent);
        
        setPersonalEvents(personalEvents);
        setJoinedClubEvents(joinedClubEvents);
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
          color: '#3B82F6',
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
        location: ''
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
    // For personal calendar popup, we only show joined events and personal events
    // No need to fetch available opportunities here
    
    const dayPersonalEvents = personalEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
    
    const dayJoinedClubEvents = joinedClubEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
    
    setSelectedDayEvents({
      meetings: [], // No available opportunities in personal calendar popup
      personalEvents: dayPersonalEvents, // Only personal events
      joinedClubEvents: dayJoinedClubEvents, // Separate joined club events
      date
    });
    setSelectedDate(date);
    setIsDayViewOpen(true);
  };

  const openOpportunitiesView = (date: Date) => {
    // For opportunities popup, we show all available opportunities for joining
    
    // Get all available meetings for this day
    const dayAllMeetings = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.startDate);
      return meetingDate.toDateString() === date.toDateString() && meeting.status === 'active';
    });
    
    // Get all available club opportunities for this day
    const dayClubOpportunities = allClubOpportunities.filter(opportunity => {
      const opportunityDate = new Date(opportunity.date);
      return opportunityDate.toDateString() === date.toDateString();
    });
    
    // Combine both types of opportunities
    const allOpportunities = [...dayAllMeetings, ...dayClubOpportunities];
    
    setSelectedOpportunitiesEvents({
      opportunities: allOpportunities,
      date
    });
    setSelectedDate(date);
    setIsOpportunitiesViewOpen(true);
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
        location: event.location || ''
      });
    } else {
      setEditingEvent(null);
      setEventFormData({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: ''
      });
    }
    setIsEventModalOpen(true);
  };

  // Fetch joined clubs
  useEffect(() => {
    const fetchJoinedClubs = async () => {
      if (!user?.uid) return;

      try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
        if (userDoc.exists()) {
      const userData = userDoc.data();
      const joinedClubIds = userData.joinedClubs || [];
      
          if (joinedClubIds.length > 0) {
            const clubsData: ClubSite[] = [];
            
            for (const clubId of joinedClubIds) {
              try {
                const clubRef = doc(db, 'clubSites', clubId);
                const clubDoc = await getDoc(clubRef);
                
                if (clubDoc.exists()) {
                  const clubData = clubDoc.data() as ClubSite;
                  clubsData.push({ ...clubData, id: clubId });
                }
              } catch (error) {
                console.error(`Error fetching club ${clubId}:`, error);
              }
            }
            
            setJoinedClubs(clubsData);
          }
        }
      } catch (error) {
        console.error('Error fetching joined clubs:', error);
        toast.error('Failed to load joined clubs');
      } finally {
        setLoading(false);
      }
    };

    fetchJoinedClubs();
  }, [user?.uid]);

  // Fetch all club opportunities when joined clubs change
  useEffect(() => {
    fetchAllClubOpportunities();
  }, [fetchAllClubOpportunities]);

  // Handle joining a club post/event (for opportunities popup)
  const handleJoinClubPost = async (postId: string) => {
    if (!user?.email || !user?.uid) return;

    try {
      console.log('Attempting to join club post:', postId, 'for user:', user.email);
      
      const response = await fetch('/api/club-posts/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          postId,
          participant: {
            name: user.displayName || user.email || '',
            email: user.email,
            grade: '', // Will be filled from user profile
            school: '', // Will be filled from user profile
            joinDate: new Date(),
          },
        }),
      });

      console.log('Join response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Join successful:', result);
        toast.success('Successfully joined event!');
        
        // The API already handles adding the event to the user's personal calendar
        // We just need to refresh the personal events to get the updated data
        await fetchPersonalEvents();
        
        // Refresh the opportunities to show updated participant count
        fetchAllClubOpportunities();
      } else {
        const error = await response.json();
        console.error('Join failed:', error);
        toast.error(error.error || error.message || 'Failed to join event');
      }
    } catch (error) {
      console.error('Error joining club post:', error);
      toast.error('Failed to join event - please check your connection');
    }
  };

  // Handle leaving a club post/event
  const handleLeaveClubPost = async (postId: string) => {
    if (!user?.email || !user?.uid) return;

    try {
      console.log('Attempting to leave club post:', postId, 'for user:', user.email);
      
      const response = await fetch('/api/club-posts/join', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          postId,
          participantEmail: user.email,
        }),
      });

      console.log('Leave response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Leave successful:', result);
        toast.success('Successfully left event');
        
        // The API already handles removing the event from the user's personal calendar
        // We just need to refresh the personal events to get the updated data
        await fetchPersonalEvents();
        
        // Refresh the opportunities to show updated participant count
        fetchAllClubOpportunities();
      } else {
        const error = await response.json();
        console.error('Leave failed:', error);
        toast.error(error.error || error.message || 'Failed to leave event');
      }
    } catch (error) {
      console.error('Error leaving club post:', error);
      toast.error('Failed to leave event - please check your connection');
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchMeetings(), fetchPersonalEvents()]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, fetchMeetings, fetchPersonalEvents]);

  // Also fetch opportunities when component mounts
  useEffect(() => {
    if (joinedClubs.length > 0) {
      fetchAllClubOpportunities();
    }
  }, [joinedClubs.length, fetchAllClubOpportunities]);

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
              Track clubs you&apos;ve joined and manage your schedule
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => openEventModal(new Date())}
              className="inline-flex items-center px-4 py-2 bg-[#38BFA1] text-white rounded-lg hover:bg-[#2DA891] transition-colors font-medium"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Event
            </button>
            <Link
              href="/clubs"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Clubs
            </Link>
          </div>
        </div>
        
        {/* Dashboard Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{joinedClubs.length}</h3>
            <p className="text-sm text-gray-600">Clubs Joined</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{allClubOpportunities.filter(opp => !isEventInPast(opp)).length}</h3>
            <p className="text-sm text-gray-600">Available Opportunities</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{personalEvents.length}</h3>
            <p className="text-sm text-gray-600">Personal Events</p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{meetings.filter(m => m.participants?.some(p => p.email === user?.email)).length}</h3>
            <p className="text-sm text-gray-600">Events Joined</p>
          </div>
        </div>
        
        {/* Joined Clubs Section */}
        <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-12">
          <h2 className="text-xl font-semibold text-[#0A2540] mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Clubs I&apos;ve Joined</span>
            <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
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
        
        {/* Comprehensive Calendar Section */}
          <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#0A2540] flex items-center">
              <CalendarIcon className="h-6 w-6 mr-2" />
              My Calendar & Opportunities
            </h2>
            <div className="text-sm text-gray-600">
              {allClubOpportunities.filter(opp => !isEventInPast(opp)).length} opportunities available
                </div>
            </div>
          
          {/* Quick Help */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">How to use your calendar:</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Calendar View:</strong> See your joined events and personal events (click personal events to edit)</li>
                    <li><strong>List View:</strong> Browse all available opportunities from your clubs and join them</li>
                    <li><strong>Click any date</strong> to see detailed events for that day</li>
                    <li><strong>Add personal events</strong> by clicking the + button on any date</li>
                  </ul>
            </div>
          </div>
            </div>
          </div>
          
          {/* Calendar Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => setCalendarView('month')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                calendarView === 'month'
                  ? 'bg-white text-[#0A2540] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Calendar View
            </button>
            <button
              onClick={() => setCalendarView('list')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                calendarView === 'list'
                  ? 'bg-white text-[#0A2540] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              All Opportunities
            </button>
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
                  
                  // Get joined meetings for this day
                  const dayJoinedMeetings = meetings.filter(meeting => {
                    const meetingDate = new Date(meeting.startDate);
                    return meetingDate.toDateString() === date.toDateString() && 
                           meeting.participants?.some(p => p.email === user?.email);
                  });
                  
                  // Get personal events for this day
                  const dayPersonalEvents = personalEvents.filter(event => {
                    const eventDate = new Date(event.date);
                    return eventDate.toDateString() === date.toDateString();
                  });
                  
                  // Get joined club events for this day
                  const dayJoinedClubEvents = joinedClubEvents.filter(event => {
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
                      
                      {/* Joined Club Meetings */}
                      {dayJoinedMeetings.map((meeting, idx) => (
                        <div
                          key={`joined-${idx}`}
                          className="text-xs p-1 mb-1 rounded bg-green-100 text-green-800 truncate"
                          title={`${meeting.title} - ${meeting.clubName} (Joined)`}
                        >
                          {meeting.title}
                        </div>
                      ))}
                      
                      {/* Joined Club Events */}
                      {dayJoinedClubEvents.map((event, idx) => (
                        <div
                          key={`joined-club-${idx}`}
                          className="text-xs p-1 mb-1 rounded bg-green-100 text-green-800 truncate cursor-pointer"
                          title={`${event.title} (Joined Club Event - Click to view details)`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openDayView(date);
                          }}
                        >
                          {event.title} (Joined)
                        </div>
                      ))}
                      
                      {/* Personal Events */}
                      {dayPersonalEvents.map((event, idx) => (
                        <div
                          key={`personal-${idx}`}
                          className="text-xs p-1 mb-1 rounded truncate cursor-pointer"
                          style={{ 
                            backgroundColor: `${event.color || '#3B82F6'}20`, 
                            color: event.color || '#3B82F6',
                            border: `1px solid ${event.color || '#3B82F6'}40`
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
              
              {/* Calendar Legend */}
              <div className="flex items-center justify-center space-x-8 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
                  <span className="text-sm text-gray-700 font-medium">Joined Club Events</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3B82F620', border: '1px solid #3B82F640' }}></div>
                  <span className="text-sm text-gray-700 font-medium">Personal Events</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">All Available Opportunities</h3>
                <div className="flex items-center gap-3">
                          <button
                    onClick={fetchAllClubOpportunities}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    Refresh
                          </button>
                  <div className="text-sm text-gray-500">
                    Browse and join events from all your clubs
                        </div>
                      </div>
        </div>
        
              {/* Unified Calendar for All Club Opportunities */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold text-gray-900">Unified Club Calendar</h4>
                  <div className="flex items-center space-x-2">
              <button
                      onClick={() => setCurrentMonth(prev => {
                        const newMonth = new Date(prev);
                        newMonth.setMonth(prev.getMonth() - 1);
                        return newMonth;
                      })}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
                    <span className="text-lg font-medium text-gray-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
              <button
                      onClick={() => setCurrentMonth(prev => {
                        const newMonth = new Date(prev);
                        newMonth.setMonth(prev.getMonth() + 1);
                        return newMonth;
                      })}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
                  </div>
            </div>
            
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
                    const day = i + 1;
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    
                    // Get all opportunities for this date from all clubs
                    const dayOpportunities = allClubOpportunities.filter(opportunity => {
                      const opportunityDate = new Date(opportunity.date);
                      return opportunityDate.toDateString() === date.toDateString();
                    });
                    
                    // Check if this date has opportunities
                    const hasOpportunities = dayOpportunities.length > 0;
                
                return (
                  <div
                        key={day}
                        className={`min-h-[80px] p-2 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer ${
                          date.toDateString() === new Date().toDateString() ? 'bg-blue-50 border-blue-300' : ''
                    }`}
                    onClick={() => openOpportunitiesView(date)}
                  >
                        <div className="text-sm font-medium text-gray-900 mb-1">{day}</div>
                        
                        {/* Show opportunity indicators */}
                        {hasOpportunities && (
                          <div className="space-y-1">
                            {dayOpportunities.slice(0, 2).map((opportunity, idx) => {
                              const isJoined = opportunity.participants?.some(
                        (participant: { email: string }) => participant.email === user?.email
                      );
                              const isPast = isEventInPast(opportunity);
                      
                      return (
                        <div
                                  key={idx}
                                  className={`text-xs p-1 rounded truncate ${
                                    isPast
                                      ? 'bg-gray-100 text-gray-600 opacity-75'
                                      : opportunity.currentParticipants >= (opportunity.maxParticipants || 999)
                                      ? 'bg-red-100 text-red-800'
                                      : isJoined
                                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                  title={`${opportunity.title} - ${opportunity.clubName}${isJoined ? ' (Joined)' : ''}${isPast ? ' (Past Event)' : ''}`}
                                >
                                  {opportunity.title}
                                  {isJoined && <span className="ml-1">✓</span>}
                                  {isPast && <span className="ml-1">⏰</span>}
                        </div>
                      );
                    })}
                            {dayOpportunities.length > 2 && (
                              <div className="text-xs text-gray-500 text-center">
                                +{dayOpportunities.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                  </div>
                );
              })}
                </div>
                
                {/* Calendar Legend */}
                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                    <span className="text-gray-600">Available Opportunities</span>
            </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                    <span className="text-gray-600">Full Events</span>
          </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                    <span className="text-gray-600">Events You&apos;ve Joined</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded opacity-75"></div>
                    <span className="text-gray-600">Past Events</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-50 border border-blue-300 rounded"></div>
                    <span className="text-gray-600">Today</span>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {allClubOpportunities.filter(opp => !isEventInPast(opp)).length}
                    </div>
                    <div className="text-sm text-gray-600">Available Opportunities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {allClubOpportunities.filter(opp => 
                        opp.participants.some((p: { email: string }) => p.email === user?.email)
                      ).length}
                    </div>
                    <div className="text-sm text-gray-600">Events Joined</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {joinedClubs.length}
                    </div>
                    <div className="text-sm text-gray-600">Clubs</div>
                  </div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">How to Use This Calendar:</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Click on any date</strong> to see all available opportunities for that day</li>
                  <li>• <strong>Green indicators</strong> show available events you can join</li>
                  <li>• <strong>Red indicators</strong> show events that are full</li>
                  <li>• <strong>Blue highlight</strong> shows today&apos;s date</li>
                  <li>• All opportunities from your joined clubs are automatically synced here</li>
                </ul>
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
                    {selectedDayEvents.personalEvents.length} personal events • {selectedDayEvents.joinedClubEvents.length} joined club events
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
                
                {/* Joined Club Events Section */}
                {selectedDayEvents.joinedClubEvents.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
                      Joined Club Events ({selectedDayEvents.joinedClubEvents.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedDayEvents.joinedClubEvents.map((event) => (
                        <div key={event.id} className="border border-green-200 bg-green-50 rounded-lg p-4 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-semibold text-gray-900">
                              {event.title}
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                Joined Club Event
                              </span>
                            </h5>
                            {event.originalPostId && (
                              <button
                                onClick={() => {
                                  setIsDayViewOpen(false);
                                  handleLeaveClubPost(event.originalPostId!);
                                }}
                                className="text-red-400 hover:text-red-600 transition-colors"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
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
                              <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
                              <span>Joined Club Event</span>
                            </div>
                          </div>
                        </div>
                      ))}
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
                        <div key={event.id} className="border border-gray-200 hover:border-gray-300 rounded-lg p-4 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-semibold text-gray-900">
                              {event.title}
                            </h5>
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
                              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: event.color || '#3B82F6' }}></div>
                              <span>Personal Event</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* No Events Message */}
                {selectedDayEvents.personalEvents.length === 0 && selectedDayEvents.joinedClubEvents.length === 0 && (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Events</h4>
                    <p className="text-gray-500 mb-4">This day is free! Add a personal event or join club events from the calendar view.</p>
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
                      location: ''
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
                  date: selectedDate ? formatDateForInput(selectedDate) : ''
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
                          location: ''
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

        {/* Opportunities View Modal */}
        {isOpportunitiesViewOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedOpportunitiesEvents.date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedOpportunitiesEvents.opportunities.filter(opp => !isEventInPast(opp)).length} opportunities available
                  </p>
                </div>
                <button
                  onClick={() => setIsOpportunitiesViewOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Available Opportunities Section */}
                {selectedOpportunitiesEvents.opportunities.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Available Opportunities ({selectedOpportunitiesEvents.opportunities.filter(opp => !isEventInPast(opp)).length})
                    </h4>
                    <div className="space-y-3">
                      {selectedOpportunitiesEvents.opportunities.map((opportunity) => {
                        // Check if this is a ClubPost or MeetingOpportunity
                        const isClubPost = 'postType' in opportunity;
                        const isJoined = opportunity.participants?.some(
                          (participant: { email: string }) => participant.email === user?.email
                        );
                        const isPast = isEventInPast(opportunity);
                        
                        return (
                          <div key={opportunity.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-semibold text-gray-900">{opportunity.title}</h5>
                              {isJoined && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Joined
                                </span>
                              )}
                            </div>
                            
                            {/* Handle different content fields */}
                            <p className="text-gray-600 mb-3 text-sm">
                              {isClubPost ? (opportunity as ClubPost).content : (opportunity as MeetingOpportunity).description}
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 mb-3">
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-2" />
                                <span>
                                  {opportunity.startTime && opportunity.endTime ? 
                                    `${new Date(`2000-01-01T${opportunity.startTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${new Date(`2000-01-01T${opportunity.endTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` :
                                    'Time TBD'
                                  }
                                </span>
                              </div>
                              <div className="flex items-center">
                                <MapPinIcon className="h-4 w-4 mr-2" />
                                <span>
                                  {isClubPost ? (opportunity as ClubPost).location || 'Location TBD' : `Room ${(opportunity as MeetingOpportunity).roomNumber}`}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium text-blue-600">
                                  {isClubPost ? (opportunity as ClubPost).clubName : (opportunity as MeetingOpportunity).clubName}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span>{opportunity.currentParticipants}/{opportunity.maxParticipants || '∞'} participants</span>
                              </div>
                            </div>
                            
                            {/* Action buttons */}
                            {isPast ? (
                              <div className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-500 cursor-not-allowed">
                                Past Event
                              </div>
                            ) : isJoined ? (
                              <button
                                onClick={() => handleLeaveClubPost(opportunity.id!)}
                                className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200"
                              >
                                Leave Event
                              </button>
                            ) : (
                              <button
                                onClick={() => handleJoinClubPost(opportunity.id!)}
                                className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Join Event
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* No Opportunities Message */}
                {selectedOpportunitiesEvents.opportunities.length === 0 && (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Opportunities Available</h4>
                    <p className="text-gray-500 mb-4">There are no events available for this day. Check other dates or join more clubs to see more opportunities.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 