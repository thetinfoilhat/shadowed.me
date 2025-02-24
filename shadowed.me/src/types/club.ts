export type Club = {
  id: string;
  captain: string;
  category: string;
  createdAt: Date;
  date: string;
  description: string;
  endTime: string;
  name: string;
  school: string;
  startTime: string;
  time: string;
  slots: number;
  contactEmail: string;
  applicants: Array<{
    name: string;
    email: string;
    grade: string;
    school: string;
  }>;
  categories?: string[];
}; 