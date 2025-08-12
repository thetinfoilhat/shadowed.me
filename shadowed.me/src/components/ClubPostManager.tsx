'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  CalendarIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserGroupIcon,
  ClockIcon,
  MapPinIcon,
  TagIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';

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
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringDays?: string[];
}

interface ClubPostManagerProps {
  clubId: string;
  clubName: string;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ClubPostManager({ 
  clubId, 
  clubName, 
  userEmail, 
  isOpen, 
  onClose 
}: ClubPostManagerProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ClubPost[]>([]);
  // Track loading while fetching posts
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  // const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ClubPost | null>(null);
  const [selectedPostForParticipants, setSelectedPostForParticipants] = useState<ClubPost | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Normalize various date-like values to a Date instance
  const toDate = useCallback((value: unknown): Date => {
    if (value instanceof Date) return value;
    if (value && typeof value === 'object' && (value as { toDate?: () => Date }).toDate) {
      try {
        return (value as { toDate: () => Date }).toDate();
      } catch {
        // fall through
      }
    }
    if (typeof value === 'number') {
      const ms = value < 10_000_000_000 ? value * 1000 : value;
      return new Date(ms);
    }
    return new Date(String(value));
  }, []);

  // Debug club ID
  useEffect(() => {
    console.log('ClubPostManager: Received props:', { clubId, clubName, userEmail });
  }, [clubId, clubName, userEmail]);

  // Form state for creating/editing posts
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    postType: 'event' as 'event' | 'announcement' | 'meeting' | 'general',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    maxParticipants: '',
    tags: [] as string[],
    isRecurring: false,
    recurringPattern: 'weekly' as 'weekly' | 'monthly' | 'daily',
    recurringDays: [] as string[]
  });

  // Fetch posts for the club
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('ClubPostManager: Fetching posts for clubId:', clubId);
      const response = await fetch(`/api/club-posts?clubId=${clubId}&status=active`);
      if (response.ok) {
        const data = await response.json();
        console.log('ClubPostManager: Posts fetched:', data.posts);
        const normalized: ClubPost[] = (data.posts || []).map((post: ClubPost & { participants?: unknown[] }) => ({
          ...post,
          participants: (post.participants || []).map((p) => {
            const participant = p as { name: string; email: string; grade?: string; school?: string; joinDate?: unknown };
            return {
              ...participant,
              joinDate: toDate(participant.joinDate)
            };
          })
        }));
        setPosts(normalized);
      } else {
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
    if (isOpen) {
      fetchPosts();
    }
  }, [isOpen, fetchPosts]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const postData = {
        clubId,
        clubName,
        title: formData.title,
        content: formData.content,
        postType: formData.postType,
        date: formData.date,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        location: formData.location || undefined,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        tags: formData.tags,
        isRecurring: formData.isRecurring,
        recurringPattern: formData.recurringPattern,
        recurringDays: formData.recurringDays,
        createdBy: user?.uid || '',
        createdByEmail: userEmail
      };

      if (selectedPost) {
        // Update existing post
        console.log('ClubPostManager: Updating post with data:', { postId: selectedPost.id, updates: postData, updatedBy: userEmail });
        const response = await fetch('/api/club-posts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId: selectedPost.id,
            updates: postData,
            updatedBy: userEmail
          })
        });

        if (response.ok) {
          toast.success('Post updated successfully');
          setShowEditModal(false);
          setSelectedPost(null);
          resetForm();
          fetchPosts();
        } else {
          toast.error('Failed to update post');
        }
      } else {
        // Create new post
        console.log('ClubPostManager: Creating post with data:', postData);
        const response = await fetch('/api/club-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postData)
        });

        if (response.ok) {
          toast.success('Post created successfully');
          setShowCreateModal(false);
          resetForm();
          fetchPosts();
        } else {
          toast.error('Failed to create post');
        }
      }
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Failed to save post');
    }
  };

  // Handle post deletion
  const handleDeletePost = async (post: ClubPost) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch('/api/club-posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          deletedBy: userEmail
        })
      });

      if (response.ok) {
        toast.success('Post deleted successfully');
        fetchPosts();
      } else {
        toast.error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      postType: 'event',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      maxParticipants: '',
      tags: [],
      isRecurring: false,
      recurringPattern: 'weekly',
      recurringDays: []
    });
  };

  // Open edit modal
  const openEditModal = (post: ClubPost) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      postType: post.postType,
      date: post.date,
      startTime: post.startTime || '',
      endTime: post.endTime || '',
      location: post.location || '',
      maxParticipants: post.maxParticipants?.toString() || '',
      tags: post.tags || [],
      isRecurring: post.isRecurring || false,
      recurringPattern: post.recurringPattern || 'weekly',
      recurringDays: post.recurringDays || []
    });
    setShowEditModal(true);
  };

  // Open create modal
  const openCreateModal = () => {
    setSelectedPost(null);
    resetForm();
    setFormData(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
    setShowCreateModal(true);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Club Posts Manager</h2>
              <p className="text-gray-600 mt-1">Manage posts and events for {clubName}</p>
            </div>
            <div className="flex items-center gap-3">
                          <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Post
            </button>
            <button
              onClick={async () => {
                // Create a test post
                const testPostData = {
                  clubId,
                  clubName,
                  title: 'Test Post',
                  content: 'This is a test post to verify the system is working.',
                  postType: 'announcement' as const,
                  date: new Date().toISOString().split('T')[0],
                  createdBy: user?.uid || '',
                  createdByEmail: userEmail
                };
                
                try {
                  const response = await fetch('/api/club-posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testPostData)
                  });
                  
                  if (response.ok) {
                    toast.success('Test post created successfully');
                    fetchPosts();
                  } else {
                    toast.error('Failed to create test post');
                  }
                } catch (error) {
                  console.error('Error creating test post:', error);
                  toast.error('Failed to create test post');
                }
              }}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-2"
            >
              Create Test Post
            </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <CalendarIcon className="h-5 w-5 inline mr-2" />
              Calendar View
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <UserGroupIcon className="h-5 w-5 inline mr-2" />
              List View
            </button>
            <button
              onClick={fetchPosts}
              disabled={loading}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Refresh Posts
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'calendar' ? (
            <CalendarView 
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              getDaysInMonth={getDaysInMonth}
              getPostsForDate={getPostsForDate}
              onPostClick={(post) => setSelectedPostForParticipants(post)}
              formatTime={formatTime}
            />
          ) : (
            <ListView 
              posts={posts}
              onEditPost={openEditModal}
              onDeletePost={handleDeletePost}
              onViewParticipants={(post) => setSelectedPostForParticipants(post)}
              formatTime={formatTime}
            />
          )}
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <PostFormModal
            isOpen={showCreateModal || showEditModal}
            onClose={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              setSelectedPost(null);
              resetForm();
            }}
            onSubmit={handleSubmit}
            formData={formData}
            setFormData={setFormData}
            isEditing={!!selectedPost}
          />
        )}

        {/* Participants Modal */}
        {selectedPostForParticipants && (
          <ParticipantsModal
            post={selectedPostForParticipants}
            isOpen={!!selectedPostForParticipants}
            onClose={() => setSelectedPostForParticipants(null)}
            onEditPost={(post) => {
              openEditModal(post);
              setSelectedPostForParticipants(null);
            }}
            onDeletePost={async (post) => {
              await handleDeletePost(post);
              setSelectedPostForParticipants(null);
            }}
          />
        )}
      </div>
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
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xl font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
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
            className={`min-h-[120px] p-2 border border-gray-200 ${
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
  onEditPost, 
  onDeletePost, 
  onViewParticipants,
  formatTime
}: {
  posts: ClubPost[];
  onEditPost: (post: ClubPost) => void;
  onDeletePost: (post: ClubPost) => void;
  onViewParticipants: (post: ClubPost) => void;
  formatTime: (time: string) => string;
}) {
  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'event': return 'bg-blue-100 text-blue-800';
      case 'meeting': return 'bg-yellow-100 text-yellow-800';
      case 'announcement': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No posts yet. Create your first post to get started!</p>
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
                  onClick={() => onViewParticipants(post)}
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  title="View participants"
                >
                  <UserGroupIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onEditPost(post)}
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  title="Edit post"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onDeletePost(post)}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  title="Delete post"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Post Form Modal Component
function PostFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  isEditing 
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: {
    title: string;
    content: string;
    postType: 'event' | 'announcement' | 'meeting' | 'general';
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    maxParticipants: string;
    tags: string[];
    isRecurring: boolean;
    recurringPattern: 'weekly' | 'monthly' | 'daily';
    recurringDays: string[];
  };
  setFormData: (data: {
    title: string;
    content: string;
    postType: 'event' | 'announcement' | 'meeting' | 'general';
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    maxParticipants: string;
    tags: string[];
    isRecurring: boolean;
    recurringPattern: 'weekly' | 'monthly' | 'daily';
    recurringDays: string[];
  }) => void;
  isEditing: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Post' : 'Create New Post'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter post title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                required
                value={formData.postType}
                onChange={(e) => setFormData({ ...formData, postType: e.target.value as 'event' | 'announcement' | 'meeting' | 'general' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="event">Event</option>
                <option value="meeting">Meeting</option>
                <option value="announcement">Announcement</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              required
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter post content"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
              <input
                type="number"
                min="1"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isEditing ? 'Update Post' : 'Create Post'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Participants Modal Component
function ParticipantsModal({ 
  post, 
  isOpen, 
  onClose,
  onEditPost,
  onDeletePost
}: { 
  post: ClubPost; 
  isOpen: boolean; 
  onClose: () => void;
  onEditPost: (post: ClubPost) => void;
  onDeletePost: (post: ClubPost) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Participants - {post.title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">
              {post.currentParticipants}{post.maxParticipants ? ` / ${post.maxParticipants}` : ''} participants
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEditPost(post)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Post
              </button>
              <button
                onClick={() => onDeletePost(post)}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Delete Post
              </button>
            </div>
          </div>

          {post.participants && post.participants.length > 0 ? (
            <div className="space-y-4">
              {post.participants.map((participant, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{participant.name}</div>
                    <div className="text-sm text-gray-500">{participant.email}</div>
                    {(participant.grade || participant.school) && (
                      <div className="text-xs text-gray-400">
                        {participant.grade && `Grade ${participant.grade}`}
                        {participant.grade && participant.school && ' • '}
                        {participant.school}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Joined {participant.joinDate.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UserGroupIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No participants yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 