'use client';
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import SponsorSelect from './SponsorSelect';

const CATEGORIES = ['STEM', 'Business', 'Humanities', 'Medical', 'Community Service', 'Arts'] as const;
type Category = typeof CATEGORIES[number];

interface VisitData {
  id?: string;
  name: string;
  school?: string; // Keep for backward compatibility
  sponsorEmail: string;
  category: string;
  contactEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  slots: number;
  description: string;
  captain?: string;
  applicants?: Array<{ name: string; email: string; grade: string; school: string }>;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
}

interface FormData {
  name: string;
  sponsorEmail: string;
  category: string;
  contactEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  slots: number;
  description: string;
}

export default function VisitModal({ 
  isOpen, 
  onCloseAction,
  onSubmitAction,
  initialData = null 
}: { 
  isOpen: boolean;
  onCloseAction: () => void;
  onSubmitAction: (data: VisitData) => Promise<void>;
  initialData?: VisitData | null;
}) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    sponsorEmail: '',
    category: '',
    contactEmail: '',
    date: '',
    startTime: '',
    endTime: '',
    slots: 0,
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        sponsorEmail: initialData.sponsorEmail || '',
        category: initialData.category || '',
        contactEmail: initialData.contactEmail || '',
        date: initialData.date || '',
        startTime: initialData.startTime || '',
        endTime: initialData.endTime || '',
        slots: parseInt(initialData.slots?.toString() || '0'),
        description: initialData.description || '',
      });
    } else {
      setFormData({
        name: '',
        sponsorEmail: '',
        category: '',
        contactEmail: '',
        date: '',
        startTime: '',
        endTime: '',
        slots: 0,
        description: '',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmitAction({
        ...formData,
        id: initialData?.id,
        applicants: initialData?.applicants || [],
        captain: initialData?.captain || '',
        status: initialData?.status || 'pending',
        createdAt: initialData?.createdAt || new Date(),
      } as VisitData);
      setFormData({
        name: '',
        sponsorEmail: '',
        category: '',
        contactEmail: '',
        date: '',
        startTime: '',
        endTime: '',
        slots: 0,
        description: '',
      });
      onCloseAction();
      toast.success(initialData ? 'Visit updated successfully!' : 'Visit created successfully! It will be visible after sponsor approval.');
    } catch (error: unknown) {
      console.error(error);
      setError('Failed to save visit opportunity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onCloseAction} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-white p-8">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-2xl font-semibold text-black">
              {initialData ? 'Edit Visit Opportunity' : 'Create Visit Opportunity'}
            </Dialog.Title>
            <button
              onClick={onCloseAction}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-500 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Club Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-black"
                />
              </div>

              <SponsorSelect
                value={formData.sponsorEmail}
                onChange={(value) => setFormData(prev => ({ ...prev, sponsorEmail: value }))}
                required
              />

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-black"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category} className="text-black">
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Available Slots
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.slots}
                  onChange={(e) => setFormData(prev => ({ ...prev, slots: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Description
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-black"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onCloseAction}
                className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg bg-[#38BFA1] text-white hover:bg-[#2DA891] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : initialData ? 'Update Visit' : 'Create Visit'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 