import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { generateClubListings } from '@/data/clubData';
import { ClubListing } from '@/types/club';

/**
 * This script migrates club data from the static clubData.ts file to Firebase Firestore.
 * Run this script once to populate the clubs collection in Firebase.
 * 
 * To run this script:
 * 1. Create a new page component that imports and calls this function
 * 2. Navigate to that page while logged in as an admin
 * 3. The script will run and migrate the data
 * 4. You can then remove the page component
 */
export async function migrateClubsToFirebase() {
  try {
    // Check if clubs already exist in Firebase
    const clubsRef = collection(db, 'clubs');
    const existingClubsSnapshot = await getDocs(clubsRef);
    
    if (!existingClubsSnapshot.empty) {
      console.log(`Found ${existingClubsSnapshot.size} existing clubs in Firebase. Migration may not be necessary.`);
      return {
        success: false,
        message: `Found ${existingClubsSnapshot.size} existing clubs in Firebase. Migration skipped.`
      };
    }
    
    // Generate club listings from static data
    const clubListings = generateClubListings();
    
    // Add each club to Firebase
    let successCount = 0;
    for (const club of clubListings) {
      // Convert to ClubListing format with required fields
      const clubData: Partial<ClubListing> = {
        name: club.name,
        description: club.description || '',
        mission: club.mission || `To provide opportunities for students interested in ${club.category}.`,
        meetingTimes: '',
        contactInfo: '',
        category: club.category,
        attributes: club.attributes,
        bgColor: club.bgColor,
        bgGradient: club.bgGradient,
        status: 'approved',
        createdAt: new Date(),
        // These will be assigned later by admin
        captain: '',
        sponsorEmail: ''
      };
      
      await addDoc(collection(db, 'clubs'), clubData);
      successCount++;
    }
    
    console.log(`Successfully migrated ${successCount} clubs to Firebase.`);
    return {
      success: true,
      message: `Successfully migrated ${successCount} clubs to Firebase.`
    };
  } catch (error) {
    console.error('Error migrating clubs to Firebase:', error);
    return {
      success: false,
      message: `Error migrating clubs: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 