'use client';
import { Dialog, Tab } from '@headlessui/react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClubListing } from '@/types/club';
import { Club } from '@/types/club';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ClubDetailsProps {
  club: ClubListing;
  isOpen: boolean;
  onCloseAction: () => void;
}

export default function ClubDetailsDialog({ club, isOpen, onCloseAction }: ClubDetailsProps) {
  const [visits, setVisits] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        setLoading(true);
        const visitsRef = collection(db, 'opportunities');
        const q = query(
          visitsRef,
          where('captain', '==', club.captain)
        );
        const querySnapshot = await getDocs(q);
        
        const visitsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Club[];

        setVisits(visitsData);
      } catch (error) {
        console.error('Error fetching visits:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchVisits();
    }
  }, [isOpen, club.captain]);

  const upcomingVisits = visits.filter(
    visit => new Date(visit.date) >= new Date() && !visit.completed
  );

  const pastVisits = visits.filter(
    visit => new Date(visit.date) < new Date() || visit.completed
  );

  return (
    <Dialog open={isOpen} onClose={onCloseAction} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full rounded-xl bg-white p-6 max-h-[90vh] overflow-y-auto">
          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-xl bg-[#38BFA1]/10 p-1 mb-6">
              <Tab className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 rounded-lg
                ${selected
                  ? 'bg-white text-[#38BFA1] shadow'
                  : 'text-[#38BFA1]/60 hover:bg-white/[0.12] hover:text-[#38BFA1]'
                }`
              }>
                About
              </Tab>
              <Tab className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 rounded-lg
                ${selected
                  ? 'bg-white text-[#38BFA1] shadow'
                  : 'text-[#38BFA1]/60 hover:bg-white/[0.12] hover:text-[#38BFA1]'
                }`
              }>
                Upcoming Visits
              </Tab>
              <Tab className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 rounded-lg
                ${selected
                  ? 'bg-white text-[#38BFA1] shadow'
                  : 'text-[#38BFA1]/60 hover:bg-white/[0.12] hover:text-[#38BFA1]'
                }`
              }>
                Past Events
              </Tab>
              <Tab className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 rounded-lg
                ${selected
                  ? 'bg-white text-[#38BFA1] shadow'
                  : 'text-[#38BFA1]/60 hover:bg-white/[0.12] hover:text-[#38BFA1]'
                }`
              }>
                Achievements
              </Tab>
            </Tab.List>

            <Tab.Panels>
              {/* About Panel */}
              <Tab.Panel>
                <h2 className="text-2xl font-bold text-[#0A2540] mb-4">{club.name}</h2>
                <p className="text-gray-600 mb-6">{club.description}</p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-[#0A2540]">Mission</h3>
                    <p className="text-gray-600">{club.mission}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#0A2540]">Meeting Times</h3>
                    <p className="text-gray-600">{club.meetingTimes}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#0A2540]">Contact</h3>
                    <p className="text-gray-600">{club.contactInfo}</p>
                  </div>
                </div>
              </Tab.Panel>

              {/* Upcoming Visits Panel */}
              <Tab.Panel>
                {loading ? (
                  <div className="py-12 flex justify-center">
                    <LoadingSpinner size="md" />
                  </div>
                ) : upcomingVisits.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingVisits.map((visit) => (
                      <div key={visit.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="text-lg font-semibold text-[#0A2540]">{visit.name}</h3>
                        <p className="text-gray-600 mt-2">{visit.description}</p>
                        <div className="mt-4 text-sm text-gray-500">
                          <div>Date: {format(new Date(visit.date), 'MMMM d, yyyy')}</div>
                          <div>Time: {visit.time}</div>
                          <div>Available Slots: {visit.slots}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-12">No upcoming visits scheduled</p>
                )}
              </Tab.Panel>

              {/* Past Events Panel */}
              <Tab.Panel>
                {loading ? (
                  <div className="py-12 flex justify-center">
                    <LoadingSpinner size="md" />
                  </div>
                ) : pastVisits.length > 0 ? (
                  <div className="space-y-4">
                    {pastVisits.map((visit) => (
                      <div key={visit.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="text-lg font-semibold text-[#0A2540]">{visit.name}</h3>
                        <p className="text-gray-600 mt-2">{visit.description}</p>
                        <div className="mt-4 text-sm text-gray-500">
                          <div>Date: {format(new Date(visit.date), 'MMMM d, yyyy')}</div>
                          <div>Time: {visit.time}</div>
                          <div>Participants: {visit.applicants?.length || 0}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-12">No past events</p>
                )}
              </Tab.Panel>

              {/* Achievements Panel */}
              <Tab.Panel>
                {club.achievements && club.achievements.length > 0 ? (
                  <div className="space-y-4">
                    {club.achievements.map((achievement, index) => (
                      <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                        <p className="text-[#0A2540]">{achievement}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-12">No achievements listed yet</p>
                )}
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 