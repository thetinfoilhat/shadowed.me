import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ClubPost {
  id?: string;
  clubId: string;
  clubName: string;
  title: string;
  content: string;
  postType: 'event' | 'announcement' | 'meeting' | 'general';
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
    const isCaptain = clubData.captainEmails?.includes(createdByEmail) || 
                     clubData.captains?.includes(createdByEmail) || 
                     clubData.captain === createdByEmail;
    const isSponsor = clubData.sponsorEmails?.includes(createdByEmail) || 
                     clubData.sponsorEmail === createdByEmail;
    const isAdmin = createdByEmail === 'admin'; // You might want to check this differently

    if (!isCaptain && !isSponsor && !isAdmin) {
      return NextResponse.json({ error: 'You do not have permission to create posts for this club' }, { status: 403 });
    }

    const postData: Omit<ClubPost, 'id'> = {
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

    const docRef = await addDoc(collection(db, 'clubPosts'), postData);
    console.log('API: Post created successfully with ID:', docRef.id, 'for clubId:', clubId);

    return NextResponse.json({ 
      success: true, 
      postId: docRef.id,
      message: 'Post created successfully' 
    });
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
    const isCaptain = clubData.captainEmails?.includes(updatedBy) || 
                     clubData.captains?.includes(updatedBy) || 
                     clubData.captain === updatedBy;
    const isSponsor = clubData.sponsorEmails?.includes(updatedBy) || 
                     clubData.sponsorEmail === updatedBy;
    const isAdmin = updatedBy === 'admin';
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
    const isCaptain = clubData.captainEmails?.includes(deletedBy) || 
                     clubData.captains?.includes(deletedBy) || 
                     clubData.captain === deletedBy;
    const isSponsor = clubData.sponsorEmails?.includes(deletedBy) || 
                     clubData.sponsorEmail === deletedBy;
    const isAdmin = deletedBy === 'admin';
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