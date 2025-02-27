import { Timestamp } from 'firebase/firestore';

export type ClubListingStatus = 'pending' | 'approved' | 'rejected';

export interface ClubListing {
  id: string;
  name: string;
  description: string;
  category: string;
  meetingLocation?: string;
  meetingTime?: string;
  contactEmail?: string;
  website?: string;
  imageUrl?: string;
  
  // Captain information
  captainEmail: string;
  captainName?: string;
  captainUid: string;
  
  // Approval workflow
  status: ClubListingStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sponsorEmail?: string;
  reviewedAt?: Timestamp;
  reviewNotes?: string;
  
  // Additional metadata
  tags?: string[];
  isActive: boolean;
}

export interface ClubListingFormData {
  name: string;
  description: string;
  category: string;
  meetingLocation?: string;
  meetingTime?: string;
  contactEmail?: string;
  website?: string;
  sponsorEmail: string;
  tags?: string[];
}

export const CLUB_CATEGORIES = [
  'Academic',
  'Arts',
  'Business',
  'Community Service',
  'Cultural',
  'Environmental',
  'Language',
  'Music',
  'Performance',
  'Science',
  'Sports',
  'Technology',
  'Other'
];

export const CLUB_LISTING_STATUS_LABELS: Record<ClubListingStatus, string> = {
  'pending': 'Pending Approval',
  'approved': 'Approved',
  'rejected': 'Rejected'
};

export const CLUB_LISTING_STATUS_COLORS: Record<ClubListingStatus, string> = {
  'pending': 'bg-amber-100 text-amber-800',
  'approved': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800'
}; 