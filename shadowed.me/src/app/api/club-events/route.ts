import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ClubEvent {
  id?: string;
  clubId: string;
  clubName: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants?: number;
  currentParticipants: number;
  participants: Array<{
    name: string;
    email: string;
    grade?: string;
    school?: string;
    signupDate: Date;
  }>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'cancelled' | 'completed';
  category?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringPattern?: 'weekly' | 'biweekly' | 'monthly';
  recurringDays?: string[];
}

interface MeetingData {
  id: string;
  participants?: Array<{ email: string; name: string; grade?: string; school?: string; signupDate?: Date }>;
  currentParticipants?: number;
  updatedAt?: Date;
}

// GET - Get events for a specific club
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');
    const status = searchParams.get('status') || 'active';

    if (!clubId) {
      return NextResponse.json({ error: 'Club ID is required' }, { status: 400 });
    }

    const eventsRef = collection(db, 'clubEvents');
    let eventsQuery = query(eventsRef, where('clubId', '==', clubId));
    
    if (status !== 'all') {
      eventsQuery = query(eventsQuery, where('status', '==', status));
    }

    const querySnapshot = await getDocs(eventsQuery);
    const events = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      participants: doc.data().participants?.map((p: { signupDate?: { toDate(): Date } }) => ({
        ...p,
        signupDate: p.signupDate?.toDate()
      })) || []
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching club events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST - Create a new club event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      clubId, 
      clubName, 
      title, 
      description, 
      date, 
      startTime, 
      endTime, 
      location, 
      maxParticipants,
      category,
      tags,
      isRecurring,
      recurringPattern,
      recurringDays,
      createdBy 
    } = body;

    if (!clubId || !clubName || !title || !date || !startTime || !endTime || !location || !createdBy) {
      return NextResponse.json({ 
        error: 'Missing required fields: clubId, clubName, title, date, startTime, endTime, location, createdBy' 
      }, { status: 400 });
    }

    // Verify the user has permission to create events for this club
    const clubRef = doc(db, 'clubSites', clubId);
    const clubDoc = await getDoc(clubRef);
    
    if (!clubDoc.exists()) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const clubData = clubDoc.data();
    const isCaptain = clubData.captainEmails?.includes(createdBy) || 
                     clubData.captains?.includes(createdBy) || 
                     clubData.captain === createdBy;
    const isSponsor = clubData.sponsorEmails?.includes(createdBy) || 
                     clubData.sponsorEmail === createdBy;

    if (!isCaptain && !isSponsor) {
      return NextResponse.json({ error: 'You do not have permission to create events for this club' }, { status: 403 });
    }

    const eventData: Omit<ClubEvent, 'id'> = {
      clubId,
      clubName,
      title,
      description: description || '',
      date,
      startTime,
      endTime,
      location,
      maxParticipants: maxParticipants || null,
      currentParticipants: 0,
      participants: [],
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      category: category || '',
      tags: tags || [],
      isRecurring: isRecurring || false,
      recurringPattern: recurringPattern || null,
      recurringDays: recurringDays || []
    };

    const docRef = await addDoc(collection(db, 'clubEvents'), eventData);
    
    // Also add to the club's meetings array for backward compatibility
    await updateDoc(clubRef, {
      meetings: [...(clubData.meetings || []), { ...eventData, id: docRef.id }],
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      eventId: docRef.id,
      message: 'Event created successfully' 
    });
  } catch (error) {
    console.error('Error creating club event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

// PUT - Update an existing club event
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, updates, updatedBy } = body;

    if (!eventId || !updatedBy) {
      return NextResponse.json({ error: 'Event ID and updatedBy are required' }, { status: 400 });
    }

    // Get the event to verify permissions
    const eventRef = doc(db, 'clubEvents', eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventData = eventDoc.data();
    
    // Verify the user has permission to update this event
    const clubRef = doc(db, 'clubSites', eventData.clubId);
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

    if (!isCaptain && !isSponsor) {
      return NextResponse.json({ error: 'You do not have permission to update this event' }, { status: 403 });
    }

    // Update the event
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: new Date()
    });

    // Also update in the club's meetings array
    const updatedMeetings = (clubData.meetings || []).map((meeting: MeetingData) => 
      meeting.id === eventId 
        ? { ...meeting, ...updates, updatedAt: new Date() }
        : meeting
    );

    await updateDoc(clubRef, {
      meetings: updatedMeetings,
      updatedAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Event updated successfully' 
    });
  } catch (error) {
    console.error('Error updating club event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// DELETE - Delete a club event
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, deletedBy } = body;

    if (!eventId || !deletedBy) {
      return NextResponse.json({ error: 'Event ID and deletedBy are required' }, { status: 400 });
    }

    // Get the event to verify permissions
    const eventRef = doc(db, 'clubEvents', eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventData = eventDoc.data();
    
    // Verify the user has permission to delete this event
    const clubRef = doc(db, 'clubSites', eventData.clubId);
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

    if (!isCaptain && !isSponsor) {
      return NextResponse.json({ error: 'You do not have permission to delete this event' }, { status: 403 });
    }

    // Delete the event
    await deleteDoc(eventRef);

    // Also remove from the club's meetings array
    const updatedMeetings = (clubData.meetings || []).filter((meeting: MeetingData) => meeting.id !== eventId);
    
    await updateDoc(clubRef, {
      meetings: updatedMeetings,
      updatedAt: new Date()
    });

    // Remove the event from all participants' personal calendars
    const participants = eventData.participants || [];
    for (const participant of participants) {
      try {
        // Find user by email
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('email', '==', participant.email));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const userData = userDoc.data();
          const personalEvents = userData.personalEvents || [];
          
          // Remove the event from personal events
          const updatedPersonalEvents = personalEvents.filter(
            (event: { id: string }) => event.id !== `club-${eventId}`
          );
          
          await updateDoc(doc(db, 'users', userDoc.id), {
            personalEvents: updatedPersonalEvents
          });
        }
      } catch (error) {
        console.error(`Error removing event from participant ${participant.email}:`, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Event deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting club event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
} 