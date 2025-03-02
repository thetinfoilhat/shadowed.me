'use client';
import { motion } from 'framer-motion';
import { ClubListing } from '@/types/club';

interface ClubCardProps {
  club: ClubListing;
  onClick: () => void;
}

export default function ClubCard({ club, onClick }: ClubCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <h3 className="text-xl font-semibold text-[#0A2540] mb-2">{club.name}</h3>
      <span className="inline-block px-3 py-1 bg-[#38BFA1]/10 text-[#38BFA1] text-sm rounded-full mb-4">
        {club.category}
      </span>
      <p className="text-gray-600 line-clamp-3 mb-4">{club.description}</p>
      <div className="text-sm text-gray-500">
        <div>Meeting Times: {club.meetingTimes}</div>
        <div>Contact: {club.contactInfo}</div>
      </div>
    </motion.div>
  );
} 