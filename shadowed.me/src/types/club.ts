export interface Applicant {
  name: string;
  email: string;
  grade: string;
  school: string;
}

export interface Club {
  id: string;
  name: string;
  school?: string;
  sponsorEmail?: string;
  category: string;
  date: string;
  time: string;
  description: string;
  captain: string;
  slots: number;
  applicants: Applicant[];
  completed?: boolean;
  categories?: string[];
  status?: 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
  startTime: string;
  endTime: string;
  contactEmail: string;
}

export interface CompletedVisit {
  id: string;
  name: string;
  school: string;
  category: string;
  date: string;
  time: string;
  description: string;
  completedAt: string;
}

export interface ClubListing {
  id: string;
  name: string;
  description: string;
  mission: string;
  meetingTimes: string;
  contactInfo: string;
  category: string;
  captain: string;
  sponsorEmail: string;
  createdAt: Date;
  status?: 'pending' | 'approved' | 'rejected';
  attributes?: string[];
  image?: string;
  bgColor?: string;
  bgGradient?: string;
  roomNumber?: string;
} 