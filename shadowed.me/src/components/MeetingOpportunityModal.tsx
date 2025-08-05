'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { MeetingOpportunity } from '@/types/club';

interface MeetingOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (meeting: Partial<MeetingOpportunity>) => Promise<void>;
  initialData?: MeetingOpportunity | null;
  clubId: string;
  clubName: string;
  userEmail: string;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const RECURRING_PATTERNS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function MeetingOpportunityModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  clubId,
  clubName,
  userEmail,
}: MeetingOpportunityModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    roomNumber: '',
    startTime: '',
    endTime: '',
    startDate: '',
    endDate: '',
    isRecurring: false,
    recurringPattern: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    recurringDays: [] as string[],
    maxParticipants: 0,
    category: '',
    tags: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        roomNumber: initialData.roomNumber,
        startTime: initialData.startTime,
        endTime: initialData.endTime,
        startDate: initialData.startDate,
        endDate: initialData.endDate || '',
        isRecurring: initialData.isRecurring,
        recurringPattern: initialData.recurringPattern || 'weekly',
        recurringDays: initialData.recurringDays || [],
        maxParticipants: initialData.maxParticipants || 0,
        category: initialData.category || '',
        tags: initialData.tags || [],
      });
    } else {
      setFormData({
        title: '',
        description: '',
        roomNumber: '',
        startTime: '',
        endTime: '',
        startDate: '',
        endDate: '',
        isRecurring: false,
        recurringPattern: 'weekly',
        recurringDays: [],
        maxParticipants: 0,
        category: '',
        tags: [],
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.roomNumber || 
        !formData.startTime || !formData.endTime || !formData.startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.isRecurring && formData.recurringDays.length === 0) {
      toast.error('Please select at least one day for recurring meetings');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        clubId,
        clubName,
        title: formData.title,
        description: formData.description,
        roomNumber: formData.roomNumber,
        startTime: formData.startTime,
        endTime: formData.endTime,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        isRecurring: formData.isRecurring,
        recurringPattern: formData.isRecurring ? formData.recurringPattern : undefined,
        recurringDays: formData.isRecurring ? formData.recurringDays : undefined,
        maxParticipants: formData.maxParticipants || undefined,
        currentParticipants: 0,
        participants: [],
        createdBy: userEmail,
        status: 'active',
        category: formData.category || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      });
      
      toast.success(initialData ? 'Meeting updated successfully' : 'Meeting created successfully');
      onClose();
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast.error('Failed to save meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(day)
        ? prev.recurringDays.filter(d => d !== day)
        : [...prev.recurringDays, day]
    }));
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.currentTarget.value = '';
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                {initialData ? 'Edit Meeting' : 'Create New Meeting'}
              </Dialog.Title>
              <p className="text-sm text-gray-500 mt-1">
                {clubName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Weekly Club Meeting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what this meeting is about..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Room 201"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Academic, Social, etc."
                  />
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Date and Time</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Recurring Options */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isRecurring" className="ml-2 text-sm font-medium text-gray-700">
                  This is a recurring meeting
                </label>
              </div>

              {formData.isRecurring && (
                <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recurring Pattern
                    </label>
                    <select
                      value={formData.recurringPattern}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        recurringPattern: e.target.value as 'weekly' | 'biweekly' | 'monthly' 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {RECURRING_PATTERNS.map(pattern => (
                        <option key={pattern.value} value={pattern.value}>
                          {pattern.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Days of the Week
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <label key={day.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.recurringDays.includes(day.value)}
                            onChange={() => handleDayToggle(day.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Participants */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Participants</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Participants (0 = unlimited)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Tags</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Tags (Press Enter to add)
                </label>
                <input
                  type="text"
                  onKeyDown={handleTagInput}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Type a tag and press Enter..."
                />
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Saving...' : (initialData ? 'Update Meeting' : 'Create Meeting')}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 