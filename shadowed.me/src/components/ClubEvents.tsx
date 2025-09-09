'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

interface ClubEvent {
  id: string;
  clubId: string;
  clubName: string;
  title: string;
  content: string; // Changed from description to content
  postType: 'event';
  date: string;
  startTime?: string; // Made optional to match ClubPost
  endTime?: string; // Made optional to match ClubPost
  location?: string; // Made optional to match ClubPost
  maxParticipants?: number;
  currentParticipants: number;
  participants: Array<{
    name: string;
    email: string;
    grade?: string;
    school?: string;
    joinDate: Date; // Changed from signupDate to joinDate
  }>;
  createdBy: string;
  createdByEmail: string; // Added to match ClubPost
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'cancelled' | 'completed';
  category?: string;
  tags?: string[];
}

interface ClubEventsProps {
  clubId: string;
  clubName: string;
  userEmail: string;
  userName: string;
}

export default function ClubEvents({ clubId, clubName, userEmail, userName }: ClubEventsProps) {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!clubId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/club-posts?clubId=${clubId}&status=active`);
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.posts || []);
      } else {
        toast.error('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleJoinEvent = async (eventId: string) => {
    try {
      const response = await fetch('/api/club-posts/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: eventId,
          participant: {
            name: userName,
            email: userEmail,
            grade: '', // Will be filled from user profile
            school: '', // Will be filled from user profile
            joinDate: new Date(),
          },
        }),
      });

      if (response.ok) {
        toast.success('Successfully joined event!');
        fetchEvents(); // Refresh events
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to join event');
      }
    } catch (error) {
      console.error('Error joining event:', error);
      toast.error('Failed to join event');
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    try {
      const response = await fetch('/api/club-posts/join', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: eventId,
          participantEmail: userEmail,
        }),
      });

      if (response.ok) {
        toast.success('Successfully left event');
        fetchEvents(); // Refresh events
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to leave event');
      }
    } catch (error) {
      console.error('Error leaving event:', error);
      toast.error('Failed to leave event');
    }
  };

  const isUserSignedUp = (event: ClubEvent) => {
    return event.participants.some(p => p.email === userEmail);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading events...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No events scheduled</h3>
        <p className="text-gray-500">Check back later for upcoming events from {clubName}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
        <span className="text-sm text-gray-500">{events.length} event{events.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-4">
        {events
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((event) => {
            const isJoined = isUserSignedUp(event);
            const isFull = event.maxParticipants && event.currentParticipants >= event.maxParticipants;
            
            return (
              <div key={event.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                    {event.content && (
                      <p className="text-gray-600 mb-3">{event.content}</p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span>{event.startTime ? formatTime(event.startTime) : 'TBD'} - {event.endTime ? formatTime(event.endTime) : 'TBD'}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        <span>{event.currentParticipants}/{event.maxParticipants || '∞'}</span>
                      </div>
                    </div>

                    {event.category && (
                      <div className="mt-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {event.category}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isJoined && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Joined
                      </span>
                    )}
                    {isFull && !isJoined && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Full
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">{event.clubName}</span>
                  </div>
                  
                  {!isFull && (
                    <button
                      onClick={() => isJoined ? handleLeaveEvent(event.id) : handleJoinEvent(event.id)}
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        isJoined
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isJoined ? (
                        <>
                          <MinusIcon className="h-4 w-4 mr-2" />
                          Leave Event
                        </>
                      ) : (
                        <>
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Join Event
                        </>
                      )}
                    </button>
                  )}
                  
                  {isFull && !isJoined && (
                    <span className="text-sm text-gray-500">
                      This event is full
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
} 