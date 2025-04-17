'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { ClubListing } from '@/types/club';
import ClubCard from '@/components/ClubCard';
import ClubDetailsDialog from '@/components/ClubDetailsDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  TrophyIcon,
} from "@heroicons/react/20/solid";
import { generatePlaceholderClubListings } from '@/data/clubData';

// Enhanced categories for filtering
const CATEGORIES = ['STEM', 'Humanities', 'Business', 'Music, Arts, & Performing Arts', 'Academic', 'Language & Culture', 'Medical', 'Sports', 'Community Service & Leadership', 'Miscellaneous', 'All'] as const;

// Common sense attributes for filtering
const ATTRIBUTES = ['Competitive', 'Leadership', 'Tryout', 'Public Speaking', 'Performance'] as const;

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

// Interface for Firestore data that might include a timestamp
interface FirestoreClubData extends Omit<ClubListing, 'createdAt'> {
  created?: boolean;
  createdAt?: Timestamp | Date;
}

// Define an extended ClubListing type to include 'created' property
interface ExtendedClubListing extends ClubListing {
  created?: boolean;
}

export default function ClubListings() {
  const {} = useAuth(); // Not using any auth properties
  const [clubs, setClubs] = useState<ExtendedClubListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState<ExtendedClubListing | null>(null);
  
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
      
      // Get placeholder clubs for comparison
      const placeholderClubs = generatePlaceholderClubListings();
      console.log(`Expected ${placeholderClubs.length} placeholder clubs`);
      console.log(`Found ${querySnapshot.docs.length} clubs in Firebase`);
      
      // Create a map to track unique clubs by name (to prevent duplicates)
      const uniqueClubsByName: Record<string, ExtendedClubListing> = {};
      
      // Process existing clubs from Firebase first
      querySnapshot.docs.forEach(doc => {
        const data = doc.data() as FirestoreClubData;
        if (!data.name) return; // Skip clubs without names
        
        const name = data.name.trim();
        const nameLower = name.toLowerCase();
        
        // Convert Firestore timestamp to Date object
        const createdAt = data.createdAt instanceof Timestamp 
          ? data.createdAt.toDate() 
          : (data.createdAt as Date) || new Date();
          
        // Create the club object
        const club: ExtendedClubListing = {
          ...data,
          id: doc.id,
          name: name,
          description: data.description || '',
          category: data.category || '',
          captain: data.captain || '',
          sponsorEmail: data.sponsorEmail || '',
          mission: data.mission || '',
          meetingTimes: data.meetingTimes || '',
          contactInfo: data.contactInfo || '',
          status: data.status || 'approved',
          attributes: data.attributes || [],
          roomNumber: data.roomNumber || '',
          image: data.image || `https://source.unsplash.com/random/300x200/?${encodeURIComponent(data.category || 'club')}`,
          createdAt,
          bgColor: data.bgColor,
          bgGradient: data.bgGradient,
          created: data.created || false
        };
        
        // Only add if this club name doesn't exist yet, or if this one is more complete
        if (!uniqueClubsByName[nameLower] || (club.created && !uniqueClubsByName[nameLower].created)) {
          uniqueClubsByName[nameLower] = club;
        }
      });
      
      // Track which clubs we already have in Firestore by name
      const existingClubNames = new Set(Object.keys(uniqueClubsByName).map(name => name.toLowerCase().trim()));
      let addedCount = 0;
      
      // Only add placeholders for clubs that don't exist yet
      for (const placeholderClub of placeholderClubs) {
        const clubNameLower = placeholderClub.name.toLowerCase().trim();
        
        // Only add placeholder if a club with this name doesn't already exist
        if (!existingClubNames.has(clubNameLower)) {
          try {
            const docRef = await addDoc(clubsRef, {
              ...placeholderClub,
              createdAt: new Date(),
              created: false  // Mark as placeholder
            });
            
            uniqueClubsByName[clubNameLower] = { 
              ...placeholderClub, 
              id: docRef.id
            };
            
            addedCount++;
            console.log(`Added placeholder club: ${placeholderClub.name}`);
          } catch (err) {
            console.error(`Error adding club ${placeholderClub.name}:`, err);
          }
        }
      }
      
      if (addedCount > 0) {
        console.log(`Added ${addedCount} new placeholder clubs to Firebase`);
      }
      
      // Convert the map to an array of unique clubs
      const clubs = Object.values(uniqueClubsByName);
      
      console.log(`Total unique clubs: ${clubs.length}`);
      console.log(`Placeholder clubs: ${clubs.filter(c => !c.created).length}`);
      console.log(`Fully created clubs: ${clubs.filter(c => c.created).length}`);
      
      // Sort clubs alphabetically by name
      clubs.sort((a, b) => a.name.localeCompare(b.name));
      
      setClubs(clubs);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Failed to load clubs');
      
      // Fall back to placeholder listings if Firebase fetch fails
      const placeholderClubs = generatePlaceholderClubListings();
      setClubs(placeholderClubs);
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
            <h1 className="text-3xl font-bold text-[#0A2540] bg-gradient-to-r from-[#4361EE] to-[#4CC9F0] inline-block text-transparent bg-clip-text">Club Listings</h1>
            <p className="text-gray-600 mt-1">Discover and join clubs that match your interests</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all ${
                showFilters 
                  ? 'bg-gradient-to-r from-[#38BFA1] to-[#4CC9F0] text-white shadow-lg' 
                  : 'bg-[#38BFA1]/10 text-[#38BFA1] hover:bg-[#38BFA1]/20 border border-[#38BFA1]/20'
              }`}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
              <span className="font-medium">Filters</span>
              {(selectedCategory !== 'All' || selectedAttributes.length > 0 || searchQuery) && (
                <span className={`ml-1 ${showFilters ? 'bg-white text-[#38BFA1]' : 'bg-[#38BFA1] text-white'} text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold`}>
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
              className="block w-full pl-10 pr-3 py-3 text-[#180D39] placeholder-[#180D39]/60 bg-white rounded-lg border border-[#38BFA1]/20 focus:ring-[#38BFA1] focus:border-[#38BFA1] focus:ring-1 transition-colors shadow-sm"
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
            <div className="bg-gradient-to-r from-slate-50 to-white rounded-lg border border-gray-200 p-6 mb-4 animate-fadeIn shadow-md">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-semibold text-[#0A2540] text-lg">Filters</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm font-medium bg-gradient-to-r from-[#4361EE] to-[#4CC9F0] bg-clip-text text-transparent hover:opacity-80 flex items-center"
                >
                  <XMarkIcon className="h-4 w-4 mr-1 text-[#4361EE]" />
                  Reset all
                </button>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === 'All'
                        ? 'bg-gradient-to-r from-[#4361EE] to-[#4CC9F0] text-white shadow-sm transform -translate-y-0.5'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
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
                        className="transition-all"
                      >
                        <span 
                          className="block text-sm font-medium px-3 py-1.5 rounded-full transition-all"
                          style={{
                            background: isSelected 
                              ? `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)` 
                              : '#f3f4f6',
                            color: isSelected ? 'white' : categoryColor,
                            boxShadow: isSelected ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none',
                            transform: isSelected ? 'translateY(-1px)' : 'none',
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
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedAttributes.includes(attribute)
                          ? attribute === 'Competitive' 
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-md transform -translate-y-0.5' 
                            : 'bg-gradient-to-r from-[#38BFA1] to-[#4CC9F0] text-white shadow-md transform -translate-y-0.5'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
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
              Showing <span className="font-semibold text-[#4361EE]">{filteredClubs.length}</span> {filteredClubs.length === 1 ? 'club' : 'clubs'}
              {/* Display count of clubs needing details */}
              {clubs.filter(club => !club.created).length > 0 && (
                <span className="ml-2 text-gray-500">
                  ({clubs.filter(club => !club.created).length} need details)
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-gray-100 shadow-inner text-[#4361EE]' : 'hover:bg-gray-50 text-gray-500'}`}
                aria-label="Grid view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-gray-100 shadow-inner text-[#4361EE]' : 'hover:bg-gray-50 text-gray-500'}`}
                aria-label="List view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Club listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClubs.map((club) => (
            <ClubCard 
              key={club.id} 
              club={club} 
              onClick={() => setSelectedClub(club)}
            />
          ))}
        </div>
      </div>

      {/* Club Details Dialog */}
      {selectedClub && (
        <ClubDetailsDialog
          club={selectedClub as ClubListing}
          isOpen={!!selectedClub}
          onCloseAction={() => setSelectedClub(null)}
        />
      )}
    </div>
  );
}