import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { parseDateStringAsLocal } from '@/utils/dateUtils';

interface ClubPost {
  id?: string;
  clubId: string;
  clubName: string;
  title: string;
  content: string;
  postType: 'event';
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  maxParticipants?: number;
  currentParticipants: number;
  participants: Array<{
    name: string;
    email: string;
    grade?: string;
    school?: string;
    joinDate: Date;
  }>;
  createdBy: string;
  createdByEmail: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'cancelled' | 'completed';
  tags?: string[];
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringDays?: string[];
  recurringGroupId?: string;
}

// Helper function to generate recurring dates
function generateRecurringDates(
  startDate: string, 
  pattern: 'weekly' | 'biweekly' | 'monthly', 
  days: string[], 
  count: number = 12
): string[] {
  const dates: string[] = [];
  
  // Parse date as local date at noon to avoid timezone issues
  const start = parseDateStringAsLocal(startDate);
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Convert day names to day numbers (0 = Sunday, 1 = Monday, etc.)
  const targetDays = days.map(day => dayNames.indexOf(day)).filter(day => day !== -1);
  
  if (targetDays.length === 0) {
    // If no specific days selected, use the start date's day of week
    targetDays.push(start.getDay());
  }
  
  let generatedCount = 0;
  
  // Generate dates for the next 6 months
  const endDate = new Date(start);
  endDate.setMonth(endDate.getMonth() + 6);
  
  if (pattern === 'weekly') {
    // For weekly: generate every week on the specified days
    let currentWeekStart = new Date(start);
    // Move to the start of the week (Sunday)
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    
    while (currentWeekStart <= endDate && generatedCount < count) {
      // Check each target day in this week
      for (const targetDay of targetDays) {
        const eventDate = new Date(currentWeekStart);
        eventDate.setDate(currentWeekStart.getDate() + targetDay);
        
        // Only add if the date is on or after the start date and within limits
        if (eventDate >= start && eventDate <= endDate && generatedCount < count) {
          const dateStr = eventDate.getFullYear() + '-' + 
                         String(eventDate.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(eventDate.getDate()).padStart(2, '0');
          dates.push(dateStr);
          generatedCount++;
          console.log(`Added weekly date: ${dateStr} (day ${targetDay})`);
        }
      }
      // Move to next week
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
  } else if (pattern === 'biweekly') {
    // For biweekly: generate every other week on the specified days
    let currentWeekStart = new Date(start);
    // Move to the start of the week (Sunday)
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    
    while (currentWeekStart <= endDate && generatedCount < count) {
      // Check each target day in this week
      for (const targetDay of targetDays) {
        const eventDate = new Date(currentWeekStart);
        eventDate.setDate(currentWeekStart.getDate() + targetDay);
        
        // Only add if the date is on or after the start date and within limits
        if (eventDate >= start && eventDate <= endDate && generatedCount < count) {
          const dateStr = eventDate.getFullYear() + '-' + 
                         String(eventDate.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(eventDate.getDate()).padStart(2, '0');
          dates.push(dateStr);
          generatedCount++;
          console.log(`Added biweekly date: ${dateStr} (day ${targetDay})`);
        }
      }
      // Move to next biweekly occurrence (skip one week, then add one week = 14 days)
      currentWeekStart.setDate(currentWeekStart.getDate() + 14);
    }
  } else if (pattern === 'monthly') {
    // For monthly: generate on the same day of week in each month
    let currentDate = new Date(start);
    
    while (currentDate <= endDate && generatedCount < count) {
      const dayOfWeek = currentDate.getDay();
      
      if (targetDays.includes(dayOfWeek)) {
        const dateStr = currentDate.getFullYear() + '-' + 
                       String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(currentDate.getDate()).padStart(2, '0');
        dates.push(dateStr);
        generatedCount++;
        console.log(`Added monthly date: ${dateStr} (day ${dayOfWeek})`);
      }
      
      // Move to next month, same day
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      // Handle month boundary edge cases (e.g., Jan 31 -> Feb 28)
      if (nextMonth.getMonth() !== (currentDate.getMonth() + 1) % 12) {
        // Day doesn't exist in next month, use last day of month
        nextMonth.setDate(0);
      }
      
      currentDate = nextMonth;
    }
  }
  
  return dates;
}

// GET - Get posts for a specific club
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');
    const status = searchParams.get('status') || 'active';
    const postType = searchParams.get('postType') || 'all';

    console.log('API: Fetching posts for clubId:', clubId, 'status:', status, 'postType:', postType);

    if (!clubId) {
      return NextResponse.json({ error: 'Club ID is required' }, { status: 400 });
    }

    const postsRef = collection(db, 'clubPosts');
    let postsQuery = query(postsRef, where('clubId', '==', clubId));
    
    if (status !== 'all') {
      postsQuery = query(postsQuery, where('status', '==', status));
    }

    if (postType !== 'all') {
      postsQuery = query(postsQuery, where('postType', '==', postType));
    }

    const querySnapshot = await getDocs(postsQuery);
    console.log('API: Found', querySnapshot.docs.length, 'posts for clubId:', clubId);
    
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      participants: doc.data().participants?.map((p: { name: string; email: string; grade?: string; school?: string; joinDate?: { toDate?: () => Date } | Date }) => ({
        ...p,
        joinDate: (p.joinDate && typeof (p.joinDate as { toDate?: () => Date }).toDate === 'function') 
          ? (p.joinDate as { toDate: () => Date }).toDate() 
          : (p.joinDate as Date | undefined)
      })) || []
    }));

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching club posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST - Create a new club post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      clubId, 
      clubName, 
      title, 
      content, 
      postType, 
      date, 
      startTime, 
      endTime, 
      location, 
      maxParticipants,
      tags,
      isRecurring,
      recurringPattern,
      recurringDays,
      createdBy,
      createdByEmail 
    } = body;

    console.log('API: Creating post with data:', { clubId, clubName, title, postType, date, createdByEmail });

    if (!clubId || !clubName || !title || !content || !postType || !date || !createdBy || !createdByEmail) {
      return NextResponse.json({ 
        error: 'Missing required fields: clubId, clubName, title, content, postType, date, createdBy, createdByEmail' 
      }, { status: 400 });
    }

    // Verify the user has permission to create posts for this club
    const clubRef = doc(db, 'clubSites', clubId);
    const clubDoc = await getDoc(clubRef);
    
    if (!clubDoc.exists()) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const clubData = clubDoc.data();
    
    // Check if user is a captain
    const isCaptain = clubData.captainEmails?.includes(createdByEmail) || 
                     clubData.captains?.includes(createdByEmail) || 
                     clubData.captain === createdByEmail;
    
    // Check if user is a sponsor
    const isSponsor = clubData.sponsorEmails?.includes(createdByEmail) || 
                     clubData.sponsorEmail === createdByEmail;
    
    // Check if user is an admin by looking up their role in the database
    let isAdmin = false;
    try {
      // Find user by email to get their role
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', createdByEmail));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        isAdmin = userData.role === 'admin';
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      // If we can't check admin status, assume not admin for security
      isAdmin = false;
    }

    if (!isCaptain && !isSponsor && !isAdmin) {
      return NextResponse.json({ error: 'You do not have permission to create posts for this club' }, { status: 403 });
    }

    // Create base post data
    const basePostData: Omit<ClubPost, 'id'> = {
      clubId,
      clubName,
      title,
      content,
      postType,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      location: location || null,
      maxParticipants: maxParticipants || null,
      currentParticipants: 0,
      participants: [],
      createdBy,
      createdByEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      tags: tags || [],
      isRecurring: isRecurring || false,
      recurringPattern: recurringPattern || null,
      recurringDays: recurringDays || []
    };

    if (isRecurring && recurringPattern && recurringDays && recurringDays.length > 0) {
      // Generate recurring dates
      const recurringDates = generateRecurringDates(date, recurringPattern, recurringDays, 24);
      console.log('API: Generating recurring events:', {
        pattern: recurringPattern,
        days: recurringDays,
        startDate: date,
        generatedDates: recurringDates,
        count: recurringDates.length
      });
      
      // Generate a unique group ID for this recurring series
      const recurringGroupId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Use batch write to create multiple posts
      const batch = writeBatch(db);
      const createdPostIds: string[] = [];
      
      for (const recurringDate of recurringDates) {
        const postRef = doc(collection(db, 'clubPosts'));
        const postData = {
          ...basePostData,
          date: recurringDate,
          recurringGroupId: recurringGroupId,
          // Add a suffix to distinguish recurring instances
          title: recurringDates.length > 1 ? `${title} (${recurringDate})` : title
        };
        
        batch.set(postRef, postData);
        createdPostIds.push(postRef.id);
      }
      
      await batch.commit();
      console.log('API: Created', createdPostIds.length, 'recurring posts for clubId:', clubId, 'with groupId:', recurringGroupId);
      
      return NextResponse.json({ 
        success: true, 
        postIds: createdPostIds,
        recurringGroupId: recurringGroupId,
        message: `Created ${createdPostIds.length} recurring events successfully` 
      });
    } else {
      // Create single post
      const docRef = await addDoc(collection(db, 'clubPosts'), basePostData);
      console.log('API: Post created successfully with ID:', docRef.id, 'for clubId:', clubId);

      return NextResponse.json({ 
        success: true, 
        postId: docRef.id,
        message: 'Post created successfully' 
      });
    }
  } catch (error) {
    console.error('Error creating club post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

// PUT - Update an existing club post
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, updates, updatedBy } = body;

    if (!postId || !updatedBy) {
      return NextResponse.json({ error: 'Post ID and updatedBy are required' }, { status: 400 });
    }

    // Get the post to verify permissions
    const postRef = doc(db, 'clubPosts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const postData = postDoc.data();
    
    // Verify the user has permission to update this post
    const clubRef = doc(db, 'clubSites', postData.clubId);
    const clubDoc = await getDoc(clubRef);
    
    if (!clubDoc.exists()) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const clubData = clubDoc.data();
    
    // Check if user is a captain
    const isCaptain = clubData.captainEmails?.includes(updatedBy) || 
                     clubData.captains?.includes(updatedBy) || 
                     clubData.captain === updatedBy;
    
    // Check if user is a sponsor
    const isSponsor = clubData.sponsorEmails?.includes(updatedBy) || 
                     clubData.sponsorEmail === updatedBy;
    
    // Check if user is an admin by looking up their role in the database
    let isAdmin = false;
    try {
      // Find user by email to get their role
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', updatedBy));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        isAdmin = userData.role === 'admin';
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      // If we can't check admin status, assume not admin for security
      isAdmin = false;
    }
    
    const isCreator = postData.createdByEmail === updatedBy;

    if (!isCaptain && !isSponsor && !isAdmin && !isCreator) {
      return NextResponse.json({ error: 'You do not have permission to update this post' }, { status: 403 });
    }

    // Update the post
    await updateDoc(postRef, {
      ...updates,
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Post updated successfully' 
    });
  } catch (error) {
    console.error('Error updating club post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

// DELETE - Delete a club post
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, deletedBy } = body;

    if (!postId || !deletedBy) {
      return NextResponse.json({ error: 'Post ID and deletedBy are required' }, { status: 400 });
    }

    // Get the post to verify permissions
    const postRef = doc(db, 'clubPosts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const postData = postDoc.data();
    
    // Verify the user has permission to delete this post
    const clubRef = doc(db, 'clubSites', postData.clubId);
    const clubDoc = await getDoc(clubRef);
    
    if (!clubDoc.exists()) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const clubData = clubDoc.data();
    
    // Check if user is a captain
    const isCaptain = clubData.captainEmails?.includes(deletedBy) || 
                     clubData.captains?.includes(deletedBy) || 
                     clubData.captain === deletedBy;
    
    // Check if user is a sponsor
    const isSponsor = clubData.sponsorEmails?.includes(deletedBy) || 
                     clubData.sponsorEmail === deletedBy;
    
    // Check if user is an admin by looking up their role in the database
    let isAdmin = false;
    try {
      // Find user by email to get their role
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', deletedBy));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        isAdmin = userData.role === 'admin';
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      // If we can't check admin status, assume not admin for security
      isAdmin = false;
    }
    
    const isCreator = postData.createdByEmail === deletedBy;

    if (!isCaptain && !isSponsor && !isAdmin && !isCreator) {
      return NextResponse.json({ error: 'You do not have permission to delete this post' }, { status: 403 });
    }

    // Delete the post
    await deleteDoc(postRef);

    return NextResponse.json({ 
      success: true, 
      message: 'Post deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting club post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
} 