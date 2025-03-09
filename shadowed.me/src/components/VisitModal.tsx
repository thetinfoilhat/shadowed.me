'use client';
import { useState, useEffect, Fragment, memo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import SponsorSelect from './SponsorSelect';
import ClubSelect from './ClubSelect';
import LoadingSpinner from '@/components/LoadingSpinner';

// Add CSS to prevent layout shifts
const modalStyles = `
  .visit-modal-form input,
  .visit-modal-form select,
  .visit-modal-form textarea {
    min-height: 40px;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    will-change: border-color, box-shadow;
    appearance: none;
  }
  
  .visit-modal-form textarea {
    min-height: 100px;
    resize: vertical;
  }
  
  .visit-modal-form select {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
  }
  
  .visit-modal-form input[type="number"] {
    -moz-appearance: textfield;
  }
  
  .visit-modal-form input[type="number"]::-webkit-inner-spin-button,
  .visit-modal-form input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  .visit-modal-form .sponsor-select-wrapper select,
  .visit-modal-form .sponsor-select-wrapper div,
  .visit-modal-form .club-select-wrapper select,
  .visit-modal-form .club-select-wrapper div {
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
// Create a memoized version of ClubSelect
const MemoizedClubSelect = memo(ClubSelect);

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
    styleElement.textContent = modalStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Initialize form data from initialData if provided
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
        slots: initialData.slots || 0,
        description: initialData.description || '',
      });
    } else {
      // Reset form when modal is opened without initialData
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
    
    // Reset error state
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      setIsSubmitting(true);
      
      // Validate form data
      if (formData.startTime >= formData.endTime) {
        setError('End time must be after start time');
        setIsSubmitting(false);
        return;
      }
      
      if (formData.slots <= 0) {
        setError('Available slots must be greater than 0');
        setIsSubmitting(false);
        return;
      }
      
      // Submit form data
      await onSubmitAction({
        ...formData,
        id: initialData?.id,
        slots: Number(formData.slots),
      });
      
      // Close modal on success
      onCloseAction();
      
      // Show success toast
      toast.success(initialData ? 'Visit updated successfully' : 'Visit created successfully');
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to save visit opportunity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onCloseAction} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-white shadow-md overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
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

              <div className="overflow-y-auto p-6 flex-1">
                {error && (
                  <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="visit-modal-form">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="club-select-wrapper form-group">
                      <MemoizedClubSelect
                        value={formData.name}
                        onChange={(value) => handleInputChange('name', value)}
                        required
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
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540] min-h-[40px]"
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
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540] min-h-[40px]"
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
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540] min-h-[40px]"
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
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540] min-h-[40px]"
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
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540] min-h-[40px]"
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
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540] min-h-[40px]"
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540] min-h-[100px] resize-y"
                      placeholder="Describe the visit opportunity..."
                    />
                  </div>
                </form>
              </div>

              <div className="flex justify-end gap-4 border-t border-gray-100 p-6 sticky bottom-0 bg-white z-10">
                <button
                  type="button"
                  onClick={onCloseAction}
                  className="px-5 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors text-[#0A2540] font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-md bg-[#38BFA1] text-white hover:bg-[#2DA891] transition-colors disabled:opacity-70 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? 'Processing...' : initialData ? 'Update Visit' : 'Create Visit'}
                </button>
              </div>

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