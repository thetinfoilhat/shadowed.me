'use client';
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Club } from '@/types/club';

const CATEGORIES = ['STEM', 'Business', 'Humanities', 'Medical', 'Community Service', 'Arts'] as const;

export default function VisitModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Club | null;
}) {
  const [formData, setFormData] = useState({
    name: '',
    school: '',
    category: CATEGORIES[0],
    contactEmail: '',
    date: '',
    startTime: '',
    endTime: '',
    slots: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        school: initialData.school || '',
        category: initialData.category || CATEGORIES[0],
        contactEmail: initialData.contactEmail || '',
        date: initialData.date || '',
        startTime: initialData.startTime || '',
        endTime: initialData.endTime || '',
        slots: initialData.slots?.toString() || '',
        description: initialData.description || '',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit({
        ...formData,
        id: initialData?.id,
        categories: [formData.category],
        slots: parseInt(formData.slots),
      });
      setFormData({
        name: '',
        school: '',
        category: CATEGORIES[0],
        contactEmail: '',
        date: '',
        startTime: '',
        endTime: '',
        slots: '',
        description: '',
      });
      onClose();
    } catch (err) {
      setError('Failed to save visit opportunity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-white p-8">
          <Dialog.Title className="text-2xl font-semibold text-black mb-6">
            {initialData ? 'Edit Visit Opportunity' : 'Create Visit Opportunity'}
          </Dialog.Title>

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

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  School
                </label>
                <input
                  type="text"
                  required
                  value={formData.school}
                  onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] text-black"
                >
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
                  onChange={(e) => setFormData(prev => ({ ...prev, slots: e.target.value }))}
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

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
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