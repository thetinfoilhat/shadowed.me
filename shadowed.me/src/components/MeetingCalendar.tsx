'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon, MapPinIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { MeetingOpportunity } from '@/types/club';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

interface MeetingCalendarProps {
  meetings: MeetingOpportunity[];
  onMeetingClick?: (meeting: MeetingOpportunity) => void;
  onSignUp?: (meetingId: string) => Promise<void>;
  onSignOut?: (meetingId: string) => Promise<void>;
  userRole?: 'student' | 'captain' | 'sponsor' | 'admin';
  showSignUpButton?: boolean;
}

export default function MeetingCalendar({
  meetings,
  onMeetingClick,
  onSignUp,
  onSignOut,
  userRole = 'student',
  showSignUpButton = true,
}: MeetingCalendarProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');

  // Get current month's start and end dates
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // Generate calendar days
  const calendarDays = [];
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    calendarDays.push(date);
  }

  // Get meetings for a specific date
  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.startDate);
      return meetingDate.toDateString() === date.toDateString();
    });
  };

  // Check if user is signed up for a meeting
  const isUserSignedUp = (meeting: MeetingOpportunity) => {
    return meeting.participants.some(participant => participant.email === user?.email);
  };

  // Handle sign up/sign out
  const handleSignUp = async (meeting: MeetingOpportunity) => {
    if (!user?.email) {
      toast.error('Please sign in to join meetings');
      return;
    }

    if (meeting.maxParticipants && meeting.currentParticipants >= meeting.maxParticipants) {
      toast.error('This meeting is full');
      return;
    }

    try {
      if (onSignUp) {
        await onSignUp(meeting.id);
        toast.success('Successfully joined the meeting!');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error('Failed to join meeting');
    }
  };

  const handleSignOut = async (meeting: MeetingOpportunity) => {
    try {
      if (onSignOut) {
        await onSignOut(meeting.id);
        toast.success('Successfully left the meeting');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to leave meeting');
    }
  };

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Calendar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Meeting Calendar</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'month' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'week' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                List
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="mt-2">
          <h3 className="text-xl font-semibold text-gray-900">
            {currentDate.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h3>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'month' && (
        <div className="p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();
              const meetingsForDay = getMeetingsForDate(date);
              
              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border border-gray-200 ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'text-blue-600' : ''}`}>
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {meetingsForDay.slice(0, 2).map((meeting) => (
                      <div
                        key={meeting.id}
                        className="text-xs p-1 rounded bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors"
                        onClick={() => onMeetingClick?.(meeting)}
                      >
                        <div className="font-medium truncate">{meeting.title}</div>
                        <div className="text-blue-600">{formatTime(meeting.startTime)}</div>
                      </div>
                    ))}
                    
                    {meetingsForDay.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{meetingsForDay.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="p-4">
          <div className="space-y-4">
            {meetings
              .filter(meeting => meeting.status === 'active')
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .map((meeting) => (
                <div
                  key={meeting.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer"
                  onClick={() => onMeetingClick?.(meeting)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                        {meeting.isRecurring && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Recurring
                          </span>
                        )}
                        {meeting.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {meeting.category}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{meeting.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{formatDate(new Date(meeting.startDate))}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>{formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="h-4 w-4" />
                          <span>{meeting.roomNumber}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserGroupIcon className="h-4 w-4" />
                          <span>{meeting.currentParticipants}/{meeting.maxParticipants || '∞'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {showSignUpButton && userRole === 'student' && (
                      <div className="ml-4">
                        {isUserSignedUp(meeting) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSignOut(meeting);
                            }}
                            className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                          >
                            Leave
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSignUp(meeting);
                            }}
                            disabled={meeting.maxParticipants && meeting.currentParticipants >= meeting.maxParticipants}
                            className="px-3 py-1 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Join
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {meeting.tags && meeting.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {meeting.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            
            {meetings.filter(meeting => meeting.status === 'active').length === 0 && (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings scheduled</h3>
                <p className="text-gray-500">No meetings are currently scheduled for this period.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 