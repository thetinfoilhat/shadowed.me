'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  CalendarIcon, 
  UserGroupIcon,
  ClockIcon,
  MapPinIcon,
  TagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';


interface ClubPost {
  id?: string;
  clubId: string;
  clubName: string;
  title: string;
  content: string;
  postType: 'event' | 'announcement' | 'meeting' | 'general';
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
}

interface ClubPostsProps {
  clubId: string;
  clubName: string;
  userEmail: string;
  userName: string;
}

export default function ClubPosts({ clubId, clubName, userEmail, userName }: ClubPostsProps) {
  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<ClubPost | null>(null);
  const [showPostDetails, setShowPostDetails] = useState(false);

  // Ensure arbitrary date-like values are converted to Date
  const toDate = useCallback((value: unknown): Date => {
    if (value instanceof Date) return value;
    // Firestore Timestamp
    if (value && typeof value === 'object' && (value as { toDate?: () => Date }).toDate) {
      try {
        return (value as { toDate: () => Date }).toDate();
      } catch {
        /* fallthrough */
      }
    }
    // Numeric epoch (ms or seconds)
    if (typeof value === 'number') {
      // Heuristic: if seconds, multiply
      const ms = value < 10_000_000_000 ? value * 1000 : value;
      return new Date(ms);
    }
    // ISO string or other stringy
    return new Date(String(value));
  }, []);

  // Debug club ID
  useEffect(() => {
    console.log('ClubPosts: Received props:', { clubId, clubName, userEmail, userName });
  }, [clubId, clubName, userEmail, userName]);

  // Fetch posts for the club
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching posts for clubId:', clubId);
      const response = await fetch(`/api/club-posts?clubId=${clubId}&status=active`);
      if (response.ok) {
        const data = await response.json();
        console.log('Posts fetched:', data.posts);
        // Normalize participant dates to actual Date objects
        const normalized: ClubPost[] = (data.posts || []).map((post: ClubPost & { participants?: { name: string; email: string; grade?: string; school?: string; joinDate?: unknown }[] }) => ({
          ...post,
          participants: (post.participants || []).map((p) => ({
            ...p,
            joinDate: toDate((p as { joinDate?: unknown })?.joinDate)
          }))
        }));
        setPosts(normalized);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch posts:', errorData);
        toast.error('Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [clubId, toDate]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle joining a post
  const handleJoinPost = async (post: ClubPost) => {
    try {
      const response = await fetch('/api/club-posts/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          participant: {
            name: userName,
            email: userEmail,
            grade: '',
            school: ''
          }
        })
      });

      if (response.ok) {
        toast.success('Successfully joined!');
        fetchPosts(); // Refresh posts to update participant count
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to join post');
      }
    } catch (error) {
      console.error('Error joining post:', error);
      toast.error('Failed to join post');
    }
  };

  // Handle leaving a post
  const handleLeavePost = async (post: ClubPost) => {
    try {
      const response = await fetch('/api/club-posts/join', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          participantEmail: userEmail
        })
      });

      if (response.ok) {
        toast.success('Successfully left the post');
        fetchPosts(); // Refresh posts to update participant count
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to leave post');
      }
    } catch (error) {
      console.error('Error leaving post:', error);
      toast.error('Failed to leave post');
    }
  };

  // Check if user is already joined to a post
  const isUserJoined = (post: ClubPost) => {
    return post.participants?.some(p => p.email === userEmail) || false;
  };

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

  const getPostsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return posts.filter(post => post.date === dateStr);
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

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'event': return 'bg-blue-100 text-blue-800';
      case 'meeting': return 'bg-yellow-100 text-yellow-800';
      case 'announcement': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Club Posts & Events</h3>
          <p className="text-sm text-gray-600">Stay updated with {clubName} activities</p>
        </div>
        
        {/* Tab Toggle */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'calendar'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <CalendarIcon className="h-4 w-4 inline mr-1" />
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <UserGroupIcon className="h-4 w-4 inline mr-1" />
            List
          </button>
          <button
            onClick={fetchPosts}
            className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'calendar' ? (
        <CalendarView 
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          getDaysInMonth={getDaysInMonth}
          getPostsForDate={getPostsForDate}
          onPostClick={(post) => {
            setSelectedPost(post);
            setShowPostDetails(true);
          }}
          formatTime={formatTime}
        />
      ) : (
        <ListView 
          posts={posts}
          isUserJoined={isUserJoined}
          onJoinPost={handleJoinPost}
          onLeavePost={handleLeavePost}
          onViewDetails={(post) => {
            setSelectedPost(post);
            setShowPostDetails(true);
          }}
          formatTime={formatTime}
          getPostTypeColor={getPostTypeColor}
        />
      )}

      {/* Post Details Modal */}
      {showPostDetails && selectedPost && (
        <PostDetailsModal
          post={selectedPost}
          isOpen={showPostDetails}
          onClose={() => {
            setShowPostDetails(false);
            setSelectedPost(null);
          }}
          isUserJoined={isUserJoined(selectedPost)}
          onJoinPost={() => handleJoinPost(selectedPost)}
          onLeavePost={() => handleLeavePost(selectedPost)}
          formatTime={formatTime}
          getPostTypeColor={getPostTypeColor}
        />
      )}
    </div>
  );
}

