'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageTransition from '@/components/PageTransition';
import { toast } from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { ClubSite } from '@/types/club';

// Category color mapping
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

// Website Card Component
const WebsiteCard = ({ website }: { website: ClubSite }) => {
  // Use category color instead of theme color
  const [showAllMeetings, setShowAllMeetings] = useState(false);
  
  // Get category and activity colors
  const categoryColor = getCategoryColor(website.category);
  const activityColor = getActivityColor(website.activityType);
  
  // Helper function to determine if there are multiple meeting days
  const hasMultipleMeetingDays = (): boolean => {
    if (!website.meetingInfo) return false;
    return website.meetingInfo.includes('|');
  };

  // Function to get a brief preview of meeting info
  const getMeetingPreview = (): string => {
    if (!website.meetingInfo) return 'TBD';
    
    // If it doesn't have multiple days, show as is
    if (!hasMultipleMeetingDays()) {
      return website.meetingInfo;
    }
    
    // If it has multiple days, just show the first day
    const firstDay = website.meetingInfo.split('|')[0].trim();
    return `${firstDay}...`;
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
            {website.activityType && (
              <span 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                style={{ 
                  backgroundColor: activityColor.lighter, 
                  color: activityColor.bg
                }}
              >
                {website.activityType}
              </span>
            )}
          </div>
          
          {/* Club info list */}
          <div className="space-y-3.5 py-2">
            {/* Jamboree Table */}
            {website.jamboreeMeetingInfo?.table && (
              <div className="flex items-center">
                <div className="w-6 h-6 flex-shrink-0 mr-2 text-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex items-baseline">
                  <span className="text-gray-900 mr-2">Jamboree Table:</span>
                  <span className="font-medium text-gray-900">{website.jamboreeMeetingInfo?.table || 'TBD'}</span>
                </div>
              </div>
            )}
            
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
                          {website.meetingInfo && (website.meetingInfo.includes('weekly') || 
                                               website.meetingInfo.includes('monthly') || 
                                               website.meetingInfo.includes('biweekly')) && (
                            <div className="mb-2 pb-2 border-b border-gray-100">
                              <span className="text-sm font-medium text-gray-700">
                                Frequency: <span className="font-bold text-[#38BFA1]">
                                  {website.meetingInfo.includes('weekly') ? 'Weekly' : 
                                   website.meetingInfo.includes('monthly') ? 'Monthly' : 
                                   website.meetingInfo.includes('biweekly') ? 'Biweekly' : ''}
                                </span>
                              </span>
                            </div>
                          )}
                          <div className="py-1 space-y-2">
                            {website.meetingInfo?.split('|').map((meetingDay, index) => (
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
          <a
            href={`/${website.slug}`}
            className="inline-flex items-center px-5 py-2 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: categoryColor.bg }}
          >
            Visit Site
          </a>
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

  // Get unique categories and activity types from websites
  const categories = clubWebsites.reduce((acc: string[], website) => {
    if (website.category && !acc.includes(website.category)) {
      acc.push(website.category);
    }
    return acc;
  }, []).sort();

  const activityTypes = clubWebsites.reduce((acc: string[], website) => {
    if (website.activityType && !acc.includes(website.activityType)) {
      acc.push(website.activityType);
    }
    return acc;
  }, []).sort();

  // Filter websites based on search query, selected category, and activity type
  const filteredWebsites = clubWebsites.filter(website => {
    // Filter by search query
    const matchesSearch = 
      website.clubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      website.slogan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      website.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      website.members?.some(member => 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Filter by selected category
    const matchesCategory = !selectedCategory || website.category === selectedCategory;
    
    // Filter by selected activity type
    const matchesActivityType = !selectedActivityType || website.activityType === selectedActivityType;
    
    return matchesSearch && matchesCategory && matchesActivityType;
  });

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
          // First sort by category
          if (a.category && b.category) {
            return a.category.localeCompare(b.category);
          } else if (a.category) {
            return -1; // a has category, b doesn't
          } else if (b.category) {
            return 1; // b has category, a doesn't
          }
          
          // Then by update date (most recent first)
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

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-6xl font-bold text-[#180D39] text-center mb-6"
            >
              Club Showcase
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[#180D39] text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
            >
              Explore club websites or create your own to showcase your club&apos;s activities,
              members, and resources.
            </motion.p>

            <div className="relative max-w-2xl mx-auto mt-8">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-[#180D39]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find your next club..."
                className="w-full pl-12 pr-4 py-3 text-[#180D39] placeholder-[#180D39]/60 bg-white rounded-xl border border-[#38BFA1]/20 focus:outline-none focus:border-[#38BFA1] focus:ring-1 focus:ring-[#38BFA1]"
              />
            </div>

            {(userRole === 'admin' || userRole === 'captain' || userRole === 'sponsor') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-6"
              >
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#38BFA1] hover:bg-[#2DA891] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38BFA1] transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create New Website
                </button>
              </motion.div>
            )}
            
            {/* Filters Section */}
            {(categories.length > 0 || activityTypes.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-8"
              >
                <div className="max-w-4xl mx-auto px-6 py-4 bg-white rounded-xl shadow-sm">
                  <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                    {/* Category Filter - With custom styling */}
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
                            <option 
                              key={category} 
                              value={category}
                              style={{
                                backgroundColor: CATEGORY_COLORS[category]?.lighter || '#f9fafb',
                                color: CATEGORY_COLORS[category]?.bg || '#000000'
                              }}
                            >
                              {category} ({clubWebsites.filter(w => w.category === category).length})
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 101.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Activity Type Filter - With custom styling */}
                    {activityTypes.length > 0 && (
                      <div className="flex items-center gap-3">
                        <span className="text-base font-medium text-gray-600">Activity:</span>
                        <div className="relative">
                          <select
                            value={selectedActivityType || ''}
                            onChange={(e) => setSelectedActivityType(e.target.value || null)}
                            className="appearance-none block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none sm:text-sm rounded-md"
                            style={{
                              borderColor: selectedActivityType ? getActivityColor(selectedActivityType).bg : '#d1d5db',
                              boxShadow: selectedActivityType ? `0 0 0 1px ${getActivityColor(selectedActivityType).bg}` : 'none'
                            }}
                          >
                            <option value="">All</option>
                            {activityTypes.map((type) => (
                              <option 
                                key={type} 
                                value={type}
                                style={{
                                  backgroundColor: ACTIVITY_COLORS[type]?.lighter || '#f9fafb',
                                  color: ACTIVITY_COLORS[type]?.bg || '#000000'
                                }}
                              >
                                {type} ({clubWebsites.filter(w => w.activityType === type).length})
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 101.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Active filters display with category and activity colors */}
                  {(selectedCategory || selectedActivityType) && (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-center">
                      <div className="text-base text-gray-600 mr-3">Active filters:</div>
                      <div className="flex gap-3">
                        {selectedCategory && (
                          <span 
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm" 
                            style={{ 
                              backgroundColor: getCategoryColor(selectedCategory).lighter,
                              color: getCategoryColor(selectedCategory).bg 
                            }}
                          >
                            {selectedCategory}
                            <button 
                              onClick={() => setSelectedCategory(null)}
                              className="ml-2 hover:opacity-80"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </span>
                        )}
                        {selectedActivityType && (
                          <span 
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm" 
                            style={{ 
                              backgroundColor: getActivityColor(selectedActivityType).lighter,
                              color: getActivityColor(selectedActivityType).bg 
                            }}
                          >
                            {selectedActivityType}
                            <button 
                              onClick={() => setSelectedActivityType(null)}
                              className="ml-2 hover:opacity-80"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </span>
                        )}
                        {(selectedCategory || selectedActivityType) && (
                          <button 
                            onClick={() => {
                              setSelectedCategory(null);
                              setSelectedActivityType(null);
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Website Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredWebsites.length > 0 ? (
            <div className="space-y-12">
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWebsites.map((website) => (
                      <WebsiteCard key={website.id} website={website} />
                    ))}
                  </div>
                </div>
              ) : (
                /* Otherwise, group by category */
                <>
                  {categories.map(category => {
                    const categoryWebsites = clubWebsites.filter(w => w.category === category);
                    if (categoryWebsites.length === 0) return null;
                    
                    return (
                      <div key={category} className="space-y-4">
                        <div className="flex items-center mb-2">
                          <h2 className="text-3xl font-bold text-gray-900">{category}</h2>
                          <span className="ml-3 bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-full">
                            {categoryWebsites.length} club{categoryWebsites.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {categoryWebsites.map((website) => (
                            <WebsiteCard key={website.id} website={website} />
                          ))}
                        </div>
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