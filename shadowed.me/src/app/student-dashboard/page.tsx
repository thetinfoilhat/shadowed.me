'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClubSite } from '@/types/club';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';
import { getColorById } from '@/utils/colors';

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
            {/* Jamboree Table - Emphasis added */}
            {club.jamboreeMeetingInfo?.table && (
              <div className="flex items-center bg-[#f8f9ff] p-2 rounded-md border-l-4 border-blue-400">
                <div className="w-6 h-6 flex-shrink-0 mr-2 text-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex items-baseline">
                  <span className="text-gray-900 mr-2 font-medium">Jamboree Table:</span>
                  <span className="font-bold text-blue-700">{club.jamboreeMeetingInfo.table}</span>
                </div>
              </div>
            )}
            
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
  const [interestedClubs, setInterestedClubs] = useState<ClubSite[]>([]);
  const [isRemoving, setIsRemoving] = useState(false);

  // Function to remove interest from a club
  const handleRemoveInterest = async (clubId: string) => {
    if (!user?.email || isRemoving) return;
    
    try {
      setIsRemoving(true);
      
      // Get the club site document
      const clubRef = doc(db, 'clubSites', clubId);
      
      // Find the current user in the submissions list
      const clubToRemove = interestedClubs.find(club => club.id === clubId);
      
      if (!clubToRemove || !clubToRemove.interestForm?.submissions) {
        setIsRemoving(false);
        return;
      }
      
      // Find the user's submission
      const userSubmission = clubToRemove.interestForm.submissions.find(
        submission => submission.email === user.email
      );
      
      if (!userSubmission) {
        setIsRemoving(false);
        return;
      }
      
      // Remove the user's submission
      await updateDoc(clubRef, {
        'interestForm.submissions': arrayRemove(userSubmission)
      });
      
      // Update the local state
      setInterestedClubs(prev => prev.filter(club => club.id !== clubId));
      
      } catch (error) {
      console.error('Error removing interest:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const fetchInterestedClubs = useCallback(async () => {
    if (!user?.email) return;

    try {
      // Get all club websites
      const clubSitesRef = collection(db, 'clubSites');
      const clubSitesSnapshot = await getDocs(clubSitesRef);
      
      const interestedClubsList: ClubSite[] = [];
      
      // Loop through each club site
      for (const docSnapshot of clubSitesSnapshot.docs) {
        const siteData = docSnapshot.data() as ClubSite;
        
        // Check if this user's email is in the interest form submissions
        const hasExpressedInterest = siteData.interestForm?.submissions?.some(
          (submission) => submission.email === user.email
        );
        
        if (hasExpressedInterest) {
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
          
          interestedClubsList.push({
            ...siteData,
            id: docSnapshot.id,
            createdAt,
            updatedAt
          });
        }
      }

      setInterestedClubs(interestedClubsList);
    } catch (error) {
      console.error('Error fetching interested clubs:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchInterestedClubs().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, fetchInterestedClubs]);

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
              Track clubs you&apos;re interested in
            </p>
          </div>
        </div>
        
        {/* Interested Clubs Section */}
        <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-12">
          <h2 className="text-xl font-semibold text-[#0A2540] mb-6 flex items-center">
            <span>Clubs I&apos;m Interested In</span>
            <span className="ml-2 px-2 py-1 bg-[#38BFA1]/10 text-[#38BFA1] text-sm rounded-full">
              {interestedClubs.length}
            </span>
          </h2>
          
          {interestedClubs.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-[#0A2540] mb-2">
                  No Clubs Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start exploring club websites and express your interest to see them here.
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
              {interestedClubs.map((club) => (
                <ClubCard 
                  key={club.id} 
                  club={club} 
                  onRemove={handleRemoveInterest}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 