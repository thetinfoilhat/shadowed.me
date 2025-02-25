export interface Applicant {
  name: string;
  email: string;
  grade: string;
  school: string;
}

export interface Club {
  id: string;
  name: string;
  school: string;
  category: string;
  date: string;
  time: string;
  description: string;
  captain: string;
  slots: number;
  applicants: Applicant[];
  completed?: boolean;
  createdAt: Date;
  startTime: string;
  endTime: string;
  contactEmail: string;
  categories?: string[];
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