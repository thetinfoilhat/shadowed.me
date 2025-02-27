'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ClubListingForm from '@/components/ClubListingForm';

export default function CreateClubPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  const handleSuccess = () => {
    setSubmitted(true);
  };

  const handleCancel = () => {
    router.push('/student-dashboard');
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold text-[#0A2540] mb-8">Create a New Club</h1>
      
      {submitted ? (
        <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-2">Club Listing Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your club listing has been submitted and is pending approval from your sponsor.
              You will be notified once it has been reviewed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/student-dashboard')}
                className="px-6 py-2 rounded-lg bg-[#38BFA1] text-white hover:bg-[#2DA891] transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Create Another Club
              </button>
            </div>
          </div>
        </div>
      ) : (
        <ClubListingForm 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
} 