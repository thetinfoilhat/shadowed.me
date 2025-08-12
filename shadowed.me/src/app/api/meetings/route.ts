import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MeetingOpportunity } from '@/types/club';

// GET - Fetch meetings for a club
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');
    const status = searchParams.get('status') || 'active';

    if (!clubId) {
      return NextResponse.json({ error: 'Club ID is required' }, { status: 400 });
    }

    const meetingsRef = collection(db, 'meetings');
    const q = query(
      meetingsRef,
      where('clubId', '==', clubId),
      where('status', '==', status),
      orderBy('startDate', 'asc')
    );

    const snapshot = await getDocs(q);
    const meetings: MeetingOpportunity[] = [];

    snapshot.forEach((doc) => {
      meetings.push({
        id: doc.id,
        ...doc.data()
      } as MeetingOpportunity);
    });

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

// POST - Create a new meeting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const meetingData = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentParticipants: 0,
      participants: [],
      status: 'active'
    };

    const meetingsRef = collection(db, 'meetings');
    const docRef = await addDoc(meetingsRef, meetingData);

    // Update the club document to include this meeting
    const clubRef = doc(db, 'clubSites', body.clubId);
    const clubDoc = await getDocs(query(collection(db, 'clubSites'), where('__name__', '==', body.clubId)));
    
    if (!clubDoc.empty) {
      const clubData = clubDoc.docs[0].data();
      const existingMeetings = clubData.meetings || [];
      existingMeetings.push({
        id: docRef.id,
        ...meetingData
      });

      await updateDoc(clubRef, {
        meetings: existingMeetings,
        updatedAt: new Date()
      });
    }

    return NextResponse.json({ 
      success: true, 
      meetingId: docRef.id,
      message: 'Meeting created successfully' 
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
  }
}

// PUT - Update a meeting
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetingId, ...updateData } = body;

    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    const meetingRef = doc(db, 'meetings', meetingId);
    await updateDoc(meetingRef, {
      ...updateData,
      updatedAt: new Date()
    });

    // Update the meeting in the club document as well
    const meetingDoc = await getDocs(query(collection(db, 'meetings'), where('__name__', '==', meetingId)));
    if (!meetingDoc.empty) {
      const meeting = meetingDoc.docs[0].data();
      const clubRef = doc(db, 'clubSites', meeting.clubId);
      const clubDoc = await getDocs(query(collection(db, 'clubSites'), where('__name__', '==', meeting.clubId)));
      
      if (!clubDoc.empty) {
        const clubData = clubDoc.docs[0].data();
        const existingMeetings = clubData.meetings || [];
        const updatedMeetings = existingMeetings.map((m: MeetingOpportunity) => 
          m.id === meetingId ? { ...m, ...updateData, updatedAt: new Date() } : m
        );

        await updateDoc(clubRef, {
          meetings: updatedMeetings,
          updatedAt: new Date()
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Meeting updated successfully' 
    });
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
  }
}

// DELETE - Delete a meeting
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get('meetingId');

    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    // Get meeting data before deleting
    const meetingDoc = await getDocs(query(collection(db, 'meetings'), where('__name__', '==', meetingId)));
    if (!meetingDoc.empty) {
      const meeting = meetingDoc.docs[0].data();
      
      // Remove meeting from club document
      const clubRef = doc(db, 'clubSites', meeting.clubId);
      const clubDoc = await getDocs(query(collection(db, 'clubSites'), where('__name__', '==', meeting.clubId)));
      
      if (!clubDoc.empty) {
        const clubData = clubDoc.docs[0].data();
        const existingMeetings = clubData.meetings || [];
        const updatedMeetings = existingMeetings.filter((m: MeetingOpportunity) => m.id !== meetingId);

        await updateDoc(clubRef, {
          meetings: updatedMeetings,
          updatedAt: new Date()
        });
      }
    }

    // Delete the meeting document
    const meetingRef = doc(db, 'meetings', meetingId);
    await deleteDoc(meetingRef);

    return NextResponse.json({ 
      success: true, 
      message: 'Meeting deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 });
  }
} 