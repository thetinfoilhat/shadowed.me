import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MeetingData {
  id: string;
  participants?: Array<{ email: string; name: string; grade?: string; school?: string; signupDate?: Date }>;
  currentParticipants?: number;
  updatedAt?: Date;
}

// POST - Sign up for a club event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, participant } = body;

    if (!eventId || !participant || !participant.email || !participant.name) {
      return NextResponse.json({ 
        error: 'Event ID, participant email, and name are required' 
      }, { status: 400 });
    }

    // Get the event
    const eventRef = doc(db, 'clubEvents', eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventData = eventDoc.data();
    
    // Check if event is active
    if (eventData.status !== 'active') {
      return NextResponse.json({ error: 'This event is not accepting participants' }, { status: 400 });
    }
    
    // Check if user is already signed up
    const isAlreadySignedUp = eventData.participants?.some((p: { email: string }) => p.email === participant.email);
    if (isAlreadySignedUp) {
      return NextResponse.json({ error: 'You are already signed up for this event' }, { status: 400 });
    }

    // Check if event is full
    if (eventData.maxParticipants && eventData.currentParticipants >= eventData.maxParticipants) {
      return NextResponse.json({ error: 'This event is full' }, { status: 400 });
    }

    // Add participant to event
    const newParticipant = {
      name: participant.name,
      email: participant.email,
      grade: participant.grade || '',
      school: participant.school || '',
      signupDate: new Date()
    };

    await updateDoc(eventRef, {
      participants: arrayUnion(newParticipant),
      currentParticipants: (eventData.currentParticipants || 0) + 1,
      updatedAt: new Date()
    });

    // Also update the event in the club's meetings array for backward compatibility
    const clubRef = doc(db, 'clubSites', eventData.clubId);
    const clubDoc = await getDoc(clubRef);
    
    if (clubDoc.exists()) {
      const clubData = clubDoc.data();
      const existingMeetings = clubData.meetings || [];
      const updatedMeetings = existingMeetings.map((m: MeetingData) => {
        if (m.id === eventId) {
          return {
            ...m,
            participants: [...(m.participants || []), newParticipant],
            currentParticipants: (m.currentParticipants || 0) + 1,
            updatedAt: new Date()
          };
        }
        return m;
      });

      await updateDoc(clubRef, {
        meetings: updatedMeetings,
        updatedAt: new Date()
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully signed up for event' 
    });
  } catch (error) {
    console.error('Error signing up for event:', error);
    return NextResponse.json({ error: 'Failed to sign up for event' }, { status: 500 });
  }
}

// DELETE - Sign out of a club event
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, participantEmail } = body;

    if (!eventId || !participantEmail) {
      return NextResponse.json({ 
        error: 'Event ID and participant email are required' 
      }, { status: 400 });
    }

    // Get the event
    const eventRef = doc(db, 'clubEvents', eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventData = eventDoc.data();
    
    // Check if user is signed up
    const participant = eventData.participants?.find((p: { email: string }) => p.email === participantEmail);
    if (!participant) {
      return NextResponse.json({ error: 'You are not signed up for this event' }, { status: 400 });
    }

    // Remove participant from event
    const updatedParticipants = (eventData.participants || []).filter((p: { email: string }) => p.email !== participantEmail);
    
    await updateDoc(eventRef, {
      participants: updatedParticipants,
      currentParticipants: Math.max(0, (eventData.currentParticipants || 0) - 1),
      updatedAt: new Date()
    });

    // Also update the event in the club's meetings array for backward compatibility
    const clubRef = doc(db, 'clubSites', eventData.clubId);
    const clubDoc = await getDoc(clubRef);
    
    if (clubDoc.exists()) {
      const clubData = clubDoc.data();
      const existingMeetings = clubData.meetings || [];
      const updatedMeetings = existingMeetings.map((m: MeetingData) => {
        if (m.id === eventId) {
          return {
            ...m,
            participants: (m.participants || []).filter((p: { email: string }) => p.email !== participantEmail),
            currentParticipants: Math.max(0, (m.currentParticipants || 0) - 1),
            updatedAt: new Date()
          };
        }
        return m;
      });

      await updateDoc(clubRef, {
        meetings: updatedMeetings,
        updatedAt: new Date()
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully signed out of event' 
    });
  } catch (error) {
    console.error('Error signing out of event:', error);
    return NextResponse.json({ error: 'Failed to sign out of event' }, { status: 500 });
  }
} 