'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, arrayUnion, query, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import VisitModal from '@/components/VisitModal';
import ApplicantsDialog from '@/components/ApplicantsDialog';
import { Club, CompletedVisit } from '@/types/club';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

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
  sponsorEmail?: string;
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
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 1);
  return format(date, "MMMM do yyyy");
}

function formatTime(timeStr: string | undefined) {
  if (!timeStr) return '';
  
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
  const [upcomingExpanded, setUpcomingExpanded] = useState(true);
  const [completedExpanded, setCompletedExpanded] = useState(false);

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
      for (const applicant of visit.applicants || []) {
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

      toast.success(completed ? 'Visit marked as completed' : 'Visit unmarked as completed');
      await fetchCaptainVisits();
    } catch (error) {
      console.error('Error updating visit completion status:', error);
      toast.error('Failed to update visit status');
    }
  };

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
                Start by creating a club visit opportunity for students to sign up
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#38BFA1] text-white px-6 py-3 rounded-lg hover:bg-[#2DA891] transition-colors"
              >
                Create Visit
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Visits Section */}
            <div>
              <button 
                onClick={() => setUpcomingExpanded(!upcomingExpanded)}
                className="w-full flex justify-between items-center bg-gray-100 p-4 rounded-lg mb-4 hover:bg-gray-200 transition-colors"
              >
                <h2 className="text-xl font-semibold text-[#0A2540] flex items-center">
                  Upcoming Club Visits
                  <span className="ml-2 bg-[#38BFA1] text-white text-sm px-2 py-0.5 rounded-full">
                    {captainVisits.filter(visit => !visit.completed).length}
                  </span>
                </h2>
                {upcomingExpanded ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {upcomingExpanded && (
                <div className="space-y-4 animate-fadeIn">
                  {captainVisits
                    .filter(visit => !visit.completed)
                    .map((visit) => (
                      <div 
                        key={visit.id} 
                        className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all group relative"
                        onClick={() => setViewingApplicants(visit)}
                      >
                        <div className="flex items-start gap-6">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-[#0A2540] mb-2">{visit.name}</h3>
                            <p className="text-gray-600 mb-4 line-clamp-2">{visit.description}</p>
                            
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
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">School</p>
                                <p className="font-medium">{visit.school}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Date</p>
                                <p className="font-medium">{formatDate(visit.date)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Time</p>
                                <p className="font-medium">{formatTime(visit.time)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Available Slots</p>
                                <p className="font-medium">{visit.slots}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Applicants</p>
                                <p className="font-medium">{visit.applicants?.length || 0}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Category</p>
                                <p className="font-medium text-[#38BFA1]">{visit.category}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute right-6 top-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                          <button 
                            className="bg-[#38BFA1]/10 text-[#38BFA1] p-2 rounded-md hover:bg-[#38BFA1]/20 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompletionClick(visit, !visit.completed);
                            }}
                          >
                            <span className="text-sm">Mark as Completed</span>
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
                              setConfirmDelete({ isOpen: true, visitId: visit.id });
                            }}
                            className="bg-red-100 text-red-600 p-2 rounded-md hover:bg-red-200 transition-colors"
                          >
                            <span className="text-sm">Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {upcomingExpanded && captainVisits.filter(visit => !visit.completed).length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No upcoming club visits</p>
                </div>
              )}
            </div>

            {/* Completed Visits Section */}
            <div>
              <button 
                onClick={() => setCompletedExpanded(!completedExpanded)}
                className="w-full flex justify-between items-center bg-gray-100 p-4 rounded-lg mb-4 hover:bg-gray-200 transition-colors"
              >
                <h2 className="text-xl font-semibold text-[#0A2540] flex items-center">
                  Completed Club Visits
                  <span className="ml-2 bg-gray-500 text-white text-sm px-2 py-0.5 rounded-full">
                    {captainVisits.filter(visit => visit.completed).length}
                  </span>
                </h2>
                {completedExpanded ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {completedExpanded && (
                <div className="space-y-4 animate-fadeIn">
                  {captainVisits
                    .filter(visit => visit.completed)
                    .map((visit) => (
                      <div 
                        key={visit.id} 
                        className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all group relative"
                        onClick={() => setViewingApplicants(visit)}
                      >
                        <div className="flex items-start gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-semibold text-[#0A2540]">{visit.name}</h3>
                              <span className="px-2 py-1 bg-[#38BFA1]/10 text-[#38BFA1] text-sm rounded-full">
                                Completed
                              </span>
                            </div>
                            <p className="text-gray-600 mb-4 line-clamp-2">{visit.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">School</p>
                                <p className="font-medium">{visit.school}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Date</p>
                                <p className="font-medium">{formatDate(visit.date)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Time</p>
                                <p className="font-medium">{formatTime(visit.time)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Total Slots</p>
                                <p className="font-medium">{visit.slots}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Participants</p>
                                <p className="font-medium">{visit.applicants?.length || 0}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Category</p>
                                <p className="font-medium text-[#38BFA1]">{visit.category}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute right-6 top-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                          <button 
                            className="bg-[#38BFA1]/10 text-[#38BFA1] p-2 rounded-md hover:bg-[#38BFA1]/20 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompletionClick(visit, !visit.completed);
                            }}
                          >
                            <span className="text-sm">Unmark as Completed</span>
                          </button>
                          <button 
                            className="bg-[#38BFA1]/10 text-[#38BFA1] p-2 rounded-md hover:bg-[#38BFA1]/20 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingApplicants(visit);
                            }}
                          >
                            <span className="text-sm">View Participants</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete({ isOpen: true, visitId: visit.id });
                            }}
                            className="bg-red-100 text-red-600 p-2 rounded-md hover:bg-red-200 transition-colors"
                          >
                            <span className="text-sm">Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {completedExpanded && captainVisits.filter(visit => visit.completed).length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No completed club visits</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create/Edit Visit Modal */}
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
            school: editingVisit.school,
            sponsorEmail: editingVisit.sponsorEmail || '',
            category: editingVisit.category,
            contactEmail: editingVisit.contactEmail || '',
            date: editingVisit.date,
            startTime: editingVisit.startTime || '',
            endTime: editingVisit.endTime || '',
            slots: editingVisit.slots,
            description: editingVisit.description,
            status: editingVisit.status,
            captain: editingVisit.captain,
            applicants: editingVisit.applicants,
            createdAt: editingVisit.createdAt
          } : null}
        />

        {/* Applicants Dialog */}
        <ApplicantsDialog
          isOpen={!!viewingApplicants}
          onCloseAction={() => setViewingApplicants(null)}
          applicants={viewingApplicants?.applicants || []}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete({ isOpen: false, visitId: '' })}
          onConfirm={() => handleDelete(confirmDelete.visitId)}
          title="Delete Visit"
          message="Are you sure you want to delete this visit? This action cannot be undone."
          confirmText="Delete"
        />

        {/* Completion Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmCompletion.isOpen}
          onClose={() => setConfirmCompletion({ isOpen: false, visit: null, completing: false })}
          onConfirm={async () => {
            if (confirmCompletion.visit) {
              await handleMarkCompleted(confirmCompletion.visit, confirmCompletion.completing);
              setConfirmCompletion({ isOpen: false, visit: null, completing: false });
            }
          }}
          title={confirmCompletion.completing ? "Mark Visit as Completed" : "Unmark Visit as Completed"}
          message={confirmCompletion.completing 
            ? "Are you sure you want to mark this visit as completed? This will move it to students' completed visits."
            : "Are you sure you want to unmark this visit as completed? This will remove it from students' completed visits."
          }
          confirmText={confirmCompletion.completing ? "Mark as Completed" : "Unmark as Completed"}
        />
      </div>
    </div>
  );
} 