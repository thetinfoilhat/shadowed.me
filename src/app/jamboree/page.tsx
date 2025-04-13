'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageTransition from '@/components/PageTransition';
import { ClubSite } from '@/types/club';
import { PlusIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getColorById } from '@/utils/colors';

export default function Jamboree() {
  const router = useRouter();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clubWebsites, setClubWebsites] = useState<ClubSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredWebsites, setFilteredWebsites] = useState<ClubSite[]>([]);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const websitesRef = collection(db, 'clubSites');
        const websitesQuery = query(websitesRef, orderBy('updatedAt', 'desc'));
        const websitesSnapshot = await getDocs(websitesQuery);
        
        const websites = websitesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
          updatedAt: doc.data().updatedAt instanceof Timestamp ? doc.data().updatedAt.toDate() : new Date(doc.data().updatedAt)
        })) as ClubSite[];
        
        setClubWebsites(websites);
        setFilteredWebsites(websites);
      } catch (error) {
        console.error('Error fetching websites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWebsites();
  }, []);

  useEffect(() => {
    const filtered = clubWebsites.filter(website => 
      website.clubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      website.slogan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      website.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredWebsites(filtered);
  }, [searchQuery, clubWebsites]);

  // Format meeting info for display - only shows days
  const formatMeetingInfo = (website: ClubSite) => {
    if (!website.meetingInfo) return null;

    const { days, room, jamboreeTable } = website.meetingInfo;
    const meetingDays = days?.map(d => d.day).join(', ') || '';

    return (
      <div className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
        <div className="space-y-2">
          {room && (
            <div>
              <span className="font-medium">Room:</span> {room}
            </div>
          )}
          {jamboreeTable && (
            <div>
              <span className="font-medium">Table:</span> {jamboreeTable}
            </div>
          )}
          {days && days.length > 0 && (
            <div>
              <span className="font-medium">Meetings:</span> {meetingDays}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center mb-12">
            <h1 className="text-6xl font-bold text-[#000000] text-center mb-6">Club Showcase</h1>
            <p className="text-[#000000] text-lg md:text-xl max-w-3xl mx-auto text-center leading-relaxed">
              Explore club websites or create your own to showcase your club&apos;s activities,
              members, and resources.
            </p>
            <div className="w-full max-w-2xl mt-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Find your next club..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-transparent"
                />
              </div>
            </div>
            <Link
              href="/jamboree/new"
              className="mt-6 inline-flex items-center px-6 py-3 rounded-lg bg-[#38BFA1] text-white font-medium hover:bg-[#2DA891] transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Website
            </Link>
          </div>

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
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full cursor-pointer"
                  onClick={() => router.push(`/${website.slug}`)}
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
                      {website.meetingInfo && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                            {website.meetingInfo.room && (
                              <span className="font-medium">Room {website.meetingInfo.room}</span>
                            )}
                            {website.meetingInfo.jamboreeTable && (
                              <span className="font-medium">Table {website.meetingInfo.jamboreeTable}</span>
                            )}
                          </div>
                          <div className="flex justify-between">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => {
                              const isActiveDay = website.meetingInfo?.days?.some(
                                d => d.day.toLowerCase().startsWith(day.toLowerCase())
                              );
                              return (
                                <div
                                  key={day}
                                  className={`flex items-center justify-center w-10 h-10 rounded-lg text-xs font-medium ${
                                    isActiveDay
                                      ? 'bg-[#38BFA1]/10 border-2 border-[#38BFA1] text-[#38BFA1]'
                                      : 'bg-gray-50 text-gray-400'
                                  }`}
                                >
                                  {day}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-500">
                        Updated {new Date(website.updatedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${website.slug}`);
                        }}
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
              <p className="text-gray-500">No club websites found.</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
} 