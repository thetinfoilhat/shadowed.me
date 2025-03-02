'use client';
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { ClubListing } from '@/types/club';
import ClubCard from '@/components/ClubCard';
import ClubModal from '@/components/ClubModal';
import ClubDetailsDialog from '@/components/ClubDetailsDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const CATEGORIES = ['STEM', 'Business', 'Humanities', 'Medical', 'Community Service', 'Arts'] as const;

export default function ClubListings() {
  const { user, userRole } = useAuth();
  const [clubs, setClubs] = useState<ClubListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubListing | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const fetchClubs = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const clubsRef = collection(db, 'clubs');
      const querySnapshot = await getDocs(clubsRef);
      
      const clubsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClubListing[];
      
      setClubs(clubsData);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Failed to load clubs');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const filteredClubs = selectedCategory === 'All' 
    ? clubs 
    : clubs.filter(club => club.category === selectedCategory);

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#0A2540]">Club Listings</h1>
          {(userRole === 'admin' || userRole === 'captain' || userRole === 'sponsor') && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#38BFA1] text-white px-4 py-2 rounded-lg hover:bg-[#2DA891] transition-colors"
            >
              Create New Club
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
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
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-[#38BFA1] text-white'
                  : 'bg-[#38BFA1]/10 text-[#38BFA1] hover:bg-[#38BFA1]/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              onClick={() => setSelectedClub(club)}
            />
          ))}
        </div>

        {filteredClubs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No clubs found</p>
          </div>
        )}
      </div>

      <ClubModal
        isOpen={isCreateModalOpen}
        onCloseAction={() => setIsCreateModalOpen(false)}
        onSubmitAction={fetchClubs}
      />

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