'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import SponsorSelect from '@/components/SponsorSelect';
import { ClubListingFormData, CLUB_CATEGORIES } from '@/models/ClubListing';

interface ClubListingFormProps {
  onSuccess?: (listingId: string) => void;
  onCancel?: () => void;
}

export default function ClubListingForm({ onSuccess, onCancel }: ClubListingFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ClubListingFormData>({
    name: '',
    description: '',
    category: '',
    meetingLocation: '',
    meetingTime: '',
    contactEmail: '',
    website: '',
    sponsorEmail: '',
    tags: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tag, setTag] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSponsorChange = (sponsorEmail: string) => {
    setFormData(prev => ({ ...prev, sponsorEmail }));
  };

  const addTag = () => {
    if (tag.trim() && !formData.tags?.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag.trim()]
      }));
      setTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a club listing');
      return;
    }
    
    if (!formData.sponsorEmail) {
      setError('Please select a sponsor for your club');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Get user's display name if available
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      // Create the club listing with pending status
      const now = Timestamp.now();
      const listingRef = await addDoc(collection(db, 'clubListings'), {
        ...formData,
        captainEmail: user.email,
        captainName: userData?.displayName || null,
        captainUid: user.uid,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        isActive: true
      });
      
      setSuccess('Your club listing has been submitted for approval by your sponsor');
      
      if (onSuccess) {
        onSuccess(listingRef.id);
      }
    } catch (error) {
      console.error('Error creating club listing:', error);
      setError('Failed to create club listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <h2 className="text-2xl font-semibold text-[#0A2540] mb-6">Create Club Listing</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Club Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A8E9E] text-black"
            placeholder="Enter club name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A8E9E] text-black"
            required
          >
            <option value="">Select a category</option>
            {CLUB_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A8E9E] text-black"
            placeholder="Describe your club, its purpose, and activities"
            rows={4}
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Location
            </label>
            <input
              type="text"
              name="meetingLocation"
              value={formData.meetingLocation}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A8E9E] text-black"
              placeholder="Where does your club meet?"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Time
            </label>
            <input
              type="text"
              name="meetingTime"
              value={formData.meetingTime}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A8E9E] text-black"
              placeholder="When does your club meet?"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A8E9E] text-black"
              placeholder="Email for club inquiries"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A8E9E] text-black"
              placeholder="Club website or social media"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div className="flex items-center">
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A8E9E] text-black"
              placeholder="Add tags to help students find your club"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <button
              type="button"
              onClick={addTag}
              className="ml-2 px-4 py-2 bg-[#38BFA1] text-white rounded-lg hover:bg-[#2DA891] transition-colors"
            >
              Add
            </button>
          </div>
          
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map(tag => (
                <span 
                  key={tag} 
                  className="px-2 py-1 bg-[#E6F7F4] text-[#2A8E9E] text-sm rounded-full flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-[#2A8E9E] hover:text-[#1D6D7B] focus:outline-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Sponsor Selection */}
        <SponsorSelect 
          value={formData.sponsorEmail} 
          onChange={handleSponsorChange}
          required
        />
        
        <div className="pt-4 flex justify-end gap-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-black"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            className="px-6 py-2 rounded-lg bg-[#38BFA1] text-white hover:bg-[#2DA891] transition-colors"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </form>
    </div>
  );
} 