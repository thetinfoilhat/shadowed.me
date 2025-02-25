'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

interface CompletedVisit {
  id: string;
  name: string;
  school: string;
  category: string;
  date: string;
  time: string;
  description: string;
  completedAt: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [completedVisits, setCompletedVisits] = useState<CompletedVisit[]>([]);

  useEffect(() => {
    const fetchCompletedVisits = async () => {
      if (!user?.uid) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        setCompletedVisits(userData?.completedVisits || []);
      } catch (error) {
        console.error('Error fetching completed visits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedVisits();
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
      <div className="max-w-[1400px] mx-auto px-8 py-16">
        <h1 className="text-4xl font-semibold text-[#0A2540] mb-8">Student Dashboard</h1>
        
        <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <h2 className="text-xl font-semibold text-[#0A2540] mb-6">
            Completed Visits ({completedVisits.length})
          </h2>
          
          <div className="space-y-4">
            {completedVisits.map((visit) => (
              <div 
                key={visit.id}
                className="bg-white rounded-lg border border-gray-100 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#0A2540]">{visit.name}</h3>
                    <span className="inline-block px-3 py-1 bg-[#38BFA1]/10 text-[#38BFA1] text-sm rounded-full mt-2">
                      {visit.category}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Completed on {format(new Date(visit.completedAt), "MMMM do yyyy")}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">School:</span> {visit.school}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {format(new Date(visit.date), "MMMM do yyyy")}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {visit.time}
                  </div>
                </div>
                
                <p className="mt-4 text-gray-600">{visit.description}</p>
              </div>
            ))}

            {completedVisits.length === 0 && (
              <p className="text-center text-gray-500 py-4">No completed visits yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 