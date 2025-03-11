'use client';
import { motion } from 'framer-motion';
import { ClubListing } from '@/types/club';
import { CalendarIcon, ClockIcon, UserGroupIcon, UserIcon, TrophyIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';

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
  
  // Check for activity types
  const isCompetitive = club.attributes?.includes('Competitive');
  const hasLeadership = club.attributes?.includes('Leadership');
  const hasTeamwork = club.attributes?.includes('Teamwork');
  const hasPublicSpeaking = club.attributes?.includes('Public Speaking');
  const hasPerformance = club.attributes?.includes('Performance');

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
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        {isCompetitive && (
          <div className="bg-amber-500 text-white p-1 rounded-full shadow-sm" title="Competitive">
            <TrophyIcon className="h-4 w-4" />
          </div>
        )}
        {hasLeadership && (
          <div className="bg-blue-500 text-white p-1 rounded-full shadow-sm" title="Leadership">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      <div className="h-1.5" style={{ backgroundColor: categoryColor }} />
      <div className="p-5 flex-grow flex flex-col">
        <div className="mb-3">
          <h3 className="text-xl font-bold text-[#0A2540] mb-1">{club.name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
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
        
        <div className="text-sm text-gray-500 border-t pt-3 mt-auto space-y-1">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2" style={{ color: categoryColor }} />
            {club.meetingTimes}
          </div>
          
          {club.roomNumber && (
            <div className="flex items-center">
              <BuildingLibraryIcon className="h-4 w-4 mr-2" style={{ color: categoryColor }} />
              {club.roomNumber}
            </div>
          )}
          
          {club.captain && (
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-2" style={{ color: categoryColor }} />
              {club.captain}
            </div>
          )}
        </div>
        
        {(hasTeamwork || hasPublicSpeaking || hasPerformance) && (
          <div className="mt-3 flex flex-wrap gap-1">
            {hasTeamwork && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">Teamwork</span>
            )}
            {hasPublicSpeaking && (
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">Public Speaking</span>
            )}
            {hasPerformance && (
              <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-800 rounded-full">Performance</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
} 