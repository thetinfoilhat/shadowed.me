'use client';
import { motion } from 'framer-motion';
import { ClubListing } from '@/types/club';
import { CalendarIcon, ClockIcon, UserGroupIcon, UserIcon, TrophyIcon } from '@heroicons/react/24/outline';

interface ClubCardProps {
  club: ClubListing;
  onClick: () => void;
}

export default function ClubCard({ club, onClick }: ClubCardProps) {
  // Extract the first attribute of each type for display
  const membershipAttribute = club.attributes?.find(attr => 
    ['Open Membership', 'Application Required', 'Tryout/Audition'].includes(attr)
  );
  
  const scheduleAttribute = club.attributes?.find(attr => 
    ['Weekly', 'Monthly', 'Bi-weekly'].includes(attr)
  );
  
  // Check if club is competitive
  const isCompetitive = club.attributes?.includes('Competitive');

  // Get a subtle color based on category
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

  const categoryColor = getCategoryColor(club.category);

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col h-full border border-gray-100 overflow-hidden relative"
      onClick={onClick}
    >
      {isCompetitive && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-amber-500 text-white p-1 rounded-full shadow-sm" title="Competitive">
            <TrophyIcon className="h-4 w-4" />
          </div>
        </div>
      )}
      <div className="h-1.5" style={{ backgroundColor: categoryColor }} />
      <div className="p-5 flex-grow flex flex-col">
        <div className="mb-3">
          <h3 className="text-xl font-bold text-[#0A2540] mb-1">{club.name}</h3>
          <div className="flex items-center gap-2">
            <span 
              className="inline-block px-3 py-1 text-sm rounded-full"
              style={{ 
                backgroundColor: `${categoryColor}20`, // 20% opacity
                color: categoryColor 
              }}
            >
              {club.category}
            </span>
            
            {membershipAttribute && (
              <span className="text-xs text-gray-500 flex items-center">
                <UserGroupIcon className="h-3 w-3 mr-1" />
                {membershipAttribute.replace(' Membership', '').replace(' Required', '')}
              </span>
            )}
            
            {scheduleAttribute && (
              <span className="text-xs text-gray-500 flex items-center">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {scheduleAttribute}
              </span>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 line-clamp-3 mb-4 flex-grow">{club.description}</p>
        
        <div className="text-sm text-gray-500 border-t pt-3 mt-auto">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2" style={{ color: categoryColor }} />
            {club.meetingTimes}
          </div>
          {club.captain && (
            <div className="flex items-center mt-1">
              <UserIcon className="h-4 w-4 mr-2" style={{ color: categoryColor }} />
              {club.captain}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 