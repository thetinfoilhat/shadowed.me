import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

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
    
    // Add the new submission
    const newSubmission = {
      name,
      email,
      timestamp: Date.now()
    };

    // Combine current submissions with new submission and sort alphabetically by name
    const updatedSubmissions = [...currentSubmissions, newSubmission].sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    // Update the document with the sorted submissions
    await updateDoc(websiteRef, {
      'interestForm.submissions': updatedSubmissions
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting interest form:', error);
    return NextResponse.json(
      { error: 'Failed to submit interest form' },
      { status: 500 }
    );
  }
} 