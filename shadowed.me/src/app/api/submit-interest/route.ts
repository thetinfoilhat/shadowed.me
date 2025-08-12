import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface Submission {
  name: string;
  email: string;
  timestamp: number;
}

// Utility function to get unique submissions by email, keeping the latest one
const getUniqueSubmissions = (submissions: Submission[]): Submission[] => {
  // Create a map to track the latest submission for each email
  const emailMap = new Map<string, Submission>();
  
  // Iterate through all submissions
  submissions.forEach(sub => {
    const email = sub.email.toLowerCase();
    const existingSubmission = emailMap.get(email);
    
    // If this email doesn't exist in the map yet, or if this submission is newer, update the map
    if (!existingSubmission || sub.timestamp > existingSubmission.timestamp) {
      emailMap.set(email, sub);
    }
  });
  
  // Convert the map values back to an array and sort by name
  return Array.from(emailMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export async function POST(request: Request) {
  try {
    const { websiteId, name, email } = await request.json();

    if (!websiteId || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the website document reference
    const websiteRef = doc(db, 'clubSites', websiteId);
    const websiteDoc = await getDoc(websiteRef);
    
    if (!websiteDoc.exists()) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    const websiteData = websiteDoc.data();
    const currentSubmissions = websiteData.interestForm?.submissions || [];
    
    // Check if the email already exists in submissions
    const emailExists = currentSubmissions.some((submission: Submission) => 
      submission.email.toLowerCase() === email.toLowerCase()
    );
    
    if (emailExists) {
      return NextResponse.json(
        { error: 'You have already submitted an interest form with this email' },
        { status: 409 }
      );
    }
    
    // Add the new submission
    const newSubmission = {
      name,
      email,
      timestamp: Date.now()
    };

    // First deduplicate existing submissions, then add the new one
    const uniqueExistingSubmissions = getUniqueSubmissions(currentSubmissions);
    
    // Combine deduplicated submissions with new submission and sort alphabetically by name
    const updatedSubmissions = [...uniqueExistingSubmissions, newSubmission].sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    // Update the club document with the sorted submissions
    await updateDoc(websiteRef, {
      'interestForm.submissions': updatedSubmissions
    });

    // Also update the user's joined clubs list
    try {
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const userSnapshot = await getDocs(q);
      
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        const joinedClubs = userData.joinedClubs || [];
        
        // Add this club to user's joined clubs if not already there
        if (!joinedClubs.includes(websiteId)) {
          await updateDoc(doc(db, 'users', userDoc.id), {
            joinedClubs: [...joinedClubs, websiteId]
          });
        }
      }
    } catch (error) {
      console.error('Error updating user joined clubs:', error);
      // Don't fail the main operation if user update fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting interest form:', error);
    return NextResponse.json(
      { error: 'Failed to submit interest form' },
      { status: 500 }
    );
  }
} 