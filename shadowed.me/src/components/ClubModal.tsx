'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { ClubListing } from '@/types/club';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Define categories and activity types
const CATEGORIES = [
  'STEM', 'Business', 'Arts', 'Performing Arts', 'Language & Culture', 
  'Community Service', 'Humanities', 'Medical', 'Sports', 'Technology', 
  'Academic', 'Miscellaneous'
];

const ACTIVITY_TYPES = [
  'Competitive', 'Leadership', 'Tryouts', 'Public Speaking', 'Performance'
];

const CLUB_TYPES = [
  'Academic', 'Athletic', 'Cultural', 'Service', 'Arts', 'Technology', 
  'Leadership', 'Environmental', 'Social', 'Career', 'Religious', 'Political'
];

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
    sponsorEmail: initialData?.sponsorEmail || '',
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialData?.types || []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData?.categories || (initialData?.category ? [initialData.category] : [])
  );
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>(
    initialData?.activityTypes || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const toggleActivityType = (activityType: string) => {
    if (selectedActivityTypes.includes(activityType)) {
      setSelectedActivityTypes(selectedActivityTypes.filter(a => a !== activityType));
    } else {
      setSelectedActivityTypes([...selectedActivityTypes, activityType]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    if (selectedCategories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    try {
      setIsSubmitting(true);
      const clubData = {
        ...formData,
        types: selectedTypes,
        categories: selectedCategories,
        // Keep category field for backward compatibility
        category: selectedCategories.length > 0 ? selectedCategories[0] : '',
        activityTypes: selectedActivityTypes,
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
            <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-white p-6 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={onCloseAction}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              <Dialog.Title className="text-2xl font-bold text-black mb-6">
                {initialData ? 'Edit Club' : 'Create New Club'}
              </Dialog.Title>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Club Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Club name"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                  />
                </div>

                {/* Categories Section */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Categories (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedCategories.map(category => (
                      <div 
                        key={category} 
                        className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                      >
                        <span>{category}</span>
                        <button 
                          type="button" 
                          onClick={() => toggleCategory(category)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CATEGORIES.filter(category => !selectedCategories.includes(category)).map(category => {
                      // Assign different colors based on category
                      let bgColor = "bg-gray-100 hover:bg-gray-200 text-black";
                      if (category === "STEM") bgColor = "bg-blue-100 hover:bg-blue-200 text-blue-800";
                      else if (category === "Business") bgColor = "bg-green-100 hover:bg-green-200 text-green-800";
                      else if (category === "Arts") bgColor = "bg-yellow-100 hover:bg-yellow-200 text-yellow-800";
                      else if (category === "Performing Arts") bgColor = "bg-pink-100 hover:bg-pink-200 text-pink-800";
                      else if (category === "Language & Culture") bgColor = "bg-purple-100 hover:bg-purple-200 text-purple-800";
                      else if (category === "Community Service") bgColor = "bg-cyan-100 hover:bg-cyan-200 text-cyan-800";
                      else if (category === "Humanities") bgColor = "bg-orange-100 hover:bg-orange-200 text-orange-800";
                      else if (category === "Medical") bgColor = "bg-teal-100 hover:bg-teal-200 text-teal-800";
                      else if (category === "Sports") bgColor = "bg-lime-100 hover:bg-lime-200 text-lime-800";
                      else if (category === "Technology") bgColor = "bg-indigo-100 hover:bg-indigo-200 text-indigo-800";
                      else if (category === "Academic") bgColor = "bg-amber-100 hover:bg-amber-200 text-amber-800";
                      
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className={`px-3 py-1 ${bgColor} rounded-full text-sm transition-colors`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                  {selectedCategories.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">Please select at least one category</p>
                  )}
                </div>

                {/* Activity Types Section */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Activity Types (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedActivityTypes.map(activityType => (
                      <div 
                        key={activityType} 
                        className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full"
                      >
                        <span>{activityType}</span>
                        <button 
                          type="button" 
                          onClick={() => toggleActivityType(activityType)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ACTIVITY_TYPES.filter(activityType => !selectedActivityTypes.includes(activityType)).map(activityType => (
                      <button
                        key={activityType}
                        type="button"
                        onClick={() => toggleActivityType(activityType)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-black rounded-full text-sm transition-colors"
                      >
                        {activityType}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Club Types Section */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Club Types (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedTypes.map(type => (
                      <div 
                        key={type} 
                        className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full"
                      >
                        <span>{type}</span>
                        <button 
                          type="button" 
                          onClick={() => toggleType(type)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CLUB_TYPES.filter(type => !selectedTypes.includes(type)).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleType(type)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-black rounded-full text-sm transition-colors"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Mission Statement
                  </label>
                  <textarea
                    value={formData.mission}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                    required
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Meeting Times
                  </label>
                  <input
                    type="text"
                    value={formData.meetingTimes}
                    onChange={(e) => setFormData({ ...formData, meetingTimes: e.target.value })}
                    required
                    placeholder="e.g., Every Monday 3:30 PM - 5:00 PM"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Contact Information
                  </label>
                  <input
                    type="text"
                    value={formData.contactInfo}
                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                    required
                    placeholder="Email or other contact method"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#38BFA1]"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="sponsorEmail" className="block text-sm font-medium text-black mb-1">
                    Sponsor Email
                  </label>
                  <input
                    type="email"
                    id="sponsorEmail"
                    value={formData.sponsorEmail}
                    onChange={(e) => setFormData({ ...formData, sponsorEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                    placeholder="sponsor@example.com"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onCloseAction}
                    className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || selectedCategories.length === 0}
                    className="px-4 py-2 bg-[#38BFA1] text-white rounded-md hover:bg-[#2A8E9E] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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