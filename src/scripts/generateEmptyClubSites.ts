import { db } from '@/lib/firebase';
import { collection, getDocs, getDoc, doc, setDoc } from 'firebase/firestore';
import { ClubListing } from '@/types/club';

/**
 * This script creates empty club site documents for all existing clubs in Firebase
 * It follows the required structure for clubSites collection
 */
export async function generateEmptyClubSites() {
  try {
    // Fetch all clubs from the 'clubs' collection
    const clubsRef = collection(db, 'clubs');
    const querySnapshot = await getDocs(clubsRef);
    
    console.log(`Found ${querySnapshot.docs.length} clubs in Firebase.`);
    
    const results = {
      success: 0,
      skipped: 0,
      errors: 0,
      details: [] as string[]
    };
    
    // Process each club
    for (const clubDoc of querySnapshot.docs) {
      try {
        const clubData = clubDoc.data() as ClubListing;
        const clubName = clubData.name?.trim();
        
        if (!clubName) {
          results.skipped++;
          results.details.push(`Skipped club with ID ${clubDoc.id}: Missing name`);
          continue;
        }
        
        // Generate a slug from the club name
        const slug = generateSlug(clubName);
        
        // Check if a club site already exists with this slug
        const clubSiteRef = doc(db, 'clubSites', slug);
        const clubSiteDoc = await getDoc(clubSiteRef);
        
        if (clubSiteDoc.exists()) {
          results.skipped++;
          results.details.push(`Skipped ${clubName}: Club site already exists with slug "${slug}"`);
          continue;
        }
        
        // Create an empty club site document with data from the club listing
        await setDoc(clubSiteRef, {
          // Basic identification
          id: slug,
          slug: slug,
          clubName: clubName,
          
          // Associate with the original club document
          clubId: clubDoc.id,
          
          // Content from club listing
          description: clubData.description || '',
          slogan: generateSlogan(clubData),
          meetingInfo: clubData.meetingTimes || 'Meeting times coming soon.',
          
          // Metadata
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: "admin", // You might want to update this with the actual user ID
          
          // Contact information from club listing
          contactLinks: generateContactLinks(clubData),
          
          // Empty arrays for future content
          members: generateDefaultMembers(clubData),
          events: [],
          gallery: [],
          resources: [],
          
          // Theme based on club category
          theme: {
            primaryColor: getPrimaryColorFromCategory(clubData.category || ''),
            textColor: 'dark',
            font: 'inter'
          },
          
          // Empty interest form
          interestForm: {
            enabled: true,
            title: "Join Our Club",
            description: "Fill out this form to express interest in joining our club.",
            fields: [
              {
                id: "name",
                label: "Full Name",
                type: "text",
                required: true
              },
              {
                id: "email",
                label: "Email Address",
                type: "email",
                required: true
              },
              {
                id: "grade",
                label: "Grade Level",
                type: "select",
                options: ["9th", "10th", "11th", "12th"],
                required: true
              },
              {
                id: "reason",
                label: "Why are you interested in joining?",
                type: "textarea",
                required: false
              }
            ],
            submissions: []
          }
        });
        
        results.success++;
        results.details.push(`Created club site for "${clubName}" with slug "${slug}"`);
      } catch (error) {
        results.errors++;
        results.details.push(`Error processing club ${clubDoc.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    console.log(`Operation complete: ${results.success} sites created, ${results.skipped} skipped, ${results.errors} errors`);
    return {
      success: results.success > 0,
      message: `Created ${results.success} club sites, skipped ${results.skipped}, encountered ${results.errors} errors`,
      details: results.details
    };
  } catch (error) {
    console.error('Error generating empty club sites:', error);
    return {
      success: false,
      message: `Error generating club sites: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Generate a URL-friendly slug from a club name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .trim();
}

/**
 * Generate a slogan based on club data
 */
function generateSlogan(clubData: ClubListing): string {
  // If club is competitive, highlight that
  if (clubData.attributes?.includes('Competitive')) {
    return `Award-Winning ${clubData.category || ''} Club`;
  }
  
  // If there's a mission statement, use part of that
  if (clubData.mission && clubData.mission.length > 10) {
    // Take first sentence or first 50 characters
    const firstSentence = clubData.mission.split('.')[0];
    if (firstSentence.length < 50) {
      return firstSentence;
    }
    return firstSentence.substring(0, 50) + '...';
  }
  
  // Default based on category
  return `${clubData.category || 'Student'} Club`;
}

/**
 * Generate contact links from club data
 */
function generateContactLinks(clubData: ClubListing): Array<{type: string, url: string, label: string}> {
  const links = [];
  
  // Primary contact info (usually email)
  if (clubData.contactInfo) {
    const isEmail = clubData.contactInfo.includes('@');
    
    if (isEmail) {
      links.push({
        type: 'email',
        url: `mailto:${clubData.contactInfo}`,
        label: 'Email Us'
      });
    } else if (clubData.contactInfo.includes('instagram.com')) {
      links.push({
        type: 'instagram',
        url: clubData.contactInfo,
        label: 'Follow on Instagram'
      });
    } else {
      links.push({
        type: 'other',
        url: clubData.contactInfo,
        label: 'Contact'
      });
    }
  }
  
  // Sponsor email if available
  if (clubData.sponsorEmail && clubData.sponsorEmail !== clubData.contactInfo) {
    links.push({
      type: 'email',
      url: `mailto:${clubData.sponsorEmail}`,
      label: 'Contact Sponsor'
    });
  }
  
  return links;
}

/**
 * Generate default members based on club data
 */
function generateDefaultMembers(clubData: ClubListing): Array<{name: string, role: string, bio: string}> {
  const members = [];
  
  // If there's a captain, add them
  if (clubData.captain && clubData.captain !== '' && clubData.captain !== 'Club Captain') {
    members.push({
      name: clubData.captain,
      role: 'Club Captain',
      bio: `Club captain for ${clubData.name}.`
    });
  }
  
  return members;
}

/**
 * Map category to a primary color for the theme
 */
function getPrimaryColorFromCategory(category: string): string {
  const colorMap: Record<string, string> = {
    'STEM': 'blue',
    'Business': 'green',
    'Arts': 'pink',
    'Performing Arts': 'red',
    'Language & Culture': 'purple',
    'Community Service': 'cyan',
    'Humanities': 'orange',
    'Medical': 'teal',
    'Sports': 'red',
    'Technology': 'indigo',
    'Academic': 'yellow',
    'Miscellaneous': 'gray'
  };
  
  return colorMap[category] || 'teal'; // Default to teal
} 