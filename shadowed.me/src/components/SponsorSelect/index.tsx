'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SponsorSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

interface Sponsor {
  email: string;
  displayName: string | null;
}

export default function SponsorSelect({ value, onChange, required = true }: SponsorSelectProps) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', 'in', ['sponsor', 'admin']));
        const querySnapshot = await getDocs(q);
        
        const sponsorsList = querySnapshot.docs
          .map(doc => ({
            email: doc.data().email,
            displayName: doc.data().displayName
          }))
          .filter(sponsor => sponsor.email) // Ensure email exists
          .sort((a, b) => {
            // Sort by display name if available, otherwise by email
            const nameA = a.displayName || a.email;
            const nameB = b.displayName || b.email;
            return nameA.localeCompare(nameB);
          });
        
        setSponsors(sponsorsList);
        
        // If there's a default value but it's not in the list, reset it
        if (value && !sponsorsList.some(s => s.email === value)) {
          onChange('');
        }
        
        // If there's only one sponsor and no value is selected, auto-select it
        if (sponsorsList.length === 1 && !value) {
          onChange(sponsorsList[0].email);
        }
      } catch (error) {
        console.error('Error fetching sponsors:', error);
        setError('Failed to load sponsors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, [value, onChange]);

  if (loading) {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Club Sponsor {required && <span className="text-red-500">*</span>}
        </label>
        <div className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-400">
          Loading sponsors...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Club Sponsor {required && <span className="text-red-500">*</span>}
        </label>
        <div className="w-full px-4 py-2 rounded-lg border border-red-200 text-red-500 bg-red-50">
          {error}
        </div>
      </div>
    );
  }

  if (sponsors.length === 0) {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Club Sponsor {required && <span className="text-red-500">*</span>}
        </label>
        <div className="w-full px-4 py-2 rounded-lg border border-amber-200 text-amber-700 bg-amber-50">
          No sponsors are available. Please contact your school administrator to set up a sponsor account before creating a club listing.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Club Sponsor {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A8E9E] text-black"
        required={required}
      >
        <option value="">Select a sponsor</option>
        {sponsors.map((sponsor) => (
          <option key={sponsor.email} value={sponsor.email}>
            {sponsor.displayName ? `${sponsor.displayName} (${sponsor.email})` : sponsor.email}
          </option>
        ))}
      </select>
      <p className="mt-1 text-sm text-gray-500">
        The sponsor will review and approve your club listing before it appears on the site.
      </p>
    </div>
  );
} 