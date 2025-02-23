'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const CATEGORIES = ['All', 'STEM', 'Business', 'Humanities', 'Medical', 'Community Service', 'Arts'] as const;

type Club = {
  id: string;
  captain: string;
  category: string;
  createdAt: Date;
  date: string;
  description: string;
  endTime: string;
  name: string;
  school: string;
  startTime: string;
  time: string;
};

export default function SchoolClubs() {
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const clubsRef = collection(db, 'opportunities');
        const querySnapshot = await getDocs(clubsRef);
        
        const clubsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            captain: data.captain || '',
            category: data.category || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            date: data.date || '',
            description: data.description || '',
            endTime: data.endTime || '',
            name: data.name || '',
            school: data.school || '',
            startTime: data.startTime || '',
            time: data.time || ''
          };
        });
        
        setClubs(clubsData);
      } catch (err) {
        console.error('Error fetching clubs:', err);
        setError('Failed to load clubs');
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  const filteredClubs = clubs.filter(club => {
    const matchesCategory = selectedCategory === 'All' || 
                          club.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         club.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="px-8 py-12 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#4A3C2D] mb-4">High School Club Visits</h1>
        <p className="text-[#725A44] text-lg">
          Experience high school clubs firsthand and find your passion
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search clubs..."
            className="w-full px-4 py-3 rounded-lg border border-[#E2D9D0] focus:outline-none focus:ring-2 focus:ring-[#725A44]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute right-4 top-3.5 text-[#725A44]">🔍</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-[#725A44] text-white'
                  : 'bg-[#F3EDE7] text-[#725A44] hover:bg-[#E2D9D0]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-[#725A44]">Loading clubs...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {!loading && !error && filteredClubs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#725A44]">No clubs found</p>
        </div>
      )}

      {/* Club Cards Grid */}
      {!loading && !error && filteredClubs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => (
            <div key={club.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#4A3C2D]">{club.name}</h3>
                  <span className="inline-block mt-1 px-3 py-1 bg-[#F3EDE7] text-[#725A44] text-sm rounded-full">
                    {club.category}
                  </span>
                </div>
              </div>
              
              <p className="text-[#725A44] mb-4">{club.description}</p>
              
              <div className="space-y-2 text-sm text-[#725A44] mb-6">
                <div className="flex items-center gap-2">
                  <span>👤</span>
                  <span>Captain: {club.captain}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🏫</span>
                  <span>{club.school}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>{club.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🕒</span>
                  <span>{club.time}</span>
                </div>
              </div>

              <button className="w-full px-4 py-2 bg-[#725A44] text-white rounded-md hover:bg-[#8B6D54] transition-colors">
                Register to Visit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 