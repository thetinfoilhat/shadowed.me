'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, getDoc, updateDoc, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { Club } from '@/types/club';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Applicant {
  email: string;
  name: string;
  grade: string;
  school: string;
}

export default function MyVisits() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Club[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    visitId: string;
    isCaptain: boolean;
  }>({ isOpen: false, visitId: '', isCaptain: false });

  const fetchVisits = useCallback(async () => {
    if (!user?.email) return;

    try {
      const clubsRef = collection(db, 'opportunities');
      const querySnapshot = await getDocs(clubsRef);
      
      const userVisits = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Club))
        .filter(visit => visit.applicants?.some(applicant => applicant.email === user.email))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setVisits(userVisits);
    } catch (err) {
      console.error('Error fetching visits:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleDeleteClick = (visitId: string, isCaptain: boolean) => {
    setConfirmDialog({ isOpen: true, visitId, isCaptain });
  };

  const handleDelete = async (visitId: string) => {
    try {
      const visitRef = doc(db, 'opportunities', visitId);
      const visitDoc = await getDoc(visitRef);
      const visitData = visitDoc.data();

      if (!visitData) return;

      if (visitData.captain === user?.email) {
        await deleteDoc(visitRef);
      } else {
        const userApplication = visitData.applicants?.find(
          (applicant: Applicant) => applicant.email === user?.email
        );

        if (userApplication) {
          await updateDoc(visitRef, {
            applicants: arrayRemove(userApplication)
          });
        }
      }

      await fetchVisits();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVisits();
    } else {
      setLoading(false);
    }
  }, [user, fetchVisits]);

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
              Sign in to view your registered visits and manage your schedule
            </p>
            <button
              onClick={() => document.querySelector<HTMLButtonElement>('button[data-login-button]')?.click()}
              className="bg-[#38BFA1] text-white px-8 py-3 rounded-lg hover:bg-[#2DA891] transition-colors inline-flex items-center gap-2"
            >
              <span>Sign In</span>
              <span>→</span>
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            Looking to explore opportunities?{' '}
            <Link href="/school-clubs" className="text-[#38BFA1] hover:underline">
              Browse available clubs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-8 py-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-start gap-16 mb-16">
          <div className="relative max-w-2xl">
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#38BFA1]/10 rounded-full blur-3xl"></div>
            </div>
            <h1 className="text-[3.5rem] font-semibold leading-[1.1] text-[#0A2540] mb-4">
              My Registered Visits
            </h1>
            <p className="text-lg text-gray-600">
              Track and manage your upcoming club visits
            </p>
          </div>
        </div>

        {visits.length === 0 ? (
          <div className="bg-white rounded-xl p-16 shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">
                No Registered Visits Yet
              </h2>
              <p className="text-gray-600 mb-8">
                Start exploring clubs and register for visits that interest you.
              </p>
              <a 
                href="/school-clubs"
                className="bg-[#38BFA1]/10 text-[#38BFA1] px-6 py-3 rounded-md hover:bg-[#38BFA1]/20 transition-all inline-flex items-center gap-2"
              >
                <span>Explore Clubs</span>
                <span>→</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {visits.map((visit) => (
              <div 
                key={visit.id} 
                className="group relative bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#38BFA1]/10 flex flex-col items-center justify-center text-[#38BFA1]">
                    <div className="text-sm font-medium">{format(new Date(visit.date), 'MMM')}</div>
                    <div className="text-xl font-bold">{format(new Date(visit.date), 'd')}</div>
                  </div>
                  
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
                        <span className="text-gray-500">Time:</span>
                        <span className="text-[#0A2540]">{visit.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Category:</span>
                        <span className="text-[#38BFA1]">{visit.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {visit.captain === user?.email ? (
                      <>
                        <button 
                          className="bg-[#38BFA1]/10 text-[#38BFA1] p-2 rounded-md hover:bg-[#38BFA1]/20 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(visit.id, true);
                          }}
                        >
                          <span className="text-sm">Delete Visit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(visit.id, false);
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-md transition-colors"
                        >
                          Unregister from club visit
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(visit.id, false);
                        }}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-md transition-colors"
                      >
                        Unregister from club visit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, visitId: '', isCaptain: false })}
        onConfirm={() => handleDelete(confirmDialog.visitId)}
        title={confirmDialog.isCaptain ? "Delete Visit" : "Unregister from Visit"}
        message={confirmDialog.isCaptain 
          ? "Are you sure you want to delete this visit opportunity? This action cannot be undone."
          : "Are you sure you want to unregister from this visit? This action cannot be undone."}
        confirmText={confirmDialog.isCaptain ? "Delete" : "Unregister"}
      />
    </div>
  );
} 