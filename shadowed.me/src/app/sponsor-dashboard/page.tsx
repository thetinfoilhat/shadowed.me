'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Tab } from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Applicant {
  name: string;
  email: string;
  grade: string;
  school: string;
}

interface VisitData {
  id: string;
  name: string;
  school?: string;
  sponsorEmail: string;
  category: string;
  contactEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  time: string;
  slots: number;
  description: string;
  captain: string;
  applicants: Applicant[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

export default function SponsorDashboard() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<VisitData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      const visitsRef = collection(db, 'opportunities');
      const q = query(visitsRef, where('sponsorEmail', '==', user.email));
      const querySnapshot = await getDocs(q);
      
      const visitsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || 'pending',
      })) as VisitData[];
      
      setVisits(visitsData);
    } catch (error) {
      console.error('Error fetching visits:', error);
      toast.error('Failed to load visits');
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      fetchVisits();
    }
  }, [user, fetchVisits]);

  const handleApprove = async (visitId: string) => {
    try {
      const visitRef = doc(db, 'opportunities', visitId);
      await updateDoc(visitRef, {
        status: 'approved'
      });
      toast.success('Visit approved successfully');
      fetchVisits();
    } catch (error) {
      console.error('Error approving visit:', error);
      toast.error('Failed to approve visit');
    }
  };

  const handleReject = async (visitId: string) => {
    try {
      const visitRef = doc(db, 'opportunities', visitId);
      await updateDoc(visitRef, {
        status: 'rejected'
      });
      toast.success('Visit rejected');
      fetchVisits();
    } catch (error) {
      console.error('Error rejecting visit:', error);
      toast.error('Failed to reject visit');
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
              Sign in to manage visit approvals
            </p>
            <button
              onClick={() => document.querySelector<HTMLButtonElement>('[data-login-button]')?.click()}
              className="bg-[#38BFA1] text-white px-8 py-3 rounded-lg hover:bg-[#2DA891] transition-colors inline-flex items-center gap-2"
            >
              <span>Sign In</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendingVisits = visits.filter(visit => visit.status === 'pending');
  const approvedVisits = visits.filter(visit => visit.status === 'approved');
  const rejectedVisits = visits.filter(visit => visit.status === 'rejected');

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[#0A2540] mb-4">Sponsor Dashboard</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Manage visit opportunities that require your approval. Approve or reject visits created by captains.
          </p>
        </div>

        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-[#F0F9F6] p-1 mb-8">
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                ${selected 
                  ? 'bg-[#38BFA1] text-white shadow'
                  : 'text-[#0A2540] hover:bg-white/[0.12] hover:text-[#38BFA1]'
                }`
              }
            >
              Pending ({pendingVisits.length})
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                ${selected 
                  ? 'bg-[#38BFA1] text-white shadow'
                  : 'text-[#0A2540] hover:bg-white/[0.12] hover:text-[#38BFA1]'
                }`
              }
            >
              Approved ({approvedVisits.length})
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                ${selected 
                  ? 'bg-[#38BFA1] text-white shadow'
                  : 'text-[#0A2540] hover:bg-white/[0.12] hover:text-[#38BFA1]'
                }`
              }
            >
              Rejected ({rejectedVisits.length})
            </Tab>
          </Tab.List>
          
          <Tab.Panels>
            <Tab.Panel>
              {pendingVisits.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No pending visits to approve</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingVisits.map((visit) => (
                    <div key={visit.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-xl font-semibold text-[#0A2540] mb-2">{visit.name}</h2>
                            <p className="text-sm text-gray-500 mb-4">
                              Created by: {visit.captain} • {formatDate(visit.date)} • {visit.time}
                            </p>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </div>
                        
                        <div className="mt-4 space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Category:</span>
                            <span className="ml-2 text-gray-900">{visit.category}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Contact:</span>
                            <span className="ml-2 text-gray-900">{visit.contactEmail}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Available Slots:</span>
                            <span className="ml-2 text-gray-900">{visit.slots}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Description:</span>
                            <p className="mt-1 text-gray-900">{visit.description}</p>
                          </div>
                        </div>
                        
                        <div className="mt-6 flex space-x-3">
                          <button
                            onClick={() => handleApprove(visit.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(visit.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <XCircleIcon className="h-5 w-5 mr-2" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Tab.Panel>
            
            <Tab.Panel>
              {approvedVisits.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No approved visits</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {approvedVisits.map((visit) => (
                    <div key={visit.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-xl font-semibold text-[#0A2540] mb-2">{visit.name}</h2>
                            <p className="text-sm text-gray-500 mb-4">
                              Created by: {visit.captain} • {formatDate(visit.date)} • {visit.time}
                            </p>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Approved
                          </span>
                        </div>
                        
                        <div className="mt-4 space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Category:</span>
                            <span className="ml-2 text-gray-900">{visit.category}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Contact:</span>
                            <span className="ml-2 text-gray-900">{visit.contactEmail}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Available Slots:</span>
                            <span className="ml-2 text-gray-900">{visit.slots}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Description:</span>
                            <p className="mt-1 text-gray-900">{visit.description}</p>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <button
                            onClick={() => handleReject(visit.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <XCircleIcon className="h-5 w-5 mr-2" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Tab.Panel>
            
            <Tab.Panel>
              {rejectedVisits.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No rejected visits</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {rejectedVisits.map((visit) => (
                    <div key={visit.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-xl font-semibold text-[#0A2540] mb-2">{visit.name}</h2>
                            <p className="text-sm text-gray-500 mb-4">
                              Created by: {visit.captain} • {formatDate(visit.date)} • {visit.time}
                            </p>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Rejected
                          </span>
                        </div>
                        
                        <div className="mt-4 space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Category:</span>
                            <span className="ml-2 text-gray-900">{visit.category}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Contact:</span>
                            <span className="ml-2 text-gray-900">{visit.contactEmail}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Available Slots:</span>
                            <span className="ml-2 text-gray-900">{visit.slots}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Description:</span>
                            <p className="mt-1 text-gray-900">{visit.description}</p>
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <button
                            onClick={() => handleApprove(visit.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
} 