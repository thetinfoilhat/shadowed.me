'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import VisitModal from '@/components/VisitModal';
import ApplicantsDialog from '@/components/ApplicantsDialog';
import { Club } from '@/types/club';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';

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
  school: string;
  categories: string[];
  category: string;
  contactEmail: string;
  slots: number;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return format(date, "MMMM do yyyy");
}

function formatTime(timeStr: string) {
  const [start, end] = timeStr.split(' - ').map(time => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  });
  return `${start} - ${end}`;
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
        .filter(visit => visit.captain === user?.email)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setCaptainVisits(visits);
    } catch (err) {
      console.error('Error fetching visits:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCaptainVisits();
    } else {
      setLoading(false);
    }
  }, [user, fetchCaptainVisits]);

  const handleSaveVisit = async (data: VisitData) => {
    try {
      const visitData = {
        name: data.name,
        school: data.school,
        categories: data.categories,
        category: data.categories[0],
        contactEmail: data.contactEmail,
        slots: Number(data.slots),
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description,
        time: `${data.startTime} - ${data.endTime}`,
        captain: user?.email,
        applicants: [],
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#725A44]">Loading...</div>
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
    <div className="min-h-screen bg-white">
      <div className="px-8 py-12 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-start gap-16 mb-16">
          <div className="relative max-w-2xl">
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#38BFA1]/10 rounded-full blur-3xl"></div>
            </div>
            <h1 className="text-[3.5rem] font-semibold leading-[1.1] text-[#0A2540] mb-4">
              Club Captain Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Schedule and manage your club&apos;s visit opportunities
            </p>
          </div>

          <button 
            onClick={() => {
              setEditingVisit(null);
              setIsCreateModalOpen(true);
            }}
            className="bg-[#38BFA1] text-white px-12 py-4 rounded-xl hover:bg-[#2DA891] transition-all flex items-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-200 flex-shrink-0 min-w-[200px] justify-center"
          >
            <span className="text-lg">Create Visit</span>
            <span className="text-xl">→</span>
          </button>
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
                    {/* Date Circle */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#38BFA1]/10 flex flex-col items-center justify-center text-[#38BFA1]">
                      <div className="text-sm font-medium">{format(new Date(visit.date), 'MMM')}</div>
                      <div className="text-xl font-bold">{format(new Date(visit.date), 'd')}</div>
                    </div>
                    
                    {/* Visit Details */}
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-[#0A2540] mb-2">
                        {visit.name}
                      </h3>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">School:</span>
                          <span className="text-[#0A2540]">{visit.school}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Date:</span>
                          <span className="text-[#0A2540]">{formatDate(visit.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Time:</span>
                          <span className="text-[#0A2540]">{formatTime(visit.time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Available Slots:</span>
                          <span className="text-[#0A2540]">{visit.slots}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Category:</span>
                          <span className="text-[#38BFA1]">{visit.category}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
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
          onSubmitAction={handleSaveVisit}
          initialData={editingVisit}
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
      </div>
    </div>
  );
} 