'use client';
import { useState, useEffect, Fragment, memo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import SponsorSelect from './SponsorSelect';
import LoadingSpinner from '@/components/LoadingSpinner';

// Add CSS to prevent layout shifts
const modalStyles = `
  .visit-modal-form input,
  .visit-modal-form select,
  .visit-modal-form textarea {
    min-height: 40px;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    will-change: border-color, box-shadow;
  }
  
  .visit-modal-form textarea {
    min-height: 100px;
  }
  
  .visit-modal-form .sponsor-select-wrapper select,
  .visit-modal-form .sponsor-select-wrapper div {
    min-height: 40px;
  }
  
  .visit-modal-form label {
    display: block;
    margin-bottom: 8px;
  }
  
  .visit-modal-form .form-group {
    margin-bottom: 24px;
  }
`;

const CATEGORIES = ['STEM', 'Business', 'Humanities', 'Medical', 'Community Service', 'Arts'] as const;

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

// Create a memoized version of SponsorSelect
const MemoizedSponsorSelect = memo(SponsorSelect);

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

  // Add styles to head when component mounts
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = modalStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Reset form when modal opens/closes or initialData changes
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
    // Reset error state when modal opens/closes
    setError('');
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

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onCloseAction} className="relative z-50">
        {/* Background overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        </Transition.Child>
        
        {/* Modal panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-white shadow-md overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <Dialog.Title className="text-xl font-semibold text-[#0A2540]">
                  {initialData ? 'Edit Visit Opportunity' : 'Create Visit Opportunity'}
                </Dialog.Title>
                <button
                  onClick={onCloseAction}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  aria-label="Close"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-6 visit-modal-form">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-[#0A2540]">
                      Club Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540]"
                      placeholder="Enter club name"
                    />
                  </div>

                  <div className="sponsor-select-wrapper form-group">
                    <MemoizedSponsorSelect
                      value={formData.sponsorEmail}
                      onChange={(value) => handleInputChange('sponsorEmail', value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-[#0A2540]">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540]"
                      required
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-[#0A2540]">
                      Contact Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540]"
                      placeholder="contact@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-[#0A2540]">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540]"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-[#0A2540]">
                      Available Slots <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.slots}
                      onChange={(e) => handleInputChange('slots', Number(e.target.value))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540]"
                      placeholder="10"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-[#0A2540]">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540]"
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-medium text-[#0A2540]">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540]"
                    />
                  </div>
                </div>

                <div className="form-group mb-6">
                  <label className="block text-sm font-medium text-[#0A2540]">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540]"
                    placeholder="Describe the visit opportunity..."
                  />
                </div>

                <div className="flex justify-end gap-4 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={onCloseAction}
                    className="px-5 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors text-[#0A2540] font-medium"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-md bg-[#38BFA1] text-white hover:bg-[#2DA891] transition-colors disabled:opacity-70 disabled:cursor-not-allowed font-medium"
                  >
                    {isSubmitting ? 'Processing...' : initialData ? 'Update Visit' : 'Create Visit'}
                  </button>
                </div>
              </form>

              {isSubmitting && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <LoadingSpinner size="md" />
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
} 