'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ClubListing } from '@/models/ClubListing';

interface ClubListingCardProps {
  listing: ClubListing;
  showApplyButton?: boolean;
  onApply?: (listingId: string) => void;
}

export default function ClubListingCard({ 
  listing, 
  showApplyButton = true,
  onApply 
}: ClubListingCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handleApply = () => {
    if (onApply) {
      onApply(listing.id);
    }
  };
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-4 transition-all">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-[#0A2540]">{listing.name}</h3>
        <span className="px-3 py-1 rounded-full text-sm bg-[#E6F7F4] text-[#2A8E9E]">
          {listing.category}
        </span>
      </div>
      
      <p className={`text-gray-600 ${expanded ? '' : 'line-clamp-2'} mb-4`}>
        {listing.description}
      </p>
      
      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {listing.meetingLocation && (
            <div>
              <p className="text-sm text-gray-500">Meeting Location</p>
              <p className="font-medium">{listing.meetingLocation}</p>
            </div>
          )}
          
          {listing.meetingTime && (
            <div>
              <p className="text-sm text-gray-500">Meeting Time</p>
              <p className="font-medium">{listing.meetingTime}</p>
            </div>
          )}
          
          {listing.contactEmail && (
            <div>
              <p className="text-sm text-gray-500">Contact</p>
              <p className="font-medium">{listing.contactEmail}</p>
            </div>
          )}
          
          {listing.website && (
            <div>
              <p className="text-sm text-gray-500">Website</p>
              <Link 
                href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#2A8E9E] hover:underline"
              >
                Visit Website
              </Link>
            </div>
          )}
        </div>
      )}
      
      {listing.tags && listing.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {listing.tags.map(tag => (
              <span 
                key={tag} 
                className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={toggleExpand}
          className="text-[#2A8E9E] text-sm font-medium hover:underline focus:outline-none"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
        
        {showApplyButton && (
          <button
            onClick={handleApply}
            className="px-4 py-2 rounded-lg bg-[#38BFA1] text-white hover:bg-[#2DA891] transition-colors"
          >
            Apply to Join
          </button>
        )}
      </div>
    </div>
  );
} 