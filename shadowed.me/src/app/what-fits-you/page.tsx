'use client';
import ClubQuiz from '@/components/ClubQuiz';

export default function WhatFitsYou() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-8 py-16">
        <h1 className="text-4xl font-semibold text-[#0A2540] mb-8">What Fits You!</h1>
        
        <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-8">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">
              Find Your Perfect Match
            </h2>
            <p className="text-gray-600">
              Take our interactive quiz to discover which clubs and activities align best with your interests and goals.
            </p>
          </div>
          
          <ClubQuiz />
        </div>
      </div>
    </div>
  );
} 