import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// POST - Join a club post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, participant } = body;

    console.log('Join request received:', { postId, participant });

    if (!postId || !participant || !participant.email || !participant.name) {
      console.error('Missing required fields:', { postId, participant });
      return NextResponse.json({ 
        error: 'Post ID, participant email, and name are required' 
      }, { status: 400 });
    }

    // Get the post
    const postRef = doc(db, 'clubPosts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const postData = postDoc.data() as {
      status: string;
      participants?: { email: string }[];
      maxParticipants?: number;
      currentParticipants?: number;
      title?: string;
      content?: string;
      date: string;
      startTime?: string;
      endTime?: string;
      location?: string;
    };
    
    // Check if post is active
    if (postData.status !== 'active') {
      return NextResponse.json({ error: 'This post is not accepting participants' }, { status: 400 });
    }
    
    // Check if user is already joined
    const isAlreadyJoined = postData.participants?.some((p) => p.email === participant.email);
    if (isAlreadyJoined) {
      return NextResponse.json({ error: 'You are already joined to this post' }, { status: 400 });
    }

    // Check if post is full
    if (postData.maxParticipants && (postData.currentParticipants || 0) >= postData.maxParticipants) {
      return NextResponse.json({ error: 'This post is full' }, { status: 400 });
    }

    // Add participant to post
    const newParticipant = {
      name: participant.name,
      email: participant.email,
      grade: participant.grade || '',
      school: participant.school || '',
      joinDate: new Date()
    };

    // Update post participants
    const updatedParticipants = [
      ...(postData.participants || []),
      newParticipant
    ];
    await updateDoc(postRef, {
      participants: updatedParticipants,
      currentParticipants: (postData.currentParticipants || 0) + 1,
      updatedAt: new Date()
    });

    // Also add to the student's personal calendar (users.personalEvents)
    try {
      const usersRef = collection(db, 'users');
      const userQ = query(usersRef, where('email', '==', participant.email));
      const userSnap = await getDocs(userQ);
      if (!userSnap.empty) {
        const userDocRef = doc(db, 'users', userSnap.docs[0].id);
      const userData = ((await getDoc(userDocRef)).data() || {}) as { personalEvents?: { id: string }[] };
      const existingPersonalEvents = userData.personalEvents || [];
        const personalEventId = `clubPost:${postId}`;
        const alreadyHas = existingPersonalEvents.some((e) => e.id === personalEventId);
        const newPersonalEvent = {
          id: personalEventId,
          title: postData.title || 'Club Event',
          description: postData.content || '',
          date: postData.date,
          startTime: postData.startTime || '',
          endTime: postData.endTime || '',
          location: postData.location || '',
          color: '#3B82F6',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const updatedPersonal = alreadyHas
          ? existingPersonalEvents.map((e) => (e.id === personalEventId ? { ...newPersonalEvent } : e))
          : [...existingPersonalEvents, newPersonalEvent];
        await updateDoc(userDocRef, { personalEvents: updatedPersonal });
      }
    } catch (e) {
      console.error('Failed to update user personal calendar for join:', e);
      // Do not fail the main request if personal calendar update fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully joined post' 
    });
  } catch (error) {
    console.error('Error joining post:', error);
    return NextResponse.json({ error: 'Failed to join post' }, { status: 500 });
  }
}

// DELETE - Leave a club post
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, participantEmail } = body;

    if (!postId || !participantEmail) {
      return NextResponse.json({ 
        error: 'Post ID and participant email are required' 
      }, { status: 400 });
    }

    // Get the post
    const postRef = doc(db, 'clubPosts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const postData = postDoc.data() as {
      status: string;
      participants?: { email: string }[];
      maxParticipants?: number;
      currentParticipants?: number;
      title?: string;
      content?: string;
      date: string;
      startTime?: string;
      endTime?: string;
      location?: string;
    };
    
    // Check if user is joined
    const participant = postData.participants?.find((p: { email: string }) => p.email === participantEmail);
    if (!participant) {
      return NextResponse.json({ error: 'You are not joined to this post' }, { status: 400 });
    }

    // Remove participant from post
    const updatedParticipants = (postData.participants || []).filter((p: { email: string }) => p.email !== participantEmail);
    
    await updateDoc(postRef, {
      participants: updatedParticipants,
      currentParticipants: Math.max(0, (postData.currentParticipants || 0) - 1),
      updatedAt: new Date()
    });

    // Also remove from the student's personal calendar
    try {
      const usersRef = collection(db, 'users');
      const userQ = query(usersRef, where('email', '==', participantEmail));
      const userSnap = await getDocs(userQ);
      if (!userSnap.empty) {
        const userDocRef = doc(db, 'users', userSnap.docs[0].id);
        const userData = ((await getDoc(userDocRef)).data() || {}) as { personalEvents?: { id: string }[] };
        const existingPersonalEvents = userData.personalEvents || [];
        const personalEventId = `clubPost:${postId}`;
        const updatedPersonal = existingPersonalEvents.filter((e) => e.id !== personalEventId);
        await updateDoc(userDocRef, { personalEvents: updatedPersonal });
      }
    } catch (e) {
      console.error('Failed to update user personal calendar for leave:', e);
      // Do not fail main request
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully left post' 
    });
  } catch (error) {
    console.error('Error leaving post:', error);
    return NextResponse.json({ error: 'Failed to leave post' }, { status: 500 });
  }
} 