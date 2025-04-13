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
import { getColorById } from '@/utils/colors';

// Website Card Component
const WebsiteCard = ({ website }: { website: ClubSite }) => {
  const primaryColor = getColorById(website.theme?.primaryColor || 'blue').value;
  const [showAllMeetings, setShowAllMeetings] = useState(false);
  
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
      {/* Colored Header Bar with Club Name */}
      <div 
        className="py-6 px-5 flex items-center justify-center"
        style={{ backgroundColor: primaryColor }}
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
                  backgroundColor: `${primaryColor}15`, 
                  color: primaryColor 
                }}
              >
                {website.category}
              </span>
            )}
            {website.activityType && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {website.activityType}
              </span>
            )}
          </div>
          
          {/* Club info list */}
          <div className="space-y-3.5 py-2">
            {/* Jamboree Table */}
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
                  <span className="font-medium text-gray-900">{getMeetingPreview()}</span>
                  
                  {/* Show expand/collapse button if there are multiple meeting days */}
                  {hasMultipleMeetingDays() && (
                    <button 
                      onClick={() => setShowAllMeetings(!showAllMeetings)}
                      className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
                      aria-label={showAllMeetings ? "Show less" : "Show all meeting times"}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 transition-transform ${showAllMeetings ? "rotate-180" : ""}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Expanded meeting times */}
              {hasMultipleMeetingDays() && showAllMeetings && (
                <div className="ml-8 mt-2 pl-4 border-l-2 border-gray-200">
                  {website.meetingInfo?.split('|').map((meetingDay, index) => (
                    <div key={index} className="mb-1 text-sm text-gray-800">
                      {meetingDay.trim()} 
                    </div>
                  ))}
                </div>
              )}
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
            style={{ backgroundColor: primaryColor }}
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
            
            {/* Category Filter Buttons */}
            {categories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-8"
              >
                <h3 className="text-center text-gray-700 mb-2 font-medium">Filter by Category</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      selectedCategory === null
                        ? 'bg-[#38BFA1] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Categories
                  </button>
                  
                  {categories.map((category) => {
                    // Count clubs in this category
                    const count = clubWebsites.filter(w => w.category === category).length;
                    
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          selectedCategory === category
                            ? 'bg-[#38BFA1] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category} ({count})
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
            
            {/* Activity Type Filter Buttons */}
            {activityTypes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-4"
              >
                <h3 className="text-center text-gray-700 mb-2 font-medium">Filter by Activity Type</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => setSelectedActivityType(null)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      selectedActivityType === null
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Activity Types
                  </button>
                  
                  {activityTypes.map((type) => {
                    // Count clubs with this activity type
                    const count = clubWebsites.filter(w => w.activityType === type).length;
                    
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedActivityType(type)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          selectedActivityType === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type} ({count})
                      </button>
                    );
                  })}
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