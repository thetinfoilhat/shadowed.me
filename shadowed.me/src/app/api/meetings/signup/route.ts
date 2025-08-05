import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, getDocs, updateDoc, query, where, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MeetingOpportunity } from '@/types/club';

// POST - Sign up for a meeting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetingId, userEmail, userName, userGrade, userSchool } = body;

    if (!meetingId || !userEmail || !userName) {
      return NextResponse.json({ error: 'Meeting ID, user email, and name are required' }, { status: 400 });
    }

    // Get the meeting
    const meetingRef = doc(db, 'meetings', meetingId);
    const meetingDoc = await getDocs(query(collection(db, 'meetings'), where('__name__', '==', meetingId)));
    
    if (meetingDoc.empty) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const meeting = meetingDoc.docs[0].data();
    
    // Check if user is already signed up
    const isAlreadySignedUp = meeting.participants?.some((p: { email: string }) => p.email === userEmail);
    if (isAlreadySignedUp) {
      return NextResponse.json({ error: 'You are already signed up for this meeting' }, { status: 400 });
    }

    // Check if meeting is full
    if (meeting.maxParticipants && meeting.currentParticipants >= meeting.maxParticipants) {
      return NextResponse.json({ error: 'This meeting is full' }, { status: 400 });
    }

    // Add participant to meeting
    const newParticipant = {
      name: userName,
      email: userEmail,
      grade: userGrade,
      school: userSchool,
      signupDate: new Date()
    };

    await updateDoc(meetingRef, {
      participants: arrayUnion(newParticipant),
      currentParticipants: (meeting.currentParticipants || 0) + 1,
      updatedAt: new Date()
    });

    // Update the meeting in the club document as well
    const clubRef = doc(db, 'clubSites', meeting.clubId);
    const clubDoc = await getDocs(query(collection(db, 'clubSites'), where('__name__', '==', meeting.clubId)));
    
    if (!clubDoc.empty) {
      const clubData = clubDoc.docs[0].data();
      const existingMeetings = clubData.meetings || [];
              const updatedMeetings = existingMeetings.map((m: MeetingOpportunity) => {
          if (m.id === meetingId) {
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
      message: 'Successfully signed up for meeting' 
    });
  } catch (error) {
    console.error('Error signing up for meeting:', error);
    return NextResponse.json({ error: 'Failed to sign up for meeting' }, { status: 500 });
  }
}

// DELETE - Sign out of a meeting
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('meetingId');
    const userEmail = searchParams.get('userEmail');

    if (!meetingId || !userEmail) {
      return NextResponse.json({ error: 'Meeting ID and user email are required' }, { status: 400 });
    }

    // Get the meeting
    const meetingRef = doc(db, 'meetings', meetingId);
    const meetingDoc = await getDocs(query(collection(db, 'meetings'), where('__name__', '==', meetingId)));
    
    if (meetingDoc.empty) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const meeting = meetingDoc.docs[0].data();
    
    // Check if user is signed up
    const participant = meeting.participants?.find((p: { email: string }) => p.email === userEmail);
    if (!participant) {
      return NextResponse.json({ error: 'You are not signed up for this meeting' }, { status: 400 });
    }

    // Remove participant from meeting
    const updatedParticipants = meeting.participants.filter((p: { email: string }) => p.email !== userEmail);
    
    await updateDoc(meetingRef, {
      participants: updatedParticipants,
      currentParticipants: Math.max(0, (meeting.currentParticipants || 0) - 1),
      updatedAt: new Date()
    });

    // Update the meeting in the club document as well
    const clubRef = doc(db, 'clubSites', meeting.clubId);
    const clubDoc = await getDocs(query(collection(db, 'clubSites'), where('__name__', '==', meeting.clubId)));
    
    if (!clubDoc.empty) {
      const clubData = clubDoc.docs[0].data();
      const existingMeetings = clubData.meetings || [];
              const updatedMeetings = existingMeetings.map((m: MeetingOpportunity) => {
          if (m.id === meetingId) {
            return {
              ...m,
              participants: m.participants.filter((p: { email: string }) => p.email !== userEmail),
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
      message: 'Successfully signed out of meeting' 
    });
  } catch (error) {
    console.error('Error signing out of meeting:', error);
    return NextResponse.json({ error: 'Failed to sign out of meeting' }, { status: 500 });
  }
} 