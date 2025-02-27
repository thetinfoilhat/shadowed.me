'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClubListing, CLUB_CATEGORIES } from '@/models/ClubListing';
import ClubListingCard from '@/components/ClubListingCard';

export default function ClubsPage() {
  const [listings, setListings] = useState<ClubListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<ClubListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError('');
      
      try {
        const q = query(
          collection(db, 'clubListings'),
          where('status', '==', 'approved'),
          where('isActive', '==', true),
          orderBy('name')
        );
        
        const querySnapshot = await getDocs(q);
        const clubListings: ClubListing[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<ClubListing, 'id'>;
          clubListings.push({
            ...data,
            id: doc.id
          } as ClubListing);
        });
        
        setListings(clubListings);
        setFilteredListings(clubListings);
      } catch (error) {
        console.error('Error fetching club listings:', error);
        setError('Failed to load club listings. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchListings();
  }, []);
  
  useEffect(() => {
    // Filter listings based on search term and category
    let filtered = [...listings];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(listing => 
        listing.name.toLowerCase().includes(term) || 
        listing.description.toLowerCase().includes(term) ||
        (listing.tags && listing.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(listing => listing.category === selectedCategory);
    }
    
    setFilteredListings(filtered);
  }, [searchTerm, selectedCategory, listings]);
  
  const handleApply = (listingId: string) => {
    // This would typically open a modal or navigate to an application page
    console.log(`Apply to club: ${listingId}`);
    alert('Application feature coming soon!');
  };
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-3xl font-bold text-[#0A2540] mb-8">Explore Clubs</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <label htmlFor="search" className="sr-only">Search clubs</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                placeholder="Search by name, description, or tags"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8E9E]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="category" className="sr-only">Filter by category</label>
            <select
              id="category"
              className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A8E9E]"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CLUB_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#38BFA1] border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading club listings...</p>
        </div>
      ) : (
        <div>
          {filteredListings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <p className="text-gray-500">No club listings found matching your criteria.</p>
              {(searchTerm || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                  }}
                  className="mt-4 px-4 py-2 text-[#2A8E9E] hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">Showing {filteredListings.length} club{filteredListings.length !== 1 ? 's' : ''}</p>
              
              <div className="space-y-6">
                {filteredListings.map(listing => (
                  <ClubListingCard
                    key={listing.id}
                    listing={listing}
                    onApply={handleApply}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 