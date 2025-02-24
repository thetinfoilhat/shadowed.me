'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

export default function MyVisits() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [registeredVisits, setRegisteredVisits] = useState([]);

  useEffect(() => {
    const fetchRegisteredVisits = async () => {
      if (!user?.email) return;

      try {
        const clubsRef = collection(db, 'opportunities');
        const querySnapshot = await getDocs(clubsRef);
        
        const visits = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(visit => visit.applicants?.some(applicant => applicant.email === user.email))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setRegisteredVisits(visits);
      } catch (err) {
        console.error('Error fetching visits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRegisteredVisits();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#725A44]">Loading...</div>
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

        {registeredVisits.length === 0 ? (
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
            {registeredVisits.map((visit) => (
              <div 
                key={visit.id} 
                className="bg-white rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-[#38BFA1]/10 flex flex-col items-center justify-center text-[#38BFA1]">
                    <div className="text-sm font-medium">{format(new Date(visit.date), 'MMM')}</div>
                    <div className="text-xl font-bold">{format(new Date(visit.date), 'd')}</div>
                  </div>
                  
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-[#0A2540] mb-2">{visit.name}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">School:</span>
                          <span className="text-[#0A2540]">{visit.school}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Time:</span>
                          <span className="text-[#0A2540]">{visit.time}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Category:</span>
                          <span className="text-[#38BFA1]">{visit.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Contact:</span>
                          <span className="text-[#0A2540]">{visit.contactEmail}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 