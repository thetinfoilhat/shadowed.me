'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageTransition from '@/components/PageTransition';
import { toast } from 'react-hot-toast';
import { PlusIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { ClubSite } from '@/types/club';

// Category color mapping
const CATEGORY_COLORS: Record<string, { bg: string, text: string, lighter: string }> = {
  'STEM': { bg: '#3B7DD3', text: '#ffffff', lighter: '#D5E4F7' }, // Softer blue for STEM
  'Humanities': { bg: '#9D68B2', text: '#ffffff', lighter: '#E9DAEF' }, // Muted purple for humanities
  'Business': { bg: '#4DA96C', text: '#ffffff', lighter: '#DBF0E1' }, // Subdued green for business
  'Music, Arts, & Performing Arts': { bg: '#E8667F', text: '#ffffff', lighter: '#F9DFE4' }, // Softer pink/red for arts
  'Academic': { bg: '#D4AF37', text: '#000000', lighter: '#F5EDCF' }, // Darker gold/beige for academic
  'Language & Culture': { bg: '#E87F3A', text: '#ffffff', lighter: '#F8E2D2' }, // Softer orange for language & culture
  'Medical': { bg: '#CF5050', text: '#ffffff', lighter: '#F4DCDC' }, // Muted red for medical
  'Sports': { bg: '#63B574', text: '#000000', lighter: '#DFF0E3' }, // Softer green for sports
  'Community Service & Leadership': { bg: '#55B2B2', text: '#000000', lighter: '#DAF0F0' }, // Softer teal for community service
  'Miscellaneous': { bg: '#7D7DA8', text: '#ffffff', lighter: '#E5E5EF' }, // Muted slate blue for miscellaneous
  // Keeping these for backward compatibility
  'Arts': { bg: '#E8667F', text: '#ffffff', lighter: '#F9DFE4' }, // Same as Music, Arts, & Performing Arts
  'Community Service': { bg: '#55B2B2', text: '#000000', lighter: '#DAF0F0' }, // Same as Community Service & Leadership
  'Technology': { bg: '#5C7CE0', text: '#ffffff', lighter: '#DEE4F8' }, // Softer bright blue for technology
  'Performing Arts': { bg: '#BC6ABC', text: '#ffffff', lighter: '#F2DEF2' } // Muted magenta for performing arts
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
  'Team-based': { bg: '#607D8B', text: '#ffffff', lighter: '#dfe5e8' },
  'Public Speaking': { bg: '#009688', text: '#ffffff', lighter: '#ccece8' },
  'Performance': { bg: '#673AB7', text: '#ffffff', lighter: '#e1d8f2' },
  'Volunteering': { bg: '#FFC107', text: '#000000', lighter: '#fff2cc' }
};

// Function to get color for activity type
const getActivityColor = (activityType: string | undefined): { bg: string, text: string, lighter: string } => {
  if (!activityType || !(activityType in ACTIVITY_COLORS)) {
    return { bg: '#4361EE', text: '#ffffff', lighter: '#d7ddfb' }; // Default
  }
  return ACTIVITY_COLORS[activityType];
};

// Function to get activity count for a specific activity type (case insensitive)
const getActivityTypeCount = (type: string, websites: ClubSite[]): number => {
  return websites.filter(website => {
    // Check in the new activityTypes array (case-insensitive)
    if (website.activityTypes && website.activityTypes.length > 0) {
      return website.activityTypes.some(activityType => 
        activityType.toLowerCase() === type.toLowerCase()
      );
    }
    // Fall back to legacy activityType (case-insensitive)
    return website.activityType?.toLowerCase() === type.toLowerCase();
  }).length;
};

// Function to capitalize first letter of each word in a string
const capitalizeWords = (str: string): string => {
  return str.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Website Card Component
const WebsiteCard = ({ website }: { website: ClubSite }) => {
  // Use category color instead of theme color
  const [showAllMeetings, setShowAllMeetings] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { user, userRole } = useAuth();
  
  // Get category and activity colors
  const categoryColor = getCategoryColor(website.category);
  const activityColor = getActivityColor(website.activityType);
  
  // Helper function to determine if there are multiple meeting days
  const hasMultipleMeetingDays = (): boolean => {
    if (!website.meetingInfo) return false;
    return website.meetingInfo.includes('|');
  };

  // Function to get the meeting frequency
  const getMeetingFrequency = (): string => {
    if (!website.meetingInfo) return '';
    
    if (website.meetingInfo.toLowerCase().includes('biweekly') || 
        website.meetingInfo.toLowerCase().includes('bi-weekly') || 
        website.meetingInfo.toLowerCase().includes('bi weekly')) {
      return 'Bi-weekly';
    } else if (website.meetingInfo.toLowerCase().includes('monthly')) {
      return 'Monthly';
    } else if (website.meetingInfo.toLowerCase().includes('weekly')) {
      return 'Weekly';
    }
    
    return '';
  };

  // Function to get a brief preview of meeting info
  const getMeetingPreview = (): string => {
    if (!website.meetingInfo) return 'TBD';
    
    // If it doesn't have multiple days, show as is but remove frequency tags
    if (!hasMultipleMeetingDays()) {
      return website.meetingInfo
        .replace(/\s*\(?(weekly|biweekly|bi-weekly|bi weekly|monthly)\)?/i, '')
        .trim();
    }
    
    // If it has multiple days, show a clear summary
    const dayCount = website.meetingInfo.split('|').length;
    const firstDay = website.meetingInfo.split('|')[0]
      .replace(/\s*\(?(weekly|biweekly|bi-weekly|bi weekly|monthly)\)?/i, '')
      .trim();
      
    return `${firstDay} + ${dayCount-1} more`;
  };

  // Check if user has already joined this club
  const hasJoined = website.interestForm?.submissions?.some(
    submission => submission.email === user?.email
  );

  // Handle join club functionality
  const handleJoinClub = async () => {
    if (!user?.email || isJoining) return;
    
    try {
      setIsJoining(true);
      
      const response = await fetch('/api/submit-interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteId: website.id,
          name: user.displayName || user.email,
          email: user.email,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          toast.error('You have already joined this club');
        } else {
          toast.error('Failed to join club');
        }
        return;
      }

      toast.success('Successfully joined club!');
      // Force a page reload to update the UI
      window.location.reload();
    } catch (error) {
      console.error('Error joining club:', error);
      toast.error('Failed to join club');
    } finally {
      setIsJoining(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full"
    >
      {/* Colored Header Bar with Club Name - now using category color */}
      <div 
        className="py-6 px-5 flex items-center justify-center"
        style={{ backgroundColor: categoryColor.bg }}
      >
        <h2 className="text-2xl font-bold text-white text-center">
          {website.clubName}
        </h2>
      </div>
      
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div className="space-y-4">
          {/* Category and Activity Type Pills */}
          <div className="flex flex-wrap gap-2">
            {website.category && (
              <span 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                style={{ 
                  backgroundColor: categoryColor.lighter, 
                  color: categoryColor.bg 
                }}
              >
                {website.category}
              </span>
            )}
            {/* Display activity types from the activityTypes array */}
            {website.activityTypes && website.activityTypes.length > 0 ? (
              website.activityTypes.map((type, index) => {
                // Capitalize the activity type for display
                const displayType = capitalizeWords(type);
                return (
                  <span 
                    key={`activity-${index}`}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize" 
                    style={{ 
                      backgroundColor: getActivityColor(displayType).lighter, 
                      color: getActivityColor(displayType).bg
                    }}
                  >
                    {displayType}
                  </span>
                );
              })
            ) : (
              // Fall back to legacy activityType if no array exists
              website.activityType && (
                <span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                  style={{ 
                    backgroundColor: activityColor.lighter, 
                    color: activityColor.bg
                  }}
                >
                  {website.activityType}
                </span>
              )
            )}
          </div>
          
          {/* Club info list */}
          <div className="space-y-3.5 py-2">
            {/* Meetings */}
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
                      <div className="flex flex-col">
                        {/* Badge showing frequency and number of meetings */}
                        <div className="flex items-center mb-1">
                          {getMeetingFrequency() && (
                            <span 
                              className="inline-flex mr-2 items-center px-1.5 py-0.5 rounded text-xs font-medium"
                              style={{ 
                                backgroundColor: "#38BFA1", 
                                color: "white" 
                              }}
                            >
                              {getMeetingFrequency()}
                            </span>
                          )}
                          <button
                            onClick={() => setShowAllMeetings(!showAllMeetings)}
                            className="text-xs text-gray-600 flex items-center hover:text-[#38BFA1]"
                          >
                            {showAllMeetings ? 'Hide details' : 'More details'}
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className={`h-3 w-3 ml-1 transition-transform ${showAllMeetings ? "rotate-180" : ""}`} 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Compact preview of all meeting times */}
                        <div className="text-sm">
                          {website.meetingInfo?.split('|').map((meetingDay, index) => (
                            <div key={index} className="font-medium text-gray-900">
                              <span className="text-xs text-[#38BFA1] mr-1">Day {index + 1}:</span>
                              {meetingDay.trim().replace(/\s*\(?(weekly|biweekly|bi-weekly|bi weekly|monthly)\)?/i, '').trim()}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Dropdown */}
                      {showAllMeetings && (
                        <div className="absolute left-0 md:right-0 md:left-auto mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 overflow-hidden">
                          {/* Compact frequency header */}
                          {getMeetingFrequency() && (
                            <div className="bg-[#38BFA1]/10 py-2 px-3 border-b border-gray-100 flex items-center">
                              <span className="text-xs font-medium text-[#38BFA1] rounded-full bg-[#38BFA1]/20 px-2 py-0.5">
                                {getMeetingFrequency()}
                              </span>
                            </div>
                          )}
                          
                          {/* Compact meeting times list */}
                          <div className="py-2 px-3">
                            {website.meetingInfo?.split('|').map((meetingDay, index) => (
                              <div key={index} className="text-sm text-gray-800 py-1.5 flex items-start">
                                <span className="font-semibold mr-2 min-w-[45px] text-[#38BFA1]">Day {index + 1}:</span>
                                <span className="break-normal">{meetingDay.trim().replace(/\s*\(?(weekly|biweekly|bi-weekly|bi weekly|monthly)\)?/i, '').trim()}</span>
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
            
            {/* Contact Email */}
            {website.jamboreeMeetingInfo?.email && (
              <div className="flex items-center">
                <div className="w-6 h-6 flex-shrink-0 mr-2 text-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex items-baseline">
                  <span className="text-gray-900 mr-2">Contact:</span>
                  <a href={`mailto:${website.jamboreeMeetingInfo.email}`} className="font-medium text-blue-600 hover:underline">
                    {website.jamboreeMeetingInfo.email}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <hr className="border-t border-gray-200 my-3" />
        
        <div className="flex justify-between items-center px-5 pb-4">
          <span className="text-xs text-gray-800">
            Updated {new Date(website.updatedAt).toLocaleDateString()}
          </span>
          <div className="flex gap-2">
            {user && (userRole === 'student' || userRole === 'captain') && (
              <button
                onClick={handleJoinClub}
                disabled={isJoining || hasJoined}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  hasJoined
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'bg-[#38BFA1] text-white hover:bg-[#2DA891]'
                }`}
              >
                {isJoining ? 'Joining...' : hasJoined ? 'Joined' : 'Join Club'}
              </button>
            )}
            <a
              href={`/${website.slug}`}
              className="inline-flex items-center px-5 py-2 text-sm font-medium text-white rounded-lg"
              style={{ backgroundColor: categoryColor.bg }}
            >
              Visit Site
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Jamboree() {
  const router = useRouter();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clubWebsites, setClubWebsites] = useState<ClubSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clubName, setClubName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedActivityType, setSelectedActivityType] = useState<string | null>(null);
  // Default to grid; removing view toggles
  const [viewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'az'>('recent');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Get unique categories and activity types from websites
  const categories = clubWebsites.reduce((acc: string[], website) => {
    if (website.category && !acc.includes(website.category)) {
      acc.push(website.category);
    }
    return acc;
  }, []).sort();

  const activityTypes = clubWebsites.reduce((acc: string[], website) => {
    // First check the new activityTypes array
    if (website.activityTypes && website.activityTypes.length > 0) {
      website.activityTypes.forEach(type => {
        // Convert to lowercase for comparison to avoid duplicates with different cases
        const lowerType = type.toLowerCase();
        if (!acc.some(t => t.toLowerCase() === lowerType)) {
          // Store with first letter capitalized
          acc.push(capitalizeWords(type));
        }
      });
    } 
    // Fall back to legacy activityType if no array exists
    else if (website.activityType && typeof website.activityType === 'string' && 
             !acc.some(t => t.toLowerCase() === website.activityType!.toLowerCase())) {
      acc.push(website.activityType);
    }
    return acc;
  }, []).sort();

  // Filter and sort websites
  const filteredWebsites = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = clubWebsites.filter(website => {
      const matchesSearch =
        q.length === 0 ||
        website.clubName.toLowerCase().includes(q) ||
        (website.slogan ? website.slogan.toLowerCase().includes(q) : false) ||
        (website.description ? website.description.toLowerCase().includes(q) : false) ||
        (website.members ? website.members.some(member =>
          member.name.toLowerCase().includes(q) ||
          member.role.toLowerCase().includes(q)
        ) : false);

      const matchesCategory = !selectedCategory || website.category === selectedCategory;

      const matchesActivityType = !selectedActivityType ||
        (Array.isArray(website.activityTypes) && website.activityTypes.some(type =>
          type.toLowerCase() === selectedActivityType.toLowerCase()
        )) ||
        (website.activityType !== undefined && typeof website.activityType === 'string' &&
         website.activityType.toLowerCase() === selectedActivityType.toLowerCase());

      return matchesSearch && matchesCategory && matchesActivityType;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'az') return a.clubName.localeCompare(b.clubName);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return sorted;
  }, [clubWebsites, searchQuery, selectedCategory, selectedActivityType, sortBy]);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        if (!user) {
          setLoading(false);
          return;
        }

        // Check user role
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserRole(userData?.role || null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    const fetchClubWebsites = async () => {
      try {
        // Get all club websites
        const websitesQuery = query(
          collection(db, 'clubSites'),
          orderBy('updatedAt', 'desc')
        );
        
        const websitesSnapshot = await getDocs(websitesQuery);
        const websites: ClubSite[] = [];

        websitesSnapshot.forEach((doc) => {
          const data = doc.data();
          websites.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)
          } as ClubSite);
        });

        // Sort websites: first by category, then by updated date
        const sortedWebsites = websites.sort((a, b) => {
          // Define category priority order (higher priority categories come first)
          const categoryOrder = [
            'STEM', 
            'Business', 
            'Academic',
            'Music, Arts, & Performing Arts',
            'Medical',
            'Technology',
            'Sports',
            'Community Service & Leadership',
            'Humanities',
            'Language & Culture',
            'Arts',
            'Performing Arts',
            'Community Service',
            'Miscellaneous'
          ];
          
          // Get position in priority list (if not found, put at end)
          const getCategoryPriority = (category: string | undefined) => {
            if (!category) return Number.MAX_SAFE_INTEGER; // Undefined categories go last
            const index = categoryOrder.indexOf(category);
            return index === -1 ? Number.MAX_SAFE_INTEGER - 1 : index;
          };
          
          // Sort by category priority first
          const aPriority = getCategoryPriority(a.category);
          const bPriority = getCategoryPriority(b.category);
          
          // If priorities differ, sort by priority
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          // If same category, sort by update date (most recent first)
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        setClubWebsites(sortedWebsites);
      } catch (error) {
        console.error('Error fetching club websites:', error);
        toast.error('Failed to load club websites');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
    fetchClubWebsites();
  }, [user]);

  const handleCreateWebsite = () => {
    if (!user) {
      toast.error('You must be logged in to create a club website');
      return;
    }

    if (!clubName.trim()) {
      setError('Please enter a club name');
      return;
    }

    try {
      // Create a slug from the club name
      const slug = clubName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Check if slug already exists
      const existingWebsite = clubWebsites.find(
        (website) => website.slug === slug
      );

      if (existingWebsite) {
        setError('A website with this name already exists');
        return;
      }

      // Navigate to the new club website page with the slug and name
      router.push(`/${slug}?new=true&name=${encodeURIComponent(clubName)}`);
    } catch (error) {
      console.error('Error creating club website:', error);
      toast.error('Failed to create club website');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-16 px-4 bg-gray-50">

        {/* Small page header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-2">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#180D39]">Club Listings</h1>
          </div>
        </div>

        {/* Condensed header: search + filters + create */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative col-span-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-[#180D39]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clubs, slogans, members..."
                className="w-full pl-9 pr-3 py-2 text-[#180D39] placeholder-[#180D39]/60 bg-white rounded-lg border border-[#38BFA1]/20 focus:outline-none focus:border-[#38BFA1] focus:ring-1 focus:ring-[#38BFA1]"
              />
            </div>
            {(userRole === 'admin' || userRole === 'captain' || userRole === 'sponsor') && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg text-white bg-gradient-to-r from-[#38BFA1] to-[#2DA891] hover:from-[#2DA891] hover:to-[#38BFA1]"
              >
                <PlusIcon className="h-5 w-5 mr-2" /> Create New Website
              </button>
            )}
          </div>

          <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="text-base font-medium text-gray-600">Category:</span>
                <div className="relative">
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="appearance-none block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none sm:text-sm rounded-md"
                    style={{
                      borderColor: selectedCategory ? getCategoryColor(selectedCategory).bg : '#d1d5db',
                      boxShadow: selectedCategory ? `0 0 0 1px ${getCategoryColor(selectedCategory).bg}` : 'none'
                    }}
                  >
                    <option value="">All</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category} ({clubWebsites.filter(w => w.category === category).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {activityTypes.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-base font-medium text-gray-600">Activity:</span>
                  <div className="relative">
                    <select
                      value={selectedActivityType || ''}
                      onChange={(e) => setSelectedActivityType(e.target.value || null)}
                      className="appearance-none block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none sm:text-sm rounded-md"
                    >
                      <option value="">All</option>
                      {activityTypes.map((type) => (
                        <option key={type} value={type}>
                          {capitalizeWords(type)} ({getActivityTypeCount(type, clubWebsites)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            {(selectedCategory || selectedActivityType) && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center">
                <div className="text-base text-gray-600 mr-3">Active filters:</div>
                <div className="flex gap-3">
                  {selectedCategory && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                      {selectedCategory}
                      <button onClick={() => setSelectedCategory(null)} className="ml-2 hover:opacity-80">✕</button>
                    </span>
                  )}
                  {selectedActivityType && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                      {capitalizeWords(selectedActivityType)}
                      <button onClick={() => setSelectedActivityType(null)} className="ml-2 hover:opacity-80">✕</button>
                    </span>
                  )}
                  <button onClick={() => { setSelectedCategory(null); setSelectedActivityType(null); }} className="text-sm text-gray-500 hover:text-gray-700 underline">Clear all</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Website Grid + Controls */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredWebsites.length > 0 ? (
            <div className="space-y-6">
              {/* Top controls: sort */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {filteredWebsites.length} club{filteredWebsites.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'recent' | 'az')}
                    className="px-3 py-1.5 rounded-md bg-white border border-gray-300 text-sm"
                    title="Sort by"
                  >
                    <option value="recent">Recently updated</option>
                    <option value="az">A → Z</option>
                  </select>
                </div>
              </div>
              {/* If filters are applied or searching, show filtered results */}
              {(selectedCategory || selectedActivityType || searchQuery) ? (
                <div>
                  {/* Custom heading for filtered results */}
                  {(selectedCategory || selectedActivityType) && (
                    <div className="flex items-center mb-6">
                      <h2 className="text-3xl font-bold text-gray-900">
                        {selectedCategory && selectedActivityType ? 
                          `${selectedCategory} + ${selectedActivityType}` : 
                          selectedCategory || selectedActivityType}
                      </h2>
                      <span className="ml-3 bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-full">
                        {filteredWebsites.length} club{filteredWebsites.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredWebsites.map((website) => (
                        <WebsiteCard key={website.id} website={website} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="divide-y divide-gray-200">
                        {filteredWebsites.map(site => (
                          <div key={site.id} className="flex flex-col md:flex-row md:items-center gap-3 p-3 hover:bg-gray-50">
                            <div className="md:w-2/5">
                              <div className="font-medium text-gray-900">{site.clubName}</div>
                              <div className="text-sm text-gray-500 line-clamp-1">{site.slogan || site.description || '—'}</div>
                            </div>
                            <div className="md:w-1/5 text-sm">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: getCategoryColor(site.category).lighter, color: getCategoryColor(site.category).bg }}>{site.category || 'Uncategorized'}</span>
                            </div>
                            <div className="md:w-1/5 hidden md:block text-sm text-gray-600">{site.meetingInfo ? site.meetingInfo.split('|')[0].replace(/\s*\(?(weekly|biweekly|bi-weekly|bi weekly|monthly)\)?/i, '').trim() : 'TBD'}</div>
                            <div className="md:w-1/5 ml-auto flex items-center gap-2">
                              <a href={`/${site.slug}`} className="px-3 py-1.5 text-xs font-medium text-white rounded-md" style={{ backgroundColor: getCategoryColor(site.category).bg }}>Visit</a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Otherwise, group by category */
                <>
                  {categories.map(category => {
                    const categoryWebsites = clubWebsites.filter(w => w.category === category);
                    if (categoryWebsites.length === 0) return null;
                    
                    return (
                      <div key={category} className="space-y-3">
                        <button
                          onClick={() => setCollapsedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                          className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300"
                        >
                          <div className="flex items-center gap-2">
                            {collapsedCategories[category] ? (
                              <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                            )}
                            <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
                            <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                              {categoryWebsites.length} club{categoryWebsites.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </button>
                        {!collapsedCategories[category] && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryWebsites.map((website) => (
                              <WebsiteCard key={website.id} website={website} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Uncategorized websites */}
                  {clubWebsites.filter(w => !w.category).length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center mb-2">
                        <h2 className="text-3xl font-bold text-gray-900">Uncategorized</h2>
                        <span className="ml-3 bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-full">
                          {clubWebsites.filter(w => !w.category).length} club{clubWebsites.filter(w => !w.category).length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clubWebsites.filter(w => !w.category).map((website) => (
                          <WebsiteCard key={website.id} website={website} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                {searchQuery ? 'No matching clubs found' : 'No Club Websites Yet'}
              </h3>
              <p className="text-gray-500 mb-8">
                {searchQuery ? 'Try adjusting your search terms' : 'Be the first to create a website for your club!'}
              </p>
              {(userRole === 'admin' || userRole === 'captain' || userRole === 'sponsor') && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-[#38BFA1] to-[#2DA891] hover:from-[#2DA891] hover:to-[#38BFA1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38BFA1] transform hover:scale-105 transition-all"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create New Website
                </button>
              )}
            </div>
          )}
        </div>

        {/* Create Website Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl">
              <div className="p-6 border-b border-[#38BFA1]/10">
                <h2 className="text-2xl font-bold text-[#180D39]">Create New Club Website</h2>
                <p className="text-[#180D39] mt-2">
                  Enter your club name to create a new website. You&apos;ll be able to customize it after creation.
                </p>
              </div>
              
              <div className="p-6">
                <label className="block text-[#180D39] font-medium mb-2">
                  Club Name
                </label>
                <input
                  type="text"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="w-full px-4 py-3 text-[#180D39] bg-white rounded-xl border border-[#38BFA1]/20 focus:outline-none focus:border-[#38BFA1] focus:ring-1 focus:ring-[#38BFA1]"
                  placeholder="Enter club name"
                />
                {error && (
                  <p className="mt-2 text-red-600 text-sm">{error}</p>
                )}
              </div>

              <div className="p-6 border-t border-[#38BFA1]/10 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setClubName('');
                    setError(null);
                  }}
                  className="px-6 py-2 text-[#180D39] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateWebsite}
                  disabled={!clubName.trim()}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    clubName.trim() 
                      ? 'bg-[#38BFA1] text-white hover:bg-[#2A8E9E]' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Create Website
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
} 