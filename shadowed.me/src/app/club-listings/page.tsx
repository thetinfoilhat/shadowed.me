'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { ClubListing } from '@/types/club';
import ClubCard from '@/components/ClubCard';
import ClubDetailsDialog from '@/components/ClubDetailsDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, XMarkIcon, ClockIcon, TrophyIcon } from '@heroicons/react/24/outline';

// Enhanced categories for filtering
const CATEGORIES = ['STEM', 'Business', 'Arts', 'Performing Arts', 'Language & Culture', 'Community Service', 'Humanities', 'Medical', 'Sports', 'Technology', 'Academic', 'Miscellaneous', 'All'] as const;

// Common sense attributes for filtering
const ATTRIBUTES = ['Competitive', 'Leadership', 'Tryout', 'Public Speaking', 'Performance'] as const;

// Get category color function
const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    'STEM': '#4285F4',
    'Business': '#34A853',
    'Arts': '#FBBC05',
    'Performing Arts': '#EA4335',
    'Language & Culture': '#8E44AD',
    'Community Service': '#3498DB',
    'Humanities': '#E67E22',
    'Medical': '#1ABC9C',
    'Sports': '#2ECC71',
    'Technology': '#9B59B6',
    'Academic': '#F1C40F',
    'Miscellaneous': '#95A5A6'
  };
  
  return colorMap[category] || '#38BFA1'; // Default to theme color
};

// Generate a gradient based on category color
const getCategoryGradient = (category: string): string => {
  const baseColor = getCategoryColor(category);
  return `linear-gradient(135deg, ${baseColor}, ${baseColor}dd)`;
};

// Sample clubs to add if none are found
const SAMPLE_CLUBS = [
  {
    name: 'Physics Club',
    description: 'Explore the fundamental laws of the universe through experiments and discussions.',
    category: 'STEM',
    mission: 'To foster a love for physics and scientific inquiry among students.',
    meetingTimes: 'Tuesdays, 3:30 PM - 5:00 PM',
    contactInfo: 'physics@school.edu',
    attributes: ['Weekly', 'Open Membership', 'Year-round', 'Research', 'Analytical'],
    status: 'approved',
    createdAt: new Date(),
    bgColor: getCategoryColor('STEM'),
    bgGradient: getCategoryGradient('STEM')
  },
  {
    name: 'Debate Team',
    description: 'Develop critical thinking and public speaking skills through competitive debate.',
    category: 'Humanities',
    mission: 'To empower students with effective communication and argumentation skills.',
    meetingTimes: 'Mondays and Wednesdays, 4:00 PM - 6:00 PM',
    contactInfo: 'debate@school.edu',
    attributes: ['Competitive', 'Weekly', 'Tryout/Audition', 'Public Speaking', 'Critical Thinking'],
    status: 'approved',
    createdAt: new Date(),
    bgColor: getCategoryColor('Humanities'),
    bgGradient: getCategoryGradient('Humanities')
  },
  {
    name: 'Art Collective',
    description: 'Express yourself through various art forms and collaborate on creative projects.',
    category: 'Arts',
    mission: 'To provide a space for artistic expression and creative collaboration.',
    meetingTimes: 'Fridays, 3:00 PM - 5:30 PM',
    contactInfo: 'art@school.edu',
    attributes: ['Weekly', 'Open Membership', 'Year-round', 'Creative', 'Expressive'],
    status: 'approved',
    createdAt: new Date(),
    bgColor: getCategoryColor('Arts'),
    bgGradient: getCategoryGradient('Arts')
  }
];

