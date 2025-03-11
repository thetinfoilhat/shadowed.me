'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { ClubListing } from '@/types/club';

// Enhanced categories for filtering - match with club-listings page
const CATEGORIES = ['STEM', 'Business', 'Arts', 'Performing Arts', 'Language & Culture', 'Community Service', 'Humanities', 'Medical', 'Sports', 'Technology', 'Academic', 'Miscellaneous'] as const;

// Common sense attributes for filtering - match with club-listings page
const ATTRIBUTES = ['Competitive', 'Leadership', 'Teamwork', 'Public Speaking', 'Performance'] as const;

interface ClubModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onSubmitAction: () => Promise<void>;
  initialData?: ClubListing | null;
}

export default function ClubModal({ isOpen, onCloseAction, onSubmitAction, initialData }: ClubModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    mission: initialData?.mission || '',
    meetingTimes: initialData?.meetingTimes || '',
    contactInfo: initialData?.contactInfo || '',
    category: initialData?.category || '',
    sponsorEmail: initialData?.sponsorEmail || '',
    roomNumber: initialData?.roomNumber || '',
    attributes: initialData?.attributes || [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    // Validate room number
    const errors: {[key: string]: string} = {};
    if (!formData.roomNumber.trim()) {
      errors.roomNumber = 'Room number is required';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationErrors({});
      const clubData = {
        ...formData,
        captain: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (initialData?.id) {
        await setDoc(doc(db, 'clubs', initialData.id), clubData, { merge: true });
      } else {
        await addDoc(collection(db, 'clubs'), clubData);
      }

      await onSubmitAction();
      onCloseAction();
      toast.success(initialData ? 'Club updated successfully' : 'Club created successfully');
    } catch (error) {
      console.error('Error saving club:', error);
      toast.error('Failed to save club');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAttribute = (attribute: string) => {
    setFormData(prev => {
      const currentAttributes = [...prev.attributes];
      if (currentAttributes.includes(attribute)) {
        return {
          ...prev,
          attributes: currentAttributes.filter(attr => attr !== attribute)
        };
      } else {
        return {
          ...prev,
          attributes: [...currentAttributes, attribute]
        };
      }
    });
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
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

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
            <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-white p-6 relative overflow-y-auto max-h-[90vh]">
              <button
                onClick={onCloseAction}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <Dialog.Title className="text-2xl font-bold text-[#0A2540] mb-6">
                {initialData ? 'Edit Club' : 'Create New Club'}
              </Dialog.Title>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-black">
                      <strong>Important:</strong> Please make sure to provide the room number where your club meets. This information is required and helps students locate your club.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Club Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Club name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black placeholder-black placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
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
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Activity Types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ATTRIBUTES.map((attribute) => (
                      <button
                        key={attribute}
                        type="button"
                        onClick={() => toggleAttribute(attribute)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          formData.attributes.includes(attribute)
                            ? attribute === 'Competitive' 
                              ? 'bg-amber-500 text-white shadow-sm' 
                              : 'bg-[#38BFA1] text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {attribute}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-black opacity-70 mt-1">Optional: Select all that apply</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black placeholder-black placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Mission Statement
                  </label>
                  <textarea
                    value={formData.mission}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                    required
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black placeholder-black placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Room Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    required
                    placeholder="e.g., Room 123"
                    className={`w-full rounded-lg border ${validationErrors.roomNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'} px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#38BFA1]`}
                  />
                  {validationErrors.roomNumber ? (
                    <p className="text-xs text-red-500 mt-1">
                      {validationErrors.roomNumber}
                    </p>
                  ) : (
                    <p className="text-xs text-black opacity-70 mt-1">
                      Please provide the room number where the club meets
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0A2540] mb-2">
                    Meeting Times
                  </label>
                  <input
                    type="text"
                    value={formData.meetingTimes}
                    onChange={(e) => setFormData({ ...formData, meetingTimes: e.target.value })}
                    required
                    placeholder="e.g., Every Monday 3:30 PM - 5:00 PM"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black placeholder-black placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0A2540] mb-2">
                      Contact Information
                    </label>
                    <input
                      type="text"
                      value={formData.contactInfo}
                      onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                      required
                      placeholder="Email or other contact method"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black placeholder-black placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0A2540] mb-2">
                      Sponsor Email
                    </label>
                    <input
                      type="email"
                      id="sponsorEmail"
                      value={formData.sponsorEmail}
                      onChange={(e) => setFormData({ ...formData, sponsorEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-black placeholder-black placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                      placeholder="sponsor@example.com"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <button
                    type="button"
                    onClick={onCloseAction}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#38BFA1] text-white rounded-lg hover:bg-[#2DA891] transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : initialData ? 'Update Club' : 'Create Club'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
} 