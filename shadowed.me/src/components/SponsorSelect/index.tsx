'use client';
import { useState, useEffect, memo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SponsorSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

interface Sponsor {
  email: string;
  displayName?: string;
}

const SponsorSelect = ({ value, onChange, required }: SponsorSelectProps) => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('role', 'in', ['sponsor', 'admin'])
        );
        const querySnapshot = await getDocs(q);
        
        const sponsorsList: Sponsor[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          // Only include users with an email
          if (userData.email) {
            sponsorsList.push({
              email: userData.email,
              displayName: userData.displayName || userData.email,
            });
          }
        });
        
        // Sort sponsors by display name or email
        sponsorsList.sort((a, b) => {
          const nameA = a.displayName || a.email;
          const nameB = b.displayName || b.email;
          return nameA.localeCompare(nameB);
        });
        
        setSponsors(sponsorsList);
        setError('');
        
        // Auto-select if only one sponsor and no value is selected
        if (sponsorsList.length === 1 && !value) {
          onChange(sponsorsList[0].email);
        }
      } catch (err) {
        console.error('Error fetching sponsors:', err);
        setError('Failed to load sponsors');
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, [onChange, value]);

  if (loading) {
    return (
      <div className="form-group">
        <label className="block text-sm font-medium text-[#0A2540]">
          Sponsor <span className="text-red-500">*</span>
        </label>
        <div className="w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-gray-500 flex items-center min-h-[40px]">
          <svg className="animate-spin h-4 w-4 mr-2 text-[#38BFA1]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading sponsors...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-group">
        <label className="block text-sm font-medium text-[#0A2540]">
          Sponsor <span className="text-red-500">*</span>
        </label>
        <div className="w-full rounded-md border border-red-300 px-3 py-2 bg-red-50 text-red-600 flex items-center min-h-[40px]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      </div>
    );
  }

  if (sponsors.length === 0) {
    return (
      <div className="form-group">
        <label className="block text-sm font-medium text-[#0A2540]">
          Sponsor <span className="text-red-500">*</span>
        </label>
        <div className="w-full rounded-md border border-yellow-300 px-3 py-2 bg-yellow-50 text-yellow-700 flex items-center min-h-[40px]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          No sponsors available
        </div>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className="block text-sm font-medium text-[#0A2540]">
        Sponsor <span className="text-red-500">*</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-[#0A2540] appearance-none bg-white min-h-[40px]"
        required={required}
      >
        <option value="">Select a sponsor</option>
        {sponsors.map((sponsor) => (
          <option key={sponsor.email} value={sponsor.email}>
            {sponsor.displayName} ({sponsor.email})
          </option>
        ))}
      </select>
    </div>
  );
};

// Add comparison function to prevent unnecessary re-renders
const areEqual = (prevProps: SponsorSelectProps, nextProps: SponsorSelectProps) => {
  return prevProps.value === nextProps.value;
};

export default memo(SponsorSelect, areEqual); 