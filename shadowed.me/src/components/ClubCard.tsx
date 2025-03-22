'use client';
import { motion } from 'framer-motion';
import { ClubListing } from '@/types/club';
import { CalendarIcon, ClockIcon, UserGroupIcon, UserIcon, TrophyIcon, BuildingLibraryIcon, StarIcon } from '@heroicons/react/24/outline';

interface ClubCardProps {
  club: ClubListing & { created?: boolean };
  onClick: () => void;
  compact?: boolean;
}

export default function ClubCard({ club, onClick, compact = false }: ClubCardProps) {
  const {
    name,
    description,
    meetingTimes,
    category,
  } = club;

  // Extract the first attribute of each type for display
  const membershipAttribute = club.attributes?.find(attr => 
    attr === 'Open Membership' || attr === 'Application' || attr === 'Tryout'
  );
  
  const frequencyAttribute = club.attributes?.find(attr =>
    attr === 'Weekly' || attr === 'Bi-weekly' || attr === 'Monthly' || attr === 'Quarterly'
  );
  
  // Check for activity types
  const isCompetitive = club.attributes?.includes('Competitive');
  const hasLeadership = club.attributes?.includes('Leadership');
  const hasTeamwork = club.attributes?.includes('Teamwork');
  const hasPublicSpeaking = club.attributes?.includes('Public Speaking');
  
  // Check if this is a placeholder (no detailed info yet)
  const isPlaceholder = !club.created;

  // Helper function to get color based on category
  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'academic': return '#4361EE'; // brighter blue
      case 'arts': return '#F72585'; // vibrant pink
      case 'cultural': return '#FF9500'; // bright orange
      case 'language & culture': return '#E5446D'; // vibrant rose
      case 'performing arts': return '#FF0054'; // bright red
      case 'service': return '#06D6A0'; // bright teal
      case 'community service': return '#4CC9F0'; // bright cyan
      case 'social': return '#7B2CBF'; // deep purple
      case 'stem': return '#4CC9F0'; // bright cyan
      case 'business': return '#3A0CA3'; // rich purple
      case 'sports': return '#D90429'; // bright red
      case 'technology': return '#7B2CBF'; // deep purple
      case 'humanities': return '#F77F00'; // bright orange
      case 'medical': return '#06D6A0'; // bright teal
      case 'miscellaneous': return '#4895EF'; // bright blue
      default: return '#4361EE'; // bright blue default
    }
  };

  const categoryColor = getCategoryColor(category);

  // Build card classes directly instead of using cn utility
  const cardClasses = `relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${
    compact ? 'p-3' : 'p-4'
  }`;

  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
      className={`${cardClasses} ${isPlaceholder ? 'opacity-80' : ''}`}
      onClick={onClick}
    >
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        {isCompetitive && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-white p-1.5 rounded-full shadow-md" title="Competitive">
            <TrophyIcon className="h-4 w-4" />
          </div>
        )}
        {hasLeadership && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-400 text-white p-1.5 rounded-full shadow-md" title="Leadership">
            <StarIcon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="h-2" style={{ backgroundColor: categoryColor }} />
      <div className="p-5 flex-grow flex flex-col">
        <div className="mb-3">
          <h3 className="text-xl font-bold text-[#0A2540] mb-1">{name}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              className="text-xs font-medium px-2.5 py-1.5 rounded-full text-white"
              style={{ 
                background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)`,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}
            >
              {category}
            </span>
            
            {membershipAttribute && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-full font-medium shadow-sm">
                <UserGroupIcon className="h-3 w-3 inline mr-1" />
                {membershipAttribute}
              </span>
            )}
            
            {frequencyAttribute && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-full font-medium shadow-sm">
                <CalendarIcon className="h-3 w-3 inline mr-1" />
                {frequencyAttribute}
              </span>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 line-clamp-3 mb-4 flex-grow">
          {description || (isPlaceholder ? "Information about this club will be available soon." : "")}
        </p>
        
        <div className="text-sm text-gray-600 border-t pt-3 mt-auto space-y-2">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2" style={{ color: categoryColor }} />
            <span className="font-medium">{meetingTimes || (isPlaceholder ? "Meeting times TBD" : "")}</span>
          </div>
          
          {club.roomNumber && (
            <div className="flex items-center">
              <BuildingLibraryIcon className="h-4 w-4 mr-2" style={{ color: categoryColor }} />
              <span className="font-medium">Room: {club.roomNumber}</span>
            </div>
          )}
          
          {club.captain && (
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-2" style={{ color: categoryColor }} />
              <span className="font-medium">Captain: {club.captain}</span>
            </div>
          )}
        </div>
        
        {(hasTeamwork || hasPublicSpeaking) && (
          <div className="mt-3 flex flex-wrap gap-1">
            {hasTeamwork && (
              <span className="text-xs px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium shadow-sm">Teamwork</span>
            )}
            {hasPublicSpeaking && (
              <span className="text-xs px-2.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium shadow-sm">Public Speaking</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
} 