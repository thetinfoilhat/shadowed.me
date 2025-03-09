import { ClubListing } from '@/types/club';

// Membership types
type MembershipType = 'Open' | 'Application' | 'Tryout/Audition' | 'Staff Nomination' | 'Class Specific' | 'Election';

// Schedule types
type ScheduleType = 'All Year' | 'Fall Only' | 'Winter Only' | 'Spring Only' | 'Fall/Winter' | 'Winter/Spring';

// Frequency types
type FrequencyType = 'Weekly' | 'Monthly' | 'Every other week' | 'Bi-monthly' | 'Varies';

// Raw club data from the table
export const CLUB_DATA: {
  name: string;
  membership: MembershipType;
  schedule: ScheduleType;
  frequency: FrequencyType;
  category?: string;
  description?: string;
}[] = [
  { name: "Art Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Arts" },
  { name: "ASL (American Sign Language) Club", membership: "Open", schedule: "All Year", frequency: "Monthly", category: "Language & Culture" },
  { name: "Astronomy Club", membership: "Open", schedule: "All Year", frequency: "Every other week", category: "STEM" },
  { name: "Auto Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Technology" },
  { name: "Aviation Club", membership: "Open", schedule: "All Year", frequency: "Every other week", category: "Technology" },
  { name: "Bass Fishing Team", membership: "Open", schedule: "Spring Only", frequency: "Weekly", category: "Sports" },
  { name: "Bella Corda", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Performing Arts" },
  { name: "Best Buddies", membership: "Open", schedule: "All Year", frequency: "Monthly", category: "Community Service" },
  { name: "Biochemistry Club", membership: "Open", schedule: "All Year", frequency: "Every other week", category: "STEM" },
  { name: "BPA (Business Professionals of America)", membership: "Open", schedule: "All Year", frequency: "Every other week", category: "Business" },
  { name: "BSLA (Black Student Leadership Assoc.)", membership: "Open", schedule: "All Year", frequency: "Every other week", category: "Humanities" },
  { name: "Caregiver Club", membership: "Open", schedule: "All Year", frequency: "Every other week", category: "Community Service" },
  { name: "Ceramics Society", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Arts" },
  { name: "Cheerleading, Adaptive", membership: "Open", schedule: "Fall/Winter", frequency: "Weekly", category: "Sports" },
  { name: "Chemistry Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "STEM" },
  { name: "Chess Club & Team", membership: "Open", schedule: "Fall/Winter", frequency: "Weekly", category: "Academic" },
  { name: "Children's Show", membership: "Tryout/Audition", schedule: "Winter Only", frequency: "Varies", category: "Performing Arts" },
  { name: "Chinese Yo-Yo Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Language & Culture" },
  { name: "Civil Leaders of America (formerly JSA)", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Humanities" },
  { name: "Color Guard ( Fall Flags)", membership: "Tryout/Audition", schedule: "Fall Only", frequency: "Weekly", category: "Performing Arts" },
  { name: "Computer Science Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "STEM" },
  { name: "Costume Crew", membership: "Open", schedule: "All Year", frequency: "Varies", category: "Performing Arts" },
  { name: "Creative Writing Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Humanities" },
  { name: "Dawg Pound", membership: "Application", schedule: "All Year", frequency: "Weekly", category: "Sports" },
  { name: "Debate", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Humanities" },
  { name: "DECA", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Business" },
  { name: "Environmental Science Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "STEM" },
  { name: "Esports Club", membership: "Open", schedule: "All Year", frequency: "Varies", category: "Technology" },
  { name: "Esports Competitive Teams", membership: "Tryout/Audition", schedule: "All Year", frequency: "Weekly", category: "Technology" },
  { name: "Fall Play", membership: "Tryout/Audition", schedule: "Fall Only", frequency: "Weekly", category: "Performing Arts" },
  { name: "FFA (Future Farmers of Amercia)", membership: "Open", schedule: "All Year", frequency: "Every other week", category: "STEM" },
  { name: "Field Hockey", membership: "Open", schedule: "Fall Only", frequency: "Weekly", category: "Sports" },
  { name: "Filipino Culture Club", membership: "Open", schedule: "All Year", frequency: "Monthly", category: "Language & Culture" },
  { name: "French Club", membership: "Open", schedule: "All Year", frequency: "Monthly", category: "Language & Culture" },
  { name: "Fresh/Soph Wheel Dawgs", membership: "Staff Nomination", schedule: "All Year", frequency: "Weekly", category: "Community Service" },
  { name: "Frosh/Soph Play", membership: "Tryout/Audition", schedule: "Fall Only", frequency: "Varies", category: "Performing Arts" },
  { name: "GEMS (Girls in Engineering, Math & Science)", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "STEM" },
  { name: "German Club", membership: "Open", schedule: "All Year", frequency: "Monthly", category: "Language & Culture" },
  { name: "Girl Up", membership: "Open", schedule: "All Year", frequency: "Every other week", category: "Community Service" },
  { name: "Gourmet and Good Living Club", membership: "Open", schedule: "All Year", frequency: "Every other week", category: "Miscellaneous" },
  { name: "GSA (Gender-Sexuality Alliance)", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Humanities" },
  { name: "Health Occupations Students of America (HOSA)", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Medical" },
  { name: "Helping Hands Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Community Service" },
  { name: "Henna Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Arts" },
  { name: "Hockey", membership: "Tryout/Audition", schedule: "All Year", frequency: "Varies", category: "Sports" },
  { name: "Humane Huskies", membership: "Open", schedule: "All Year", frequency: "Every other week", category: "Community Service" },
  { name: "Huskie Book Club", membership: "Open", schedule: "All Year", frequency: "Monthly", category: "Humanities" },
  { name: "Huskie Crew", membership: "Application", schedule: "All Year", frequency: "Monthly", category: "Community Service" },
  { name: "Improv Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Performing Arts" },
  { name: "Interact Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Community Service" },
  { name: "International Thespian Society", membership: "Application", schedule: "All Year", frequency: "Varies", category: "Performing Arts" },
  { name: "Investment Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Business" },
  { name: "ISA (Indian Students Association)", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Language & Culture" },
  { name: "Jazz Band", membership: "Tryout/Audition", schedule: "Winter/Spring", frequency: "Weekly", category: "Performing Arts" },
  { name: "Junior Board", membership: "Class Specific", schedule: "All Year", frequency: "Weekly", category: "Humanities" },
  { name: "Korean Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Language & Culture" },
  { name: "LASA (Latin American Student Assn)", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Language & Culture" },
  { name: "Mandarin Club", membership: "Open", schedule: "All Year", frequency: "Monthly", category: "Language & Culture" },
  { name: "Marching Band", membership: "Open", schedule: "Fall Only", frequency: "Weekly", category: "Performing Arts" },
  { name: "Math Team", membership: "Tryout/Audition", schedule: "All Year", frequency: "Weekly", category: "STEM" },
  { name: "MENA Club", membership: "Open", schedule: "All Year", frequency: "Monthly", category: "Language & Culture" },
  { name: "Model UN", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Humanities" },
  { name: "MSA (Muslim Student Association)", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Language & Culture" },
  { name: "Musical Director", membership: "Tryout/Audition", schedule: "Winter/Spring", frequency: "Varies", category: "Performing Arts" },
  { name: "Musical Pit Director", membership: "Tryout/Audition", schedule: "Spring Only", frequency: "Varies", category: "Performing Arts" },
  { name: "New Generation Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Miscellaneous" },
  { name: "NFHS ( National French Honor Society)", membership: "Application", schedule: "All Year", frequency: "Varies", category: "Language & Culture" },
  { name: "NHS (National Honor Society)", membership: "Application", schedule: "All Year", frequency: "Weekly", category: "Academic" },
  { name: "NNHS Ambassadors", membership: "Application", schedule: "All Year", frequency: "Varies", category: "Community Service" },
  { name: "NNHS Medical Club (NNMC)", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Medical" },
  { name: "North Star (Newspaper)", membership: "Open", schedule: "All Year", frequency: "Varies", category: "Humanities" },
  { name: "Northern Lights (Winter Flags)", membership: "Tryout/Audition", schedule: "Winter/Spring", frequency: "Weekly", category: "Performing Arts" },
  { name: "NSHS (National Spanish Honor Society)", membership: "Application", schedule: "All Year", frequency: "Monthly", category: "Language & Culture" },
  { name: "OASIS", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Humanities" },
  { name: "Orchesis", membership: "Open", schedule: "Fall/Winter", frequency: "Weekly", category: "Performing Arts" },
  { name: "Orchestra Council", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Performing Arts" },
  { name: "Pep Band", membership: "Class Specific", schedule: "Winter Only", frequency: "Varies", category: "Performing Arts" },
  { name: "Photography Club", membership: "Open", schedule: "All Year", frequency: "Monthly", category: "Arts" },
  { name: "Pickleball Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Sports" },
  { name: "Project Positivity NNHS", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Community Service" },
  { name: "Red Cross Club", membership: "Open", schedule: "All Year", frequency: "Bi-monthly", category: "Community Service" },
  { name: "Red Ribbon Club", membership: "Open", schedule: "All Year", frequency: "Monthly", category: "Community Service" },
  { name: "Robotics Team (FIRST Robotics)", membership: "Open", schedule: "All Year", frequency: "Varies", category: "STEM" },
  { name: "Rocketry Club", membership: "Open", schedule: "All Year", frequency: "Varies", category: "STEM" },
  { name: "Scholastic Bowl", membership: "Tryout/Audition", schedule: "All Year", frequency: "Weekly", category: "Academic" },
  { name: "Science Bowl", membership: "Tryout/Audition", schedule: "All Year", frequency: "Weekly", category: "STEM" },
  { name: "Science Olympiad", membership: "Tryout/Audition", schedule: "All Year", frequency: "Weekly", category: "STEM" },
  { name: "Senior Board - Class of 2025", membership: "Class Specific", schedule: "All Year", frequency: "Weekly", category: "Humanities" },
  { name: "Seva Circle", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Community Service" },
  { name: "Show Choir", membership: "Tryout/Audition", schedule: "All Year", frequency: "Weekly", category: "Performing Arts" },
  { name: "Ski & Snowboard Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Sports" },
  { name: "Spanish Club", membership: "Open", schedule: "All Year", frequency: "Monthly", category: "Language & Culture" },
  { name: "Spectrum", membership: "Tryout/Audition", schedule: "Spring Only", frequency: "Varies", category: "Performing Arts" },
  { name: "Speech Team (Forensics)", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Humanities" },
  { name: "Spring Play", membership: "Tryout/Audition", schedule: "Winter/Spring", frequency: "Varies", category: "Performing Arts" },
  { name: "Statistics & Card Game Club", membership: "Application", schedule: "Winter/Spring", frequency: "Weekly", category: "Academic" },
  { name: "Student Government, Head", membership: "Election", schedule: "All Year", frequency: "Weekly", category: "Humanities" },
  { name: "Table Tennis Team & Club", membership: "Open", schedule: "Fall/Winter", frequency: "Weekly", category: "Sports" },
  { name: "Table Top Game Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Miscellaneous" },
  { name: "Tech Crew", membership: "Open", schedule: "All Year", frequency: "Varies", category: "Technology" },
  { name: "Theatre Club", membership: "Open", schedule: "All Year", frequency: "Monthly", category: "Performing Arts" },
  { name: "Top Dawgs", membership: "Staff Nomination", schedule: "All Year", frequency: "Varies", category: "Community Service" },
  { name: "Tutors for the Future", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Academic" },
  { name: "Ultimate Frisbee Club", membership: "Open", schedule: "Spring Only", frequency: "Weekly", category: "Sports" },
  { name: "UNICEF Club", membership: "Open", schedule: "All Year", frequency: "Every other week", category: "Community Service" },
  { name: "Veterans Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Community Service" },
  { name: "Vertigo (Literary Magazine)", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Humanities" },
  { name: "Yearbook", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Humanities" },
  { name: "Yoga Club", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Sports" },
  { name: "Youth and Government", membership: "Open", schedule: "All Year", frequency: "Weekly", category: "Humanities" }
];

// Convert raw club data to ClubListing format
export const generateClubListings = (): ClubListing[] => {
  return CLUB_DATA.map((club, index) => {
    // Generate a description if one isn't provided
    const description = club.description || 
      `${club.name} is a ${club.membership.toLowerCase()} membership club that meets ${club.frequency.toLowerCase()}${club.schedule !== 'All Year' ? ` during ${club.schedule.toLowerCase()}` : ''}.`;
    
    // Map frequency to attributes
    const frequencyAttribute = club.frequency === 'Weekly' ? 'Weekly' : 
                              club.frequency === 'Monthly' ? 'Monthly' : 
                              club.frequency === 'Every other week' ? 'Bi-weekly' : 
                              club.frequency === 'Bi-monthly' ? 'Bi-weekly' : 'Varies';
    
    // Map membership to attributes
    const membershipAttribute = club.membership === 'Open' ? 'Open Membership' :
                               club.membership === 'Application' || club.membership === 'Staff Nomination' || club.membership === 'Class Specific' || club.membership === 'Election' ? 'Application Required' :
                               'Tryout/Audition';
    
    // Map schedule to attributes
    const scheduleAttribute = club.schedule === 'All Year' ? 'Year-round' : 'Seasonal';
    
    // Generate random attributes based on club category
    const categoryAttributes: Record<string, string[]> = {
      'STEM': ['Research', 'Hands-on', 'Teamwork'],
      'Business': ['Entrepreneurship', 'Networking', 'Leadership'],
      'Arts': ['Creative', 'Hands-on'],
      'Performing Arts': ['Creative', 'Teamwork', 'Public Speaking'],
      'Language & Culture': ['Public Speaking', 'Creative'],
      'Community Service': ['Leadership', 'Teamwork'],
      'Humanities': ['Public Speaking', 'Research'],
      'Medical': ['Research', 'Hands-on'],
      'Sports': ['Teamwork', 'Competitive'],
      'Technology': ['Hands-on', 'Research'],
      'Academic': ['Research', 'Competitive'],
      'Miscellaneous': ['Creative', 'Teamwork']
    };
    
    // Select 1-3 category attributes plus the frequency, membership, and schedule attributes
    const baseAttributes = [frequencyAttribute, membershipAttribute, scheduleAttribute];
    const possibleCategoryAttributes = club.category ? categoryAttributes[club.category] || [] : [];
    const numToSelect = Math.floor(Math.random() * 3) + 1; // 1 to 3 attributes
    const selectedCategoryAttributes = possibleCategoryAttributes
      .sort(() => 0.5 - Math.random()) // Shuffle
      .slice(0, Math.min(numToSelect, possibleCategoryAttributes.length));
    
    return {
      id: (index + 1).toString(),
      name: club.name,
      category: club.category || 'Miscellaneous',
      attributes: [...baseAttributes, ...selectedCategoryAttributes],
      description,
      image: `https://source.unsplash.com/random/300x200/?${encodeURIComponent(club.category || 'club')}`,
      status: 'approved',
      mission: `To provide students with opportunities to explore their interests in ${club.category || 'various activities'}.`,
      meetingTimes: club.frequency === 'Weekly' ? 'Every Monday, 3:30-5:00 PM' :
                   club.frequency === 'Monthly' ? 'First Friday of each month, 3:30-5:00 PM' :
                   club.frequency === 'Every other week' ? 'Every other Wednesday, 3:30-5:00 PM' :
                   club.frequency === 'Bi-monthly' ? 'Second and fourth Tuesday, 3:30-5:00 PM' :
                   'Varies, check club calendar',
      contactInfo: `${club.name.toLowerCase().replace(/\s+/g, '.')}@school.edu`,
      captain: 'Club Captain',
      sponsorEmail: 'faculty.sponsor@school.edu',
      createdAt: new Date()
    };
  });
}; 