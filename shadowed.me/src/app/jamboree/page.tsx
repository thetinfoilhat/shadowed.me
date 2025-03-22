'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { slugify } from '@/utils/stringUtils';
import LoadingSpinner from '@/components/LoadingSpinner';

// Define interface for club website data
interface ClubWebsite {
  id: string;
  clubName: string;
  slug: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  bannerImage?: string;
  slogan?: string;
}

export default function Jamboree() {
  const { user } = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clubWebsites, setClubWebsites] = useState<ClubWebsite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.uid) {
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  // Fetch club websites
  useEffect(() => {
    const fetchClubWebsites = async () => {
      try {
        const websitesRef = collection(db, 'clubWebsites');
        const websitesQuery = query(websitesRef, orderBy('clubName', 'asc'));
        const querySnapshot = await getDocs(websitesQuery);
        
        const websites: ClubWebsite[] = [];
        
        querySnapshot.docs.forEach(doc => {
          const data = doc.data();
          websites.push({
            id: doc.id,
            clubName: data.clubName,
            slug: data.slug,
            createdBy: data.createdBy,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            bannerImage: data.bannerImage,
            slogan: data.slogan
          });
        });
        
        setClubWebsites(websites);
      } catch (error) {
        console.error('Error fetching club websites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubWebsites();
  }, []);

  const handleCreateClubWebsite = async () => {
    if (!newClubName.trim()) {
      setError('Please enter a club name');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Generate a slug from club name
      const slug = slugify(newClubName);
      
      // Check if a site with this slug already exists
      const existingWebsites = clubWebsites.filter(site => site.slug === slug);
      
      if (existingWebsites.length > 0) {
        setError('A website for this club already exists');
        setIsSubmitting(false);
        return;
      }
      
      // Close modal and navigate to the club website builder
      setIsModalOpen(false);
      router.push(`/${slug}?edit=true&new=true&name=${encodeURIComponent(newClubName)}`);
    } catch (error) {
      console.error('Error creating club website:', error);
      setError('Failed to create club website. Please try again.');
      setIsSubmitting(false);
    }
  };

  const canCreateWebsite = userRole === 'admin' || userRole === 'captain' || userRole === 'sponsor';

  return (
    <PageTransition>
      <div className="pt-[100px] min-h-screen bg-[#FAFAFA]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-16 py-12 md:py-16">
          {/* Hero Section */}
          <motion.div 
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] leading-[1.15] mb-6 text-[#180D39]">
              Jamboree: <span className="font-bold">Club Sites</span>
            </h1>
            
            <p className="text-lg md:text-xl text-[#180D39]/70 mb-8 max-w-3xl">
              Create and explore custom-built websites by your school&apos;s clubs.
            </p>

            {canCreateWebsite && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-[#38BFA1] to-[#2A8E9E] text-white px-6 py-3 rounded-full text-lg font-medium flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Club Website
              </button>
            )}
          </motion.div>

          {/* Club Websites Grid */}
          <div className="mb-24">
            <h2 className="text-2xl font-bold text-[#180D39] mb-8">Club Websites</h2>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <LoadingSpinner size="lg" />
              </div>
            ) : clubWebsites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubWebsites.map((website) => (
                  <motion.div
                    key={website.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div 
                      className="h-48 bg-gradient-to-r from-blue-500 to-purple-500 relative"
                      style={{
                        backgroundImage: website.bannerImage ? `url(${website.bannerImage})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="absolute inset-0 bg-black/30 flex items-end">
                        <div className="p-4 text-white">
                          <h3 className="text-xl font-bold truncate">{website.clubName}</h3>
                          {website.slogan && (
                            <p className="text-sm opacity-90 mt-1 line-clamp-2">{website.slogan}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Updated {new Date(website.updatedAt).toLocaleDateString()}
                      </div>
                      <Link 
                        href={`/${website.slug}`}
                        className="bg-[#38BFA1] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2DA891] transition-colors"
                      >
                        Visit Site
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                <div className="mb-4 text-5xl">🎪</div>
                <h3 className="text-xl font-semibold text-[#180D39] mb-2">No Club Websites Yet</h3>
                <p className="text-[#180D39]/70 max-w-md mx-auto">
                  {canCreateWebsite 
                    ? 'Be the first to create a beautiful website for your club.' 
                    : 'Club websites will appear here once they are created by club captains or sponsors.'}
                </p>
              </div>
            )}
          </div>

          {/* Create Club Website Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <h2 className="text-2xl font-bold text-[#0A2540] mb-6">Create Club Website</h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Club Name
                  </label>
                  <input
                    type="text"
                    value={newClubName}
                    onChange={(e) => setNewClubName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                    placeholder="Enter club name"
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>
                
                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mr-4 px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateClubWebsite}
                    disabled={isSubmitting || !newClubName.trim()}
                    className="px-4 py-2 bg-[#38BFA1] text-white font-medium rounded-lg hover:bg-[#2DA891] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Website'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
} 