// Function to add sample clubs to Firebase
const addSampleClubs = async () => {
  try {
    console.log('Adding sample clubs to Firebase...');
    const clubsRef = collection(db, 'clubs');
    
    for (const club of SAMPLE_CLUBS) {
      await addDoc(clubsRef, club);
      console.log(`Added sample club: ${club.name}`);
    }
    
    toast.success('Sample clubs added successfully');
    return true;
  } catch (error) {
    console.error('Error adding sample clubs:', error);
    toast.error('Failed to add sample clubs');
    return false;
  }
};

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
      
      // Fetch clubs from Firebase 'clubs' collection
      const clubsRef = collection(db, 'clubs');
      const querySnapshot = await getDocs(clubsRef);
      
      console.log(`Found ${querySnapshot.docs.length} clubs in Firebase`);
      
      // If no clubs are found, add sample clubs
      if (querySnapshot.docs.length === 0) {
        console.log('No clubs found, adding sample clubs...');
        const success = await addSampleClubs();
        if (success) {
          // Fetch clubs again after adding samples
          const newQuerySnapshot = await getDocs(clubsRef);
          const clubsData = newQuerySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || '',
              description: data.description || '',
              category: data.category || '',
              captain: data.captain || '',
              sponsorEmail: data.sponsorEmail || '',
              mission: data.mission || '',
              meetingTimes: data.meetingTimes || '',
              contactInfo: data.contactInfo || '',
              status: data.status || 'approved',
              attributes: data.attributes || [],
              image: data.image || `https://source.unsplash.com/random/300x200/?${encodeURIComponent(data.category || 'club')}`,
              createdAt: data.createdAt?.toDate() || new Date(),
              bgColor: data.bgColor,
              bgGradient: data.bgGradient
            } as ClubListing;
          });
          
          setClubs(clubsData);
          setLoading(false);
          return;
        }
      }
      
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
          meetingTimes: data.meetingTimes || '',
          contactInfo: data.contactInfo || '',
          status: data.status || 'approved', // Default to approved
          attributes: data.attributes || [],
          image: data.image || `https://source.unsplash.com/random/300x200/?${encodeURIComponent(data.category || 'club')}`,
          createdAt: data.createdAt?.toDate() || new Date(),
          bgColor: data.bgColor,
          bgGradient: data.bgGradient
        } as ClubListing;
      });
      
      setClubs(clubsData);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Failed to load clubs');
      setClubs([]);
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
      .filter(club => selectedCategory === 'All' || club.category === selectedCategory)
      .filter(club => {
        if (selectedAttributes.length === 0) return true;
        
        // Check if any of the selected attributes match the club's attributes
        return selectedAttributes.every(attr => 
          club.attributes?.includes(attr)
        );
      })
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
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all ${
                showFilters 
                  ? 'bg-[#38BFA1] text-white shadow-md' 
                  : 'bg-[#38BFA1]/10 text-[#38BFA1] hover:bg-[#38BFA1]/20 border border-[#38BFA1]/20'
              }`}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              <span className="font-medium">Filters</span>
              {(selectedCategory !== 'All' || selectedAttributes.length > 0 || searchQuery) && (
                <span className={`ml-1 ${showFilters ? 'bg-white text-[#38BFA1]' : 'bg-[#38BFA1] text-white'} text-xs rounded-full w-5 h-5 flex items-center justify-center`}>
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
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4 animate-fadeIn shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-semibold text-[#0A2540] text-lg">Filters</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm font-medium text-[#38BFA1] hover:text-[#2DA891] flex items-center"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Reset all
                </button>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedCategory === 'All'
                        ? 'bg-[#38BFA1] text-white shadow-sm'
                        : 'bg-[#38BFA1]/10 text-[#38BFA1] hover:bg-[#38BFA1]/20'
                    }`}
                  >
                    All
                  </button>
                  {CATEGORIES.filter(c => c !== 'All').map((category) => {
                    const categoryColor = getCategoryColor(category);
                    const isSelected = selectedCategory === category;
                    
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className="transition-colors"
                      >
                        <span 
                          className="block"
                          style={{
                            backgroundColor: isSelected ? categoryColor : `${categoryColor}20`,
                            color: isSelected ? 'white' : categoryColor,
                            boxShadow: isSelected ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            lineHeight: '1.25rem'
                          }}
                        >
                          {category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Activity Type</h4>
                <div className="flex flex-wrap gap-2">
                  {ATTRIBUTES.map((attribute) => (
                    <button
                      key={attribute}
                      onClick={() => toggleAttribute(attribute)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedAttributes.includes(attribute)
                          ? attribute === 'Competitive' 
                            ? 'bg-amber-500 text-white shadow-sm' 
                            : 'bg-[#38BFA1] text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {attribute === 'Competitive' && (
                        <TrophyIcon className="h-3.5 w-3.5 inline-block mr-1" />
                      )}
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
            {filteredClubs.map((club) => {
              const categoryColor = getCategoryColor(club.category);
              const isCompetitive = club.attributes?.includes('Competitive');
              return (
                <div 
                  key={club.id}
                  onClick={() => setSelectedClub(club)}
                  className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: categoryColor }} />
                  {isCompetitive && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-amber-500 text-white p-1 rounded-full shadow-sm" title="Competitive">
                        <TrophyIcon className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  <div className="w-full sm:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0 relative flex flex-col items-center justify-center bg-gray-50 border border-gray-100">
                    <span className="text-xl font-bold" style={{ color: categoryColor }}>{club.name.split(' ')[0]}</span>
                    <span 
                      className="text-sm mt-1 px-2 py-0.5 rounded-full"
                      style={{ 
                        backgroundColor: `${categoryColor}20`, // 20% opacity
                        color: categoryColor 
                      }}
                    >
                      {club.category}
                    </span>
                  </div>
                  <div className="flex-1 pl-2">
                    <h3 className="text-lg font-semibold text-[#0A2540]">{club.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{club.description}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <ClockIcon className="h-3 w-3 mr-1" style={{ color: categoryColor }} />
                      {club.meetingTimes}
                    </div>
                  </div>
                </div>
              );
            })}
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

        {/* Club Details Dialog */}
        {selectedClub && (
          <ClubDetailsDialog
            club={selectedClub}
            isOpen={!!selectedClub}
            onCloseAction={() => setSelectedClub(null)}
          />
        )}
      </div>
    </div>
  );
} 
