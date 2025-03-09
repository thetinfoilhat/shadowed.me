'use client';
import { Dialog, Tab } from '@headlessui/react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClubListing } from '@/types/club';
import { Club } from '@/types/club';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CalendarIcon, ClockIcon, UserGroupIcon, EnvelopeIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';

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
        <Dialog.Panel className="mx-auto max-w-3xl w-full rounded-xl bg-white overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header with gradient background */}
          <div 
            className="p-6 text-white"
            style={{ background: club.bgGradient || `linear-gradient(135deg, #38BFA1, #38BFA1dd)` }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-1">{club.name}</h2>
                <div className="flex items-center">
                  <span className="inline-block px-3 py-1 bg-white/20 text-white text-sm rounded-full">
                    {club.category}
                  </span>
                </div>
              </div>
              <button 
                onClick={onCloseAction}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto p-6">
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
              </Tab.List>

              <Tab.Panels>
                {/* About Panel */}
                <Tab.Panel>
                  <p className="text-gray-600 mb-6">{club.description}</p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-[#0A2540] mb-2">Mission</h3>
                    <p className="text-gray-600">{club.mission}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-[#0A2540] mb-3 flex items-center">
                        <ClockIcon className="h-5 w-5 mr-2 text-[#38BFA1]" />
                        Meeting Times
                      </h3>
                      <p className="text-gray-600">{club.meetingTimes}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-[#0A2540] mb-3 flex items-center">
                        <EnvelopeIcon className="h-5 w-5 mr-2 text-[#38BFA1]" />
                        Contact
                      </h3>
                      <p className="text-gray-600">{club.contactInfo}</p>
                    </div>
                  </div>
                  
                  {club.attributes && club.attributes.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-medium text-[#0A2540] mb-3">Club Attributes</h3>
                      <div className="flex flex-wrap gap-2">
                        {club.attributes.map((attribute, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                          >
                            {attribute}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
                        <div key={visit.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h3 className="text-lg font-semibold text-[#0A2540]">{visit.name}</h3>
                          <p className="text-gray-600 mt-2">{visit.description}</p>
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            <div className="flex items-center text-gray-600">
                              <CalendarIcon className="h-4 w-4 mr-2 text-[#38BFA1]" />
                              {format(new Date(visit.date), 'MMMM d, yyyy')}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <ClockIcon className="h-4 w-4 mr-2 text-[#38BFA1]" />
                              {visit.time}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <UserGroupIcon className="h-4 w-4 mr-2 text-[#38BFA1]" />
                              {visit.slots} slots available
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No upcoming visits scheduled</p>
                    </div>
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
                        <div key={visit.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h3 className="text-lg font-semibold text-[#0A2540]">{visit.name}</h3>
                          <p className="text-gray-600 mt-2">{visit.description}</p>
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            <div className="flex items-center text-gray-600">
                              <CalendarIcon className="h-4 w-4 mr-2 text-[#38BFA1]" />
                              {format(new Date(visit.date), 'MMMM d, yyyy')}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <ClockIcon className="h-4 w-4 mr-2 text-[#38BFA1]" />
                              {visit.time}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <UserGroupIcon className="h-4 w-4 mr-2 text-[#38BFA1]" />
                              {visit.applicants?.length || 0} participants
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <BuildingLibraryIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No past events</p>
                    </div>
                  )}
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 