// Calendar View Component
function CalendarView({ 
  currentMonth, 
  setCurrentMonth, 
  getDaysInMonth, 
  getPostsForDate,
  onPostClick,
  formatTime
}: {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  getDaysInMonth: (date: Date) => (Date | null)[];
  getPostsForDate: (date: Date) => ClubPost[];
  onPostClick: (post: ClubPost) => void;
  formatTime: (time: string) => string;
}) {
  const days = getDaysInMonth(currentMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => (
          <div
            key={index}
            className={`min-h-[100px] p-2 border border-gray-200 ${
              day ? 'bg-white' : 'bg-gray-50'
            }`}
          >
            {day && (
              <>
                <div className="text-sm font-medium text-gray-900 mb-2">
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {getPostsForDate(day).map(post => (
                    <div
                      key={post.id}
                      className="text-xs p-1 rounded cursor-pointer hover:bg-blue-50 transition-colors"
                      style={{
                        backgroundColor: post.postType === 'event' ? '#dbeafe' : 
                                       post.postType === 'meeting' ? '#fef3c7' : 
                                       post.postType === 'announcement' ? '#f3e8ff' : '#f3f4f6',
                        color: post.postType === 'event' ? '#1e40af' : 
                               post.postType === 'meeting' ? '#92400e' : 
                               post.postType === 'announcement' ? '#7c3aed' : '#374151'
                      }}
                      onClick={() => onPostClick(post)}
                      title={post.title}
                    >
                      <div className="font-medium truncate">{post.title}</div>
                      {post.startTime && (
                        <div className="text-xs opacity-75">{formatTime(post.startTime)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// List View Component
function ListView({ 
  posts, 
  isUserJoined,
  onJoinPost,
  onLeavePost,
  onViewDetails,
  formatTime,
  getPostTypeColor
}: {
  posts: ClubPost[];
  isUserJoined: (post: ClubPost) => boolean;
  onJoinPost: (post: ClubPost) => void;
  onLeavePost: (post: ClubPost) => void;
  onViewDetails: (post: ClubPost) => void;
  formatTime: (time: string) => string;
  getPostTypeColor: (type: string) => string;
}) {
  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No posts or events yet.</p>
          <p className="text-sm">Check back later for updates!</p>
        </div>
      ) : (
        posts.map(post => (
          <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPostTypeColor(post.postType)}`}>
                    {post.postType}
                  </span>
                  {post.status !== 'active' && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {post.status}
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-3 line-clamp-2">{post.content}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {new Date(post.date).toLocaleDateString()}
                  </div>
                  {post.startTime && (
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatTime(post.startTime)}
                      {post.endTime && ` - ${formatTime(post.endTime)}`}
                    </div>
                  )}
                  {post.location && (
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {post.location}
                    </div>
                  )}
                  {post.maxParticipants && (
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      {post.currentParticipants}/{post.maxParticipants} participants
                    </div>
                  )}
                </div>
                
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <TagIcon className="h-4 w-4 text-gray-400" />
                    {post.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onViewDetails(post)}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  View Details
                </button>
                
                {isUserJoined(post) ? (
                  <button
                    onClick={() => onLeavePost(post)}
                    className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Leave
                  </button>
                ) : (
                  <button
                    onClick={() => onJoinPost(post)}
                    disabled={post.maxParticipants ? post.currentParticipants >= post.maxParticipants : false}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                      post.maxParticipants && post.currentParticipants >= post.maxParticipants
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    <CheckIcon className="h-4 w-4" />
                    {post.maxParticipants && post.currentParticipants >= post.maxParticipants ? 'Full' : 'Join'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Post Details Modal Component
function PostDetailsModal({ 
  post, 
  isOpen, 
  onClose, 
  isUserJoined,
  onJoinPost,
  onLeavePost,
  formatTime,
  getPostTypeColor
}: {
  post: ClubPost;
  isOpen: boolean;
  onClose: () => void;
  isUserJoined: boolean;
  onJoinPost: () => void;
  onLeavePost: () => void;
  formatTime: (time: string) => string;
  getPostTypeColor: (type: string) => string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPostTypeColor(post.postType)}`}>
                {post.postType}
              </span>
              <h3 className="text-xl font-semibold text-gray-900">{post.title}</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Content */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
            <p className="text-gray-900">{post.content}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Date</p>
                <p className="text-gray-900">{new Date(post.date).toLocaleDateString()}</p>
              </div>
            </div>

            {post.startTime && (
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Time</p>
                  <p className="text-gray-900">
                    {formatTime(post.startTime)}
                    {post.endTime && ` - ${formatTime(post.endTime)}`}
                  </p>
                </div>
              </div>
            )}

            {post.location && (
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Location</p>
                  <p className="text-gray-900">{post.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Participants</p>
                <p className="text-gray-900">
                  {post.currentParticipants}
                  {post.maxParticipants && ` / ${post.maxParticipants}`}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Participants List */}
          {post.participants && post.participants.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Current Participants</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {post.participants.map((participant, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-gray-900">{participant.name}</div>
                      <div className="text-sm text-gray-500">{participant.email}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Joined {participant.joinDate.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            {isUserJoined ? (
              <button
                onClick={onLeavePost}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
              >
                <XMarkIcon className="h-4 w-4" />
                Leave Event
              </button>
            ) : (
              <button
                onClick={onJoinPost}
                disabled={post.maxParticipants ? post.currentParticipants >= post.maxParticipants : false}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  post.maxParticipants && post.currentParticipants >= post.maxParticipants
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <CheckIcon className="h-4 w-4" />
                {post.maxParticipants && post.currentParticipants >= post.maxParticipants ? 'Event Full' : 'Join Event'}
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 