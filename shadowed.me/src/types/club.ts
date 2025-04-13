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
  attributes?: string[];
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
  created?: boolean;
  contactInfoList?: string[];
  sponsorEmailList?: string[];
  captains?: string[];
  sponsorEmails?: string[];
}

export interface ClubSite {
  id: string;
  slug: string;
  clubName: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  theme: {
    primaryColor: string;
    textColor: string;
    font: string;
  };
  bannerImage?: string;
  slogan?: string;
  description?: string;      // Long form about section
  meetingInfo?: {
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'custom';
    days: {
      day: string;
      startTime: string;
      endTime: string;
    }[];
    room: string;
    jamboreeTable?: string;
    customInfo?: string;  // Fallback string for custom meeting information
  };
  upcomingVisits?: {
    title: string;
    date: string;
    description?: string;
  }[];
  pastEvents?: {
    title: string;
    date: string;
    description?: string;
    photoUrl?: string;
  }[];
  galleryImages?: string[];  // URLs to images
  galleryImagesMetadata?: {
    url: string;
    title?: string;
    caption?: string;
    uploadedAt: Date;
  }[];
  contactLinks?: {
    type: string;      // email, instagram, remind, etc.
    url: string;
    label: string;
  }[];
  members?: {
    name: string;
    role: string;
    photoUrl?: string;
    bio?: string;
    email?: string;
  }[];
  resources?: {
    type: 'pdf' | 'link';
    title: string;
    description?: string;
    url: string;
    uploadedAt: Date;
    fileSize?: number;  // Only for PDFs
  }[];
  pdfUploads?: {
    fileName: string;
    url: string;
    uploadedAt: Date;
    fileSize?: number;
  }[];  // Deprecated: Use resources instead
  lastUpdated?: Date;
  featuredImage?: string;    // URL to featured image from gallery
  interestForm?: {
    enabled: boolean;
    submissions: {
      name: string;
      email: string;
      timestamp: number;
    }[];
  };
} 