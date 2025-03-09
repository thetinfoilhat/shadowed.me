'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, arrayUnion, query, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import VisitModal from '@/components/VisitModal';
import ApplicantsDialog from '@/components/ApplicantsDialog';
import { Club, CompletedVisit, ClubListing } from '@/types/club';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-hot-toast';

interface Applicant {
  name: string;
  email: string;
  grade: string;
  school: string;
}

interface FirestoreData {
  applicants?: {
    name?: string;
    email?: string;
    grade?: string;
    school?: string;
  }[];
  createdAt?: { toDate(): Date };
}

interface VisitData {
  id?: string;
  name: string;
  school?: string;
  sponsorEmail: string;
  category: string;
  contactEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  slots: number;
  description: string;
  status?: 'pending' | 'approved' | 'rejected';
  captain?: string;
  applicants?: Applicant[];
  createdAt?: Date;
}

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    date.setDate(date.getDate() + 1);
    return format(date, "MMMM do yyyy");
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

function formatDateForCircle(dateStr: string | undefined) {
  if (!dateStr) return { month: '---', day: '--' };
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return { month: '---', day: '--' };
    }
    date.setDate(date.getDate() + 1);
    return {
      month: format(date, 'MMM'),
      day: format(date, 'd')
    };
  } catch (error) {
    console.error('Error formatting date for circle:', error);
    return { month: '---', day: '--' };
  }
}

