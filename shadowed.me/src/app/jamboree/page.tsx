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
          </div>
        </div>

        {/* Website Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredWebsites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredWebsites.map((website) => (
                <motion.div
                  key={website.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full"
                >
                  <div 
                    className="h-40 bg-cover bg-center relative" 
                    style={{ 
                      backgroundColor: getColorById(website.theme?.primaryColor || 'blue').value,
                      backgroundImage: website.bannerImage ? `url(${website.bannerImage})` : undefined
                    }}
                  >
                    {!website.bannerImage && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <h2 className="text-3xl font-bold text-white px-4 text-center">
                          {website.clubName}
                        </h2>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {website.clubName}
                      </h3>
                      <p className="text-gray-600 mb-2 line-clamp-2">
                        {website.slogan || website.description?.substring(0, 100) || 'No description available.'}
                      </p>
                      {website.members?.find(m => m.role.toLowerCase().includes('captain')) && (
                        <p className="text-sm text-gray-500 mb-2">
                          Captain: {website.members.find(m => m.role.toLowerCase().includes('captain'))?.name}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-500">
                        Updated {new Date(website.updatedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => router.push(`/${website.slug}`)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#38BFA1] hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38BFA1]"
                      >
                        Visit Site
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
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