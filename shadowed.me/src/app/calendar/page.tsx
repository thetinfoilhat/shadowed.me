'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  CalendarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { formatDateForComparison, doesEventMatchDate } from '@/utils/dateUtils';

interface ClubEvent {
  id: string;
  clubId: string;
  clubName: string;
  title: string;
  content: string;
  postType: 'event';
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  maxParticipants?: number;
  currentParticipants: number;
  participants: Array<{
    name: string;
    email: string;
    grade?: string;
    school?: string;
    joinDate: Date;
  }>;
  createdBy: string;
  createdByEmail: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'cancelled' | 'completed';
  tags?: string[];
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringDays?: string[];
}

export default function MasterCalendar() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');


  // Fetch all club events
  const fetchAllEvents = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching all events...');
      const response = await fetch('/api/calendar/all-events');
      console.log('Events response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Events data received:', data);
        setEvents(data.events || []);
      } else {
        console.error('Failed to fetch events:', response.status);
        toast.error('Failed to load events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => doesEventMatchDate(event.date, date) && event.status === 'active');
  };

  const isEventInPast = (event: ClubEvent): boolean => {
    const now = new Date();
    // Parse event date as local date to avoid timezone issues
    const [year, month, day] = event.date.split('-').map(Number);
    const eventDateTime = event.startTime 
      ? new Date(year, month - 1, day, ...event.startTime.split(':').map(Number))
      : new Date(year, month - 1, day, 23, 59, 59);
    return eventDateTime < now;
  };

  const isUserJoined = (event: ClubEvent): boolean => {
    return event.participants?.some(participant => participant.email === user?.email) || false;
  };

  const handleJoinEvent = async (eventId: string) => {
    if (!user?.email) {
      toast.error('Please sign in to join events');
      return;
    }

    try {
      console.log('Attempting to join event:', eventId, 'for user:', user.email);
      
      const response = await fetch('/api/club-posts/join', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          postId: eventId, 
          participant: { 
            email: user.email, 
            name: user.displayName || 'User',
            grade: '',
            school: ''
          } 
        })
      });

      console.log('Join response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Join successful:', result);
        toast.success('Successfully joined event!');
        fetchAllEvents(); // Refresh events
      } else {
        const error = await response.json();
        console.error('Join failed:', error);
        toast.error(error.error || 'Failed to join event');
      }
    } catch (error) {
      console.error('Error joining event:', error);
      toast.error('Failed to join event - please check your connection');
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    if (!user?.email) {
      toast.error('Please sign in to leave events');
      return;
    }

    try {
      console.log('Attempting to leave event:', eventId, 'for user:', user.email);
      
      const response = await fetch('/api/club-posts/join', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ postId: eventId, participantEmail: user.email })
      });

      console.log('Leave response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Leave successful:', result);
        toast.success('Successfully left event');
        fetchAllEvents(); // Refresh events
      } else {
        const error = await response.json();
        console.error('Leave failed:', error);
        toast.error(error.error || 'Failed to leave event');
      }
    } catch (error) {
      console.error('Error leaving event:', error);
      toast.error('Failed to leave event - please check your connection');
    }
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 === 0 ? 12 : hour % 12;
      return `${hour12}:${minutes} ${period}`;
    } catch {
      return time;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const openEventDetails = (event: ClubEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Master Calendar</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'month' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'month' ? (
          /* Month View */
          <div className="bg-white rounded-xl shadow-sm border">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {getDaysInMonth(currentMonth).map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="p-3 min-h-[120px]"></div>;
                  }

                  const dayEvents = getEventsForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={day.getTime()}
                      className={`p-3 min-h-[120px] border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${
                        isToday ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => {
                          const isPast = isEventInPast(event);
                          const isJoined = isUserJoined(event);
                          
                          return (
                            <div
                              key={event.id}
                              className={`text-xs p-2 rounded cursor-pointer hover:bg-blue-50 transition-colors ${
                                isPast
                                  ? 'bg-gray-100 text-gray-600 opacity-75'
                                  : isJoined
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-green-100 text-green-800'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEventDetails(event);
                              }}
                              title={event.title}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-xs opacity-75">{event.clubName}</div>
                              {event.startTime && (
                                <div className="text-xs opacity-75">{formatTime(event.startTime)}</div>
                              )}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">All Club Events</h2>
              <div className="space-y-4">
                {events
                  .filter(event => event.status === 'active')
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((event) => {
                    const isPast = isEventInPast(event);
                    const isJoined = isUserJoined(event);
                    
                    return (
                      <div
                        key={event.id}
                        className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                          isPast ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {event.clubName}
                              </span>
                              {isJoined && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Joined
                                </span>
                              )}
                            </div>
                            
                            <p className="text-gray-600 mb-3">{event.content}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                <span>{new Date(event.date).toLocaleDateString()}</span>
                              </div>
                              {event.startTime && (
                                <div className="flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-2" />
                                  <span>{formatTime(event.startTime)}</span>
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center">
                                  <MapPinIcon className="h-4 w-4 mr-2" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              <div className="flex items-center">
                                <UserGroupIcon className="h-4 w-4 mr-2" />
                                <span>{event.currentParticipants}/{event.maxParticipants || '∞'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {!isPast && (
                              <button
                                onClick={() => isJoined ? handleLeaveEvent(event.id) : handleJoinEvent(event.id)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                  isJoined 
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {isJoined ? 'Leave Event' : 'Join Event'}
                              </button>
                            )}
                            <button
                              onClick={() => openEventDetails(event)}
                              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Event Details Modal */}
        {showEventDetails && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {selectedEvent.clubName}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h3>
                  </div>
                  <button 
                    onClick={() => setShowEventDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-600 mb-6">{selectedEvent.content}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>{new Date(selectedEvent.date).toLocaleDateString()}</span>
                  </div>
                  {selectedEvent.startTime && (
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      <span>{formatTime(selectedEvent.startTime)}</span>
                    </div>
                  )}
                  {selectedEvent.location && (
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    <span>{selectedEvent.currentParticipants}/{selectedEvent.maxParticipants || '∞'} participants</span>
                  </div>
                </div>

                {!isEventInPast(selectedEvent) && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        if (isUserJoined(selectedEvent)) {
                          handleLeaveEvent(selectedEvent.id);
                        } else {
                          handleJoinEvent(selectedEvent.id);
                        }
                        setShowEventDetails(false);
                      }}
                      className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                        isUserJoined(selectedEvent)
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isUserJoined(selectedEvent) ? 'Leave Event' : 'Join Event'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
