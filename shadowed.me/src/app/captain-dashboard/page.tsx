'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, where, or } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { GlobeAltIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

interface Club {
  id: string;
  name: string;
  category: string;
  sponsorEmail: string;
  description?: string;
  captain?: string;
  captains?: string[];
  slug?: string;
}

export default function CaptainDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [captainClubs, setCaptainClubs] = useState<Club[]>([]);
  const [clubsExpanded, setClubsExpanded] = useState(true);

  const fetchCaptainClubs = useCallback(async () => {
    try {
      if (!user?.email) return;
      
      const clubsRef = collection(db, 'clubs');
      
      // Create a query that matches either captain field or where user's email is in captains array
      const captainQuery = query(clubsRef, 
        or(
          where('captain', '==', user.email),
          where('captains', 'array-contains', user.email)
        )
      );
      
      const querySnapshot = await getDocs(captainQuery);
      
      const clubs = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          // Create a proper slug from the club name if not already present
          // This handles parentheses and special characters properly
          const slug = data.slug || data.name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          
          return {
            id: doc.id,
            ...data,
            slug: slug // Ensure we have the slug consistently formatted
          } as Club;
        })
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      setCaptainClubs(clubs);
    } catch (err) {
      console.error('Error fetching captain clubs:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCaptainClubs();
    } else {
      setLoading(false);
    }
  }, [user, fetchCaptainClubs]);

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
              Sign in to manage your club website
            </p>
            <button
              onClick={() => document.querySelector<HTMLButtonElement>('[data-login-button]')?.click()}
              className="bg-[#38BFA1] text-white px-8 py-3 rounded-lg hover:bg-[#2DA891] transition-colors inline-flex items-center gap-2"
            >
              <span>Sign In</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#0A2540]">Captain Dashboard</h1>
        </div>

        <div className="space-y-8">
          {/* Manage My Club Section */}
          <div>
            <button 
              onClick={() => setClubsExpanded(!clubsExpanded)}
              className="w-full flex justify-between items-center bg-gray-100 p-4 rounded-lg mb-4 hover:bg-gray-200 transition-colors"
            >
              <h2 className="text-xl font-semibold text-[#0A2540] flex items-center">
                Manage My Club
                <span className="ml-2 bg-[#38BFA1] text-white text-sm px-2 py-0.5 rounded-full">
                  {captainClubs.length}
                </span>
              </h2>
              {clubsExpanded ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {clubsExpanded && (
              <div className="space-y-4 animate-fadeIn">
                {captainClubs.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">You are not currently assigned as a captain to any clubs.</p>
                  </div>
                ) : (
                  captainClubs.map((club) => {
                    return (
                      <div 
                        key={club.id} 
                        className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all relative"
                      >
                        <div className="flex items-start gap-6">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-[#0A2540] mb-2">{club.name}</h3>
                            <p className="text-gray-600 mb-4 line-clamp-2">{club.description || 'No description available.'}</p>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Category</p>
                                <p className="font-medium text-[#38BFA1]">{club.category}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Sponsor</p>
                                <p className="font-medium">{club.sponsorEmail || 'Not assigned'}</p>
                              </div>
                            </div>
                            
                            <div className="mt-6 flex gap-3">
                              <Link 
                                href={`/${club.slug}`}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center gap-2"
                              >
                                <GlobeAltIcon className="h-4 w-4" />
                                <span>View Website</span>
                              </Link>
                              <Link 
                                href={`/${club.slug}?edit=true`}
                                className="bg-[#38BFA1] text-white px-4 py-2 rounded-lg hover:bg-[#2DA891] transition-colors inline-flex items-center gap-2"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                                <span>Edit Website</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 