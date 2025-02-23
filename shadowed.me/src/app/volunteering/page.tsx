'use client';
import { useState } from 'react';

const CATEGORIES = ['All', 'Education', 'Environment', 'Healthcare', 'Social Services', 'Animal Welfare'] as const;

type Opportunity = {
  title: string;
  category: typeof CATEGORIES[number];
  description: string;
  organization: string;
  location: string;
  commitment: string;
  impact: string;
  spots: number;
};

const OPPORTUNITIES: Opportunity[] = [
  {
    title: "Local Food Bank Assistant",
    category: "Social Services",
    description: "Help sort and distribute food to those in need in our community",
    organization: "Naperville Food Bank",
    location: "Downtown Naperville",
    commitment: "2-4 hours weekly",
    impact: "Food Security",
    spots: 5
  },
  {
    title: "Animal Shelter Helper",
    category: "Animal Welfare",
    description: "Care for animals and assist with adoption events",
    organization: "Naperville Animal Shelter",
    location: "South Naperville",
    commitment: "3-6 hours weekly",
    impact: "Animal Care",
    spots: 3
  },
  // Add more opportunities...
];

export default function Volunteering() {
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOpportunities = OPPORTUNITIES.filter(opp => {
    const matchesCategory = selectedCategory === 'All' || opp.category === selectedCategory;
    const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         opp.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="px-8 py-12 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#4A3C2D] mb-4">Volunteer Opportunities</h1>
        <p className="text-[#725A44] text-lg">
          Make a difference in your community through meaningful volunteer work
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search opportunities..."
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

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOpportunities.map((opp) => (
          <div key={opp.title} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-[#4A3C2D]">{opp.title}</h3>
                <span className="inline-block mt-1 px-3 py-1 bg-[#F3EDE7] text-[#725A44] text-sm rounded-full">
                  {opp.category}
                </span>
              </div>
              <span className="px-3 py-1 bg-[#F3EDE7] text-[#725A44] text-sm rounded-full">
                {opp.spots} spots left
              </span>
            </div>
            
            <p className="text-[#725A44] mb-4">{opp.description}</p>
            
            <div className="space-y-2 text-sm text-[#725A44] mb-6">
              <div className="flex items-center gap-2">
                <span>🏢</span>
                <span>{opp.organization}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>{opp.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🕒</span>
                <span>{opp.commitment}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💫</span>
                <span>Impact: {opp.impact}</span>
              </div>
            </div>

            <button className="w-full px-4 py-2 bg-[#725A44] text-white rounded-md hover:bg-[#8B6D54] transition-colors">
              Sign Up to Volunteer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 