function formatTime(timeStr: string | undefined) {
  if (!timeStr) return 'Time not set';
  
  try {
    const [start, end] = timeStr.split(' - ').map(time => {
      if (!time) return 'Invalid time';
      
      const [hours, minutes] = time.split(':');
      if (!hours || !minutes) return 'Invalid time';
      
      const hour = parseInt(hours, 10);
      if (isNaN(hour)) return 'Invalid time';
      
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    });

    if (start === 'Invalid time' || end === 'Invalid time') {
      return 'Invalid time format';
    }

    return `${start} - ${end}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time format';
  }
}

export default function CaptainDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [captainVisits, setCaptainVisits] = useState<Club[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Club | null>(null);
  const [viewingApplicants, setViewingApplicants] = useState<Club | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    visitId: string;
  }>({ isOpen: false, visitId: '' });
  const [confirmCompletion, setConfirmCompletion] = useState<{
    isOpen: boolean;
    visit: Club | null;
    completing: boolean;
  }>({ isOpen: false, visit: null, completing: false });
  const [isAdmin, setIsAdmin] = useState(false);
  const [sponsorNames, setSponsorNames] = useState<Record<string, string>>({});
  const [captainClubs, setCaptainClubs] = useState<ClubListing[]>([]);
  const [confirmClubDelete, setConfirmClubDelete] = useState<{
    isOpen: boolean;
    clubId: string;
  }>({ isOpen: false, clubId: '' });

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().role === 'admin');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };
    
    fetchUserRole();
  }, [user]);

  // Add function to fetch sponsor names
  const fetchSponsorNames = useCallback(async (visits: Club[]) => {
    const emails = visits
      .map(visit => visit.sponsorEmail)
      .filter((email): email is string => !!email);
    
    const uniqueEmails = [...new Set(emails)];
    const namesMap: Record<string, string> = {};
    
    try {
      for (const email of uniqueEmails) {
        const usersQuery = await getDocs(collection(db, 'users'));
        const userDoc = usersQuery.docs.find(doc => doc.data().email === email);
        
        if (userDoc) {
          const userData = userDoc.data();
          namesMap[email] = userData.displayName || '';
        }
      }
      
      setSponsorNames(namesMap);
    } catch (err) {
      console.error('Error fetching sponsor names:', err);
    }
  }, []);

  const fetchCaptainVisits = useCallback(async () => {
    try {
      const clubsRef = collection(db, 'opportunities');
      const querySnapshot = await getDocs(clubsRef);
      
      const visits = querySnapshot.docs
        .map(doc => {
          const data = doc.data() as FirestoreData;
          return {
            id: doc.id,
            ...data,
            applicants: (data.applicants || []).map((applicant): Applicant => ({
              name: applicant.name || '',
              email: applicant.email || '',
              grade: applicant.grade || '',
              school: applicant.school || ''
            })),
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Club;
        })
        // If user is admin, show all visits, otherwise only show visits where user is captain
        .filter(visit => isAdmin || visit.captain === user?.email)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setCaptainVisits(visits);
      
      // Fetch sponsor names after getting visits
      fetchSponsorNames(visits);
    } catch (err) {
      console.error('Error fetching visits:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, fetchSponsorNames]);

  useEffect(() => {
    if (user) {
      fetchCaptainVisits();
    } else {
      setLoading(false);
    }
  }, [user, fetchCaptainVisits]);

  const saveVisit = async (data: VisitData) => {
    try {
      const visitData = {
        name: data.name,
        school: data.school || '',
        sponsorEmail: data.sponsorEmail,
        category: data.category,
        contactEmail: data.contactEmail,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description,
        time: `${data.startTime} - ${data.endTime}`,
        captain: user?.email,
        applicants: [],
        status: 'pending',
        slots: data.slots || 0,
      };

      if (data.id) {
        const visitRef = doc(db, 'opportunities', data.id);
        await updateDoc(visitRef, visitData);
      } else {
        const visitRef = collection(db, 'opportunities');
        await addDoc(visitRef, {
          ...visitData,
          createdAt: new Date(),
        });
      }
      
      await fetchCaptainVisits();
    } catch (error) {
      console.error('Error saving visit:', error);
      throw error;
    }
  };

  const handleDeleteClick = (visitId: string) => {
    setConfirmDelete({ isOpen: true, visitId });
  };

  const handleDelete = async (visitId: string) => {
    try {
      await deleteDoc(doc(db, 'opportunities', visitId));
      await fetchCaptainVisits();
    } catch (error) {
      console.error('Error deleting visit:', error);
    }
  };

  const handleCompletionClick = (visit: Club, completing: boolean) => {
    setConfirmCompletion({ 
      isOpen: true, 
      visit, 
      completing 
    });
  };

  const handleConfirmCompletion = async () => {
    if (!confirmCompletion.visit) return;
    
    try {
      await handleMarkCompleted(
        confirmCompletion.visit, 
        confirmCompletion.completing
      );
    } finally {
      setConfirmCompletion({ isOpen: false, visit: null, completing: false });
    }
  };

  const handleMarkCompleted = async (visit: Club, completed: boolean) => {
    try {
      const visitRef = doc(db, 'opportunities', visit.id);
      await updateDoc(visitRef, {
        completed: completed
      });

      const completedVisitData = {
        id: visit.id,
        name: visit.name,
        school: visit.school,
        category: visit.category,
        date: visit.date,
        time: visit.time,
        description: visit.description,
        completedAt: new Date().toISOString()
      };

      // Process each applicant
      for (const applicant of visit.applicants) {
        const userQuery = query(
          collection(db, 'users'), 
          where('email', '==', applicant.email)
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const userData = userDoc.data();
          
          if (completed) {
            // Add to completedVisits if not already present
            const existingVisit = (userData.completedVisits || [])
              .find((v: CompletedVisit) => v.id === visit.id);
            
            if (!existingVisit) {
              await updateDoc(doc(db, 'users', userDoc.id), {
                completedVisits: arrayUnion(completedVisitData)
              });
            }
          } else {
            // Remove from completedVisits
            const updatedCompletedVisits = (userData.completedVisits || [])
              .filter((v: CompletedVisit) => v.id !== visit.id);
            
            await updateDoc(doc(db, 'users', userDoc.id), {
              completedVisits: updatedCompletedVisits
            });
          }
        }
      }

      await fetchCaptainVisits();
    } catch (error) {
      console.error('Error updating visit completion status:', error);
    }
  };

  // Add fetch function for clubs
  const fetchCaptainClubs = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      const clubsRef = collection(db, 'clubs');
      const q = query(clubsRef, where('captain', '==', user.email));
      const querySnapshot = await getDocs(q);
      
      const clubsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClubListing[];
      
      setCaptainClubs(clubsData);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Failed to load clubs');
    }
  }, [user]);

  // Add delete handler
  const handleClubDelete = async (clubId: string) => {
    try {
      await deleteDoc(doc(db, 'clubs', clubId));
      await fetchCaptainClubs();
      toast.success('Club deleted successfully');
    } catch (error) {
      console.error('Error deleting club:', error);
      toast.error('Failed to delete club');
    }
  };

  useEffect(() => {
    fetchCaptainClubs();
  }, [fetchCaptainClubs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full px-6 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-[#38BFA1]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-3xl font-semibold text-[#0A2540] mb-4">
              Please Sign In
            </h1>
            <p className="text-gray-600 mb-8">
              Sign in to manage your club visits and view applicants
            </p>
            <button
              onClick={() => document.querySelector<HTMLButtonElement>('[data-login-button]')?.click()}
              className="bg-[#38BFA1] text-white px-8 py-3 rounded-lg hover:bg-[#2DA891] transition-colors inline-flex items-center gap-2"
            >
              <span>Sign In</span>
              <span>→</span>
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            Want to create opportunities?{' '}
            <Link href="/about" className="text-[#38BFA1] hover:underline">
              Learn more about becoming a captain
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#0A2540]">Captain Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#38BFA1] text-white px-4 py-2 rounded-lg hover:bg-[#2DA891] transition-colors"
            >
              Create Visit
            </button>
          </div>
        </div>

        {captainVisits.length === 0 ? (
          <div className="bg-white rounded-xl p-16 shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">
                Create Your First Club Visit
              </h2>
              <p className="text-gray-600 mb-8">
                Let students experience your club by scheduling a visit opportunity.
              </p>
              <button 
                onClick={() => {
                  setEditingVisit(null);
                  setIsCreateModalOpen(true);
                }}
                className="bg-[#38BFA1]/10 text-[#38BFA1] px-6 py-3 rounded-md hover:bg-[#38BFA1]/20 transition-all inline-flex items-center gap-2"
              >
                <span>Schedule Visit</span>
                <span>→</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <h2 className="text-xl font-semibold text-[#0A2540] mb-6">
                Scheduled Club Visits ({captainVisits.length})
              </h2>
              
              <div className="space-y-4">
                {captainVisits.map((visit) => (
                  <div 
                    key={visit.id}
                    className="group flex items-center gap-6 p-6 rounded-lg border border-gray-100 hover:border-[#38BFA1]/30 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 cursor-pointer bg-white relative"
                  >
                    {/* Content wrapper with conditional opacity */}
                    <div className={`flex items-center gap-6 ${visit.completed ? 'opacity-50' : ''}`}>
                      {/* Date Circle */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#38BFA1]/10 flex flex-col items-center justify-center text-[#38BFA1]">
                        <div className="text-sm font-medium">{formatDateForCircle(visit.date).month}</div>
                        <div className="text-xl font-bold">{formatDateForCircle(visit.date).day}</div>
                      </div>
                      
                      {/* Visit Details */}
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-[#0A2540]">
                            {visit.name}
                          </h3>
                          {isAdmin && visit.captain !== user?.email && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                              Captain: {visit.captain}
                            </span>
                          )}
                        </div>
                        
                        {/* Approval Status Bar */}
                        {visit.status && (
                          <div className={`mb-3 px-3 py-1.5 rounded-md text-sm font-medium ${
                            visit.status === 'pending' 
                              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                              : visit.status === 'approved' 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {visit.status === 'pending' && (
                              <span>Waiting for approval from <span className="font-semibold">
                                {visit.sponsorEmail} {visit.sponsorEmail && sponsorNames[visit.sponsorEmail] ? `(${sponsorNames[visit.sponsorEmail]})` : ''}
                              </span></span>
                            )}
                            {visit.status === 'approved' && (
                              <span>Approved by <span className="font-semibold">
                                {visit.sponsorEmail} {visit.sponsorEmail && sponsorNames[visit.sponsorEmail] ? `(${sponsorNames[visit.sponsorEmail]})` : ''}
                              </span></span>
                            )}
                            {visit.status === 'rejected' && (
                              <span>Rejected by <span className="font-semibold">
                                {visit.sponsorEmail} {visit.sponsorEmail && sponsorNames[visit.sponsorEmail] ? `(${sponsorNames[visit.sponsorEmail]})` : ''}
                              </span></span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex gap-8">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">School:</span>
                              <span className="text-[#0A2540]">{visit.school}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Time:</span>
                              <span className="text-[#0A2540]">{formatTime(visit.time)}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Date:</span>
                              <span className="text-[#0A2540]">{formatDate(visit.date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500">Available Slots:</span>
                              <span className="text-[#0A2540]">{visit.slots}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Category:</span>
                            <span className="text-[#38BFA1]">{visit.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Completion tag - outside the opacity wrapper */}
                    {visit.completed && (
                      <div className="absolute top-4 left-4 px-2 py-1 bg-[#38BFA1]/10 text-[#38BFA1] text-sm rounded-full">
                        Completed
                      </div>
                    )}

                    {/* Action Buttons - outside the opacity wrapper */}
                    <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <button 
                        className="bg-[#38BFA1]/10 text-[#38BFA1] p-2 rounded-md hover:bg-[#38BFA1]/20 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompletionClick(visit, !visit.completed);
                        }}
                      >
                        <span className="text-sm">
                          {visit.completed ? 'Unmark as Completed' : 'Mark as Completed'}
                        </span>
                      </button>
                      <button 
                        className="bg-[#38BFA1]/10 text-[#38BFA1] p-2 rounded-md hover:bg-[#38BFA1]/20 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingVisit(visit);
                          setIsCreateModalOpen(true);
                        }}
                      >
                        <span className="text-sm">Edit</span>
                      </button>
                      <button 
                        className="bg-[#38BFA1]/10 text-[#38BFA1] p-2 rounded-md hover:bg-[#38BFA1]/20 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingApplicants(visit);
                        }}
                      >
                        <span className="text-sm">View Applicants</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(visit.id);
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-md transition-colors"
                      >
                        Delete Visit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <VisitModal
          isOpen={isCreateModalOpen}
          onCloseAction={() => {
            setIsCreateModalOpen(false);
            setEditingVisit(null);
          }}
          onSubmitAction={saveVisit}
          initialData={editingVisit ? {
            id: editingVisit.id,
            name: editingVisit.name,
            sponsorEmail: editingVisit.sponsorEmail || '',
            category: editingVisit.category || '',
            contactEmail: editingVisit.contactEmail || '',
            date: editingVisit.date || '',
            startTime: editingVisit.startTime || '',
            endTime: editingVisit.endTime || '',
            slots: editingVisit.slots || 0,
            description: editingVisit.description || '',
            captain: editingVisit.captain,
            applicants: editingVisit.applicants,
            status: editingVisit.status,
            createdAt: editingVisit.createdAt,
            school: editingVisit.school
          } : null}
        />

        <ApplicantsDialog
          isOpen={!!viewingApplicants}
          onCloseAction={() => setViewingApplicants(null)}
          applicants={viewingApplicants?.applicants || []}
        />

        <ConfirmDialog
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete({ isOpen: false, visitId: '' })}
          onConfirm={() => handleDelete(confirmDelete.visitId)}
          title="Delete Visit"
          message="Are you sure you want to delete this visit opportunity? This action cannot be undone."
          confirmText="Delete"
        />

        <ConfirmDialog
          isOpen={confirmCompletion.isOpen}
          onClose={() => setConfirmCompletion({ isOpen: false, visit: null, completing: false })}
          onConfirm={handleConfirmCompletion}
          title={confirmCompletion.completing ? "Mark Visit as Completed" : "Unmark Visit as Completed"}
          message={confirmCompletion.completing 
            ? "Are you sure you want to mark this visit as completed? This will move it to students' completed visits."
            : "Are you sure you want to unmark this visit as completed? This will remove it from students' completed visits."
          }
          confirmText={confirmCompletion.completing ? "Mark as Completed" : "Unmark as Completed"}
        />

        <div className="mt-12 bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <h2 className="text-xl font-semibold text-[#0A2540] mb-6">
            Your Clubs ({captainClubs.length})
          </h2>
          
          <div className="space-y-4">
            {captainClubs.map((club) => (
              <div 
                key={club.id}
                className="flex items-center justify-between p-6 rounded-lg border border-gray-100 hover:border-[#38BFA1]/30 hover:shadow-lg transition-all"
              >
                <div>
                  <h3 className="text-lg font-medium text-[#0A2540]">{club.name}</h3>
                  <p className="text-gray-600 mt-1">{club.description}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-[#38BFA1]/10 text-[#38BFA1] text-sm rounded-full">
                    {club.category}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmClubDelete({ isOpen: true, clubId: club.id })}
                    className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ConfirmDialog
          isOpen={confirmClubDelete.isOpen}
          onClose={() => setConfirmClubDelete({ isOpen: false, clubId: '' })}
          onConfirm={() => handleClubDelete(confirmClubDelete.clubId)}
          title="Delete Club"
          message="Are you sure you want to delete this club? This action cannot be undone."
          confirmText="Delete"
        />
      </div>
    </div>
  );
} 