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
import { ClockIcon, UserIcon, BuildingLibraryIcon, AtSymbolIcon, TrophyIcon } from "@heroicons/react/20/solid";
import { motion } from 'framer-motion';
import { ClubSite } from '@/types/club';
import { getColorById } from '@/utils/colors';
import Link from 'next/link';

// Get category color function
const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    'STEM': '#4361EE', // Brighter blue
    'Business': '#3A0CA3', // Rich purple
    'Arts': '#F72585', // Vibrant pink
    'Performing Arts': '#FF0054', // Bright red
    'Language & Culture': '#E5446D', // Vibrant rose/pink
    'Community Service': '#4CC9F0', // Bright cyan
    'Humanities': '#F77F00', // Bright orange
    'Medical': '#06D6A0', // Bright teal
    'Sports': '#D90429', // Bright red
    'Technology': '#7B2CBF', // Deep purple
    'Academic': '#FFD60A', // Bright yellow
    'Miscellaneous': '#4895EF' // Bright blue
  };
  
  return colorMap[category] || '#4361EE'; // Default to bright blue
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

  // Filter websites based on search query
  const filteredWebsites = clubWebsites.filter(website => 
    website.clubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    website.slogan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    website.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    website.members?.some(member => 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

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

        setClubWebsites(websites);
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

  // Get activity type - for now we'll add a placeholder
  const getActivityType = (website: ClubSite): string => {
    // If the website has activity types defined, use the first one or join them
    if (website.activityTypes && website.activityTypes.length > 0) {
      return website.activityTypes[0]; // Show first activity type as primary
    }

    // Sample activity types as fallback
    const activityTypes = [
      "Academic Competition", 
      "Performance", 
      "Community Service", 
      "Competitive", 
      "Cultural Exchange",
      "Discussion Group",
      "Interest Group"
    ];
    
    // For now, randomly select an activity type based on club ID to maintain consistency
    const index = website.id.length % activityTypes.length;
    return activityTypes[index];
  };

  // Format the meeting info with days, room, and table
  const formatMeetingInfo = (website: ClubSite) => {
    if (!website.meetingInfo) return null;

    const { frequency, days, room, jamboreeTable } = website.meetingInfo;
    
    // Create a string of days only, separated by commas
    const meetingDaysOnly = days?.map(day => day.day).join(', ') || '';

    return (
      <div className="text-sm text-black space-y-1">
        {frequency && (
          <div>
            <span className="font-medium">Frequency:</span>{' '}
            <span className="capitalize">{frequency}</span>
          </div>
        )}
        {days && days.length > 0 && (
          <div>
            <span className="font-medium">Meetings:</span>{' '}
            {meetingDaysOnly}
          </div>
        )}
        {room && (
          <div>
            <span className="font-medium">Room:</span> {room}
          </div>
        )}
        {jamboreeTable && (
          <div>
            <span className="font-medium">Jamboree Table:</span> {jamboreeTable}
          </div>
        )}
      </div>
    );
  };

  // Helper function to render club card - moved from external JSX
  const renderClubCard = (website: ClubSite) => {
    // Get category and color
    const category = website.category || website.description?.split(' ')[0] || 'Miscellaneous';
    const categoryColor = getCategoryColor(category);
    const activityType = getActivityType(website);
    
    // Get meeting info
    const meetingFrequency = website.meetingInfo?.frequency || 'Weekly';
    const meetingDays = website.meetingInfo?.days?.map(d => d.day).join(', ') || 'TBD';
    const meetingRoom = website.meetingInfo?.room || 'TBD';
    const jamboreeTable = website.meetingInfo?.jamboreeTable || 'TBD';
    
    // Get contact info
    const captains = website.members?.filter(m => 
      m.role.toLowerCase().includes('captain') || 
      m.role.toLowerCase().includes('president') ||
      m.role.toLowerCase().includes('leader')
    ) || [];
    
    const captainNames = captains.map(c => c.name).join(', ');
    const sponsorEmail = website.contactLinks?.find(c => 
      c.label.toLowerCase().includes('sponsor') && c.type === 'email'
    )?.url || 'sponsor@school.edu';
    
    const captainEmail = website.contactLinks?.find(c => 
      c.label.toLowerCase().includes('captain') && c.type === 'email'
    )?.url || 'captain@school.edu';
    
    const sponsors = website.members?.filter(m => 
      m.role.toLowerCase().includes('sponsor')
    ) || [];
    
    const sponsorName = sponsors.length > 0 ? sponsors[0].name : 'Sponsor';
    
    return (
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black mb-2">
            {website.clubName}
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {/* Category badge */}
            <span 
              className="text-xs font-medium px-2.5 py-1.5 rounded-full text-white"
              style={{ 
                background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)`,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}
            >
              {category}
            </span>
            
            {/* Activity Type badge */}
            <span className="text-xs bg-blue-50 text-black px-2.5 py-1.5 rounded-full font-medium shadow-sm">
              {activityType}
            </span>
          </div>
          
          {/* Divider line */}
          <hr className="my-3 border-gray-200" />
          
          {/* Club details */}
          <div className="space-y-2 text-sm">
            {/* Jamboree Table */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2 mt-1">
                <BuildingLibraryIcon className="h-4 w-4 text-black" />
              </div>
              <div>
                <span className="font-medium text-black">Jamboree Table:</span> {jamboreeTable}
              </div>
            </div>
            
            {/* Meeting Times */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2 mt-1">
                <ClockIcon className="h-4 w-4 text-black" />
              </div>
              <div>
                <span className="font-medium text-black">Meetings:</span> {meetingFrequency} on {meetingDays}
              </div>
            </div>
            
            {/* Room */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2 mt-1">
                <BuildingLibraryIcon className="h-4 w-4 text-black" />
              </div>
              <div>
                <span className="font-medium text-black">Room:</span> {meetingRoom}
              </div>
            </div>
            
            {/* Captains */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2 mt-1">
                <UserIcon className="h-4 w-4 text-black" />
              </div>
              <div>
                <span className="font-medium text-black">Captains:</span> {captainNames || 'TBD'}
              </div>
            </div>
            
            {/* Sponsor */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2 mt-1">
                <UserIcon className="h-4 w-4 text-black" />
              </div>
              <div>
                <span className="font-medium text-black">Sponsor:</span> {sponsorName}
              </div>
            </div>
            
            {/* Sponsor Email */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2 mt-1">
                <AtSymbolIcon className="h-4 w-4 text-black" />
              </div>
              <div className="break-all">
                <span className="font-medium text-black">@ Sponsor:</span> {sponsorEmail}
              </div>
            </div>
            
            {/* Captain Email */}
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-2 mt-1">
                <AtSymbolIcon className="h-4 w-4 text-black" />
              </div>
              <div className="break-all">
                <span className="font-medium text-black">@ Captain:</span> {captainEmail}
              </div>
            </div>
          </div>
        </div>
        
        {/* Updated time at bottom */}
        <div className="mt-4 text-xs text-black">
          Updated {new Date(website.updatedAt).toLocaleDateString()}
        </div>
      </div>
    );
  };

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-16 px-4 bg-blue-50">
        {/* Navigation Tabs */}
        <div className="flex justify-center gap-4 mb-12">
          <Link
            href="/jamboree"
            className="px-6 py-2 rounded-lg font-medium transition-colors bg-[#38BFA1] text-white"
          >
            Websites
          </Link>
          <Link
            href="/club-listings"
            className="px-6 py-2 rounded-lg font-medium transition-colors bg-white text-[#000000] hover:bg-blue-50"
          >
            All Clubs
          </Link>
        </div>

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-6xl font-bold text-[#000000] text-center mb-6"
            >
              Club Showcase
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[#000000] text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
            >
              Explore clubs and find activities you&apos;re passionate about. Get information about meeting times, contacts, and resources.
            </motion.p>

            <div className="relative max-w-2xl mx-auto mt-8">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-[#000000]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find your next club..."
                className="w-full pl-12 pr-4 py-3 text-[#000000] placeholder-[#000000]/60 bg-white rounded-xl border border-[#38BFA1]/20 focus:outline-none focus:border-[#38BFA1] focus:ring-1 focus:ring-[#38BFA1]"
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
          </div>
        </div>

        {/* Club Grid - Redesigned cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredWebsites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredWebsites.map((website) => {
                // Get category and color
                const category = website.category || website.description?.split(' ')[0] || 'Miscellaneous';
                const categoryColor = getCategoryColor(category);
                
                return (
                  <motion.div
                    key={website.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full cursor-pointer"
                    onClick={() => router.push(`/${website.slug}`)}
                  >
                    {/* Top colored bar - similar to club listings */}
                    <div 
                      className="h-2" 
                      style={{ backgroundColor: categoryColor }}
                    />
                    
                    {renderClubCard(website)}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-xl font-medium text-black mb-2">
                {searchQuery ? 'No matching clubs found' : 'No Club Websites Yet'}
              </h3>
              <p className="text-black mb-8">
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
                <h2 className="text-2xl font-bold text-[#000000]">Create New Club Website</h2>
                <p className="text-[#000000] mt-2">
                  Enter your club name to create a new website. You&apos;ll be able to customize it after creation.
                </p>
              </div>
              
              <div className="p-6">
                <label className="block text-[#000000] font-medium mb-2">
                  Club Name
                </label>
                <input
                  type="text"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="w-full px-4 py-3 text-[#000000] bg-white rounded-xl border border-[#38BFA1]/20 focus:outline-none focus:border-[#38BFA1] focus:ring-1 focus:ring-[#38BFA1]"
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
                  className="px-6 py-2 text-[#000000] hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateWebsite}
                  disabled={!clubName.trim()}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    clubName.trim() 
                      ? 'bg-[#38BFA1] text-white hover:bg-[#2A8E9E]' 
                      : 'bg-blue-50 text-black cursor-not-allowed'
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