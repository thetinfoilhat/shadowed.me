import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// POST - Update user role and handle role continuity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, newRole, clubId, action } = body;

    if (!userId || !newRole) {
      return NextResponse.json({ 
        error: 'User ID and new role are required' 
      }, { status: 400 });
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const oldRole = userData.role || 'student';

    // Update user role
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: new Date()
    });

    // Handle role-specific updates
    if (newRole === 'captain' && clubId) {
      // Add club to captain's captainClubs array
      const currentCaptainClubs = userData.captainClubs || [];
      if (!currentCaptainClubs.includes(clubId)) {
        await updateDoc(userRef, {
          captainClubs: [...currentCaptainClubs, clubId]
        });
      }
    } else if (oldRole === 'captain' && newRole !== 'captain') {
      // Remove all clubs from captainClubs array if demoted
      await updateDoc(userRef, {
        captainClubs: []
      });
    }

    // Update club assignments if clubId is provided
    if (clubId) {
      const clubRef = doc(db, 'clubSites', clubId);
      const clubDoc = await getDoc(clubRef);
      
      if (clubDoc.exists()) {
        const clubData = clubDoc.data();
        
        if (action === 'add') {
          if (newRole === 'captain') {
            // Add to captainEmails array
            const currentCaptains = clubData.captainEmails || [];
            if (!currentCaptains.includes(userData.email)) {
              await updateDoc(clubRef, {
                captainEmails: [...currentCaptains, userData.email],
                updatedAt: new Date()
              });
            }
          } else if (newRole === 'sponsor') {
            // Add to sponsorEmails array
            const currentSponsors = clubData.sponsorEmails || [];
            if (!currentSponsors.includes(userData.email)) {
              await updateDoc(clubRef, {
                sponsorEmails: [...currentSponsors, userData.email],
                updatedAt: new Date()
              });
            }
          }
        } else if (action === 'remove') {
          if (oldRole === 'captain') {
            // Remove from captainEmails array
            const currentCaptains = clubData.captainEmails || [];
            const updatedCaptains = currentCaptains.filter((email: string) => email !== userData.email);
            await updateDoc(clubRef, {
              captainEmails: updatedCaptains,
              updatedAt: new Date()
            });
          } else if (oldRole === 'sponsor') {
            // Remove from sponsorEmails array
            const currentSponsors = clubData.sponsorEmails || [];
            const updatedSponsors = currentSponsors.filter((email: string) => email !== userData.email);
            await updateDoc(clubRef, {
              sponsorEmails: updatedSponsors,
              updatedAt: new Date()
            });
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `User role updated to ${newRole} successfully` 
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}

// GET - Get user role and club assignments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    
    // Get club information for captains
    let captainClubs = [];
    if (userData.role === 'captain' && userData.captainClubs) {
      const clubPromises = userData.captainClubs.map(async (clubId: string) => {
        const clubRef = doc(db, 'clubSites', clubId);
        const clubDoc = await getDoc(clubRef);
        if (clubDoc.exists()) {
          return {
            id: clubId,
            name: clubDoc.data().clubName,
            slug: clubDoc.data().slug
          };
        }
        return null;
      });
      
      const clubResults = await Promise.all(clubPromises);
      captainClubs = clubResults.filter(Boolean);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: userData.email,
        role: userData.role || 'student',
        displayName: userData.displayName,
        captainClubs,
        joinedClubs: userData.joinedClubs || []
      }
    });
  } catch (error) {
    console.error('Error getting user role:', error);
    return NextResponse.json({ error: 'Failed to get user role' }, { status: 500 });
  }
} 