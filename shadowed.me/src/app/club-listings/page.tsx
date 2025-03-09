'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { ClubListing } from '@/types/club';
import ClubCard from '@/components/ClubCard';
import ClubDetailsDialog from '@/components/ClubDetailsDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { generateClubListings } from '@/data/clubData';

// Enhanced categories and attributes for filtering
const CATEGORIES = ['STEM', 'Business', 'Arts', 'Performing Arts', 'Language & Culture', 'Community Service', 'Humanities', 'Medical', 'Sports', 'Technology', 'Academic', 'Miscellaneous', 'All'] as const;

const ATTRIBUTES = [
  'Competitive', 
  'Teamwork', 
  'Public Speaking', 
  'Hands-on', 
  'Leadership', 
  'Creative', 
  'Research',
  'Entrepreneurship',
  'Networking',
  'Weekly',
  'Monthly',
  'Bi-weekly',
  'Open Membership',
  'Application Required',
  'Tryout/Audition',
  'Year-round',
  'Seasonal'
] as const;

// Use the generated club listings instead of placeholder data
const PLACEHOLDER_CLUBS = generateClubListings();

export default function ClubListings() {
  const {} = useAuth(); // Not using any auth properties
  const [clubs, setClubs] = useState<ClubListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState<ClubListing | null>(null);
  
  // Enhanced filtering state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchClubs = useCallback(async () => {
    try {
      setLoading(true);
      
      // In development, use the generated club data
      if (process.env.NODE_ENV === 'development') {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setClubs(PLACEHOLDER_CLUBS);
        setLoading(false);
        return;
      }
      
      // In production, fetch from Firebase
      // Fetch from the opportunities collection (same as school-clubs page)
      const clubsRef = collection(db, 'opportunities');
      const querySnapshot = await getDocs(clubsRef);
      
      const clubsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          category: data.category || '',
          captain: data.captain || '',
          sponsorEmail: data.sponsorEmail || '',
          mission: data.mission || '',
          meetingTimes: `${data.startTime || ''} - ${data.endTime || ''}`,
          contactInfo: data.contactEmail || '',
          status: data.status || 'pending',
          attributes: data.categories || [],
          image: data.image || `https://source.unsplash.com/random/300x200/?${encodeURIComponent(data.category || 'club')}`,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }).filter(club => club.status === 'approved'); // Only show approved clubs
      
      setClubs(clubsData);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Failed to load clubs');
      // Fallback to placeholder data in case of error
      setClubs(PLACEHOLDER_CLUBS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  // Handle attribute selection
  const toggleAttribute = (attribute: string) => {
    setSelectedAttributes(prev => 
      prev.includes(attribute)
        ? prev.filter(attr => attr !== attribute)
        : [...prev, attribute]
    );
  };

  // Apply all filters
  const filteredClubs = useMemo(() => {
    return clubs
      .filter(club => club.status === 'approved')
      .filter(club => 
        selectedCategory === 'All' || club.category === selectedCategory
      )
      .filter(club => 
        selectedAttributes.length === 0 || 
        selectedAttributes.some(attr => club.attributes?.includes(attr))
      )
      .filter(club => 
        searchQuery === '' || 
        club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        club.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [clubs, selectedCategory, selectedAttributes, searchQuery]);

  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedAttributes([]);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0A2540]">Club Listings</h1>
            <p className="text-gray-600 mt-1">Discover and join clubs that match your interests</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              <span>Filters</span>
              {(selectedCategory !== 'All' || selectedAttributes.length > 0 || searchQuery) && (
                <span className="ml-1 bg-[#38BFA1] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {(selectedCategory !== 'All' ? 1 : 0) + selectedAttributes.length + (searchQuery ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clubs by name or description..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-[#38BFA1] focus:border-[#38BFA1] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {showFilters && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-900">Filters</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-[#38BFA1] hover:text-[#2DA891]"
                >
                  Reset all
                </button>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedCategory === 'All'
                        ? 'bg-[#38BFA1] text-white'
                        : 'bg-[#38BFA1]/10 text-[#38BFA1] hover:bg-[#38BFA1]/20'
                    }`}
                  >
                    All
                  </button>
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedCategory === category
                          ? 'bg-[#38BFA1] text-white'
                          : 'bg-[#38BFA1]/10 text-[#38BFA1] hover:bg-[#38BFA1]/20'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Attributes</h4>
                <div className="flex flex-wrap gap-2">
                  {ATTRIBUTES.map((attribute) => (
                    <button
                      key={attribute}
                      onClick={() => toggleAttribute(attribute)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedAttributes.includes(attribute)
                          ? 'bg-[#38BFA1] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {attribute}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* View mode toggle and results count */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filteredClubs.length} {filteredClubs.length === 1 ? 'club' : 'clubs'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                aria-label="Grid view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                aria-label="List view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Club Cards */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                onClick={() => setSelectedClub(club)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClubs.map((club) => (
              <div 
                key={club.id}
                onClick={() => setSelectedClub(club)}
                className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="w-full sm:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0 relative">
                  <Image 
                    src={club.image || 'https://via.placeholder.com/300x200?text=No+Image'} 
                    alt={club.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 192px"
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#0A2540]">{club.name}</h3>
                  <p className="text-sm text-[#38BFA1] mb-2">{club.category}</p>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{club.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {club.attributes?.map((attribute, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {attribute}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredClubs.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 mb-2">No clubs found matching your filters</p>
            <button
              onClick={resetFilters}
              className="text-[#38BFA1] hover:text-[#2DA891] font-medium"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {selectedClub && (
        <ClubDetailsDialog
          club={selectedClub}
          isOpen={!!selectedClub}
          onCloseAction={() => setSelectedClub(null)}
        />
      )}
    </div>
  );
} 