import { NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    // Fetch all active club posts from all clubs
    const postsRef = collection(db, 'clubPosts');
    const q = query(postsRef, where('status', '==', 'active'));
    const postsSnapshot = await getDocs(q);
    
    const events = postsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        clubId: data.clubId,
        clubName: data.clubName,
        title: data.title,
        content: data.content,
        postType: data.postType || 'event',
        date: data.date,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        location: data.location || null,
        maxParticipants: data.maxParticipants || null,
        currentParticipants: data.currentParticipants || 0,
        participants: data.participants || [],
        createdBy: data.createdBy,
        createdByEmail: data.createdByEmail,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        status: data.status || 'active',
        tags: data.tags || [],
        isRecurring: data.isRecurring || false,
        recurringPattern: data.recurringPattern || null,
        recurringDays: data.recurringDays || []
      };
    });

    // Sort events by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ 
      success: true, 
      events,
      count: events.length 
    });
  } catch (error) {
    console.error('Error fetching all events:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch events' 
    }, { status: 500 });
  }
}
