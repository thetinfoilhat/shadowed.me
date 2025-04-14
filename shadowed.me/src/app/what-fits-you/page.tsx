'use client';
import ClubQuiz from '@/components/Quiz/ClubQuiz';

export default function WhatFitsYou() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f8fbff]">
      <div className="max-w-[1400px] mx-auto px-8 py-16">
        <div className="flex flex-col items-center mb-12 relative">
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#38BFA1] opacity-5 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#0A2540] opacity-5 rounded-full"></div>
          
          <h1 className="text-5xl font-bold text-[#0A2540] mb-4 text-center relative z-10">What Fits You!</h1>
          <div className="w-24 h-1 bg-[#38BFA1] rounded-full mb-6"></div>
          <p className="text-xl text-gray-600 max-w-2xl text-center">
            Discover the perfect extracurricular activities that match your unique interests and talents.
          </p>
        </div>
        
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.08)] mb-12 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#38BFA1] opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#0A2540] opacity-5 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <div className="inline-block p-2 bg-[#E6F7F4] rounded-lg mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#38BFA1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-[#0A2540] mb-4">
                Find Your Perfect Match
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Take our interactive quiz to discover which clubs and activities align best with your interests and goals.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <div className="flex items-center bg-[#F0F7FF] px-4 py-2 rounded-full">
                  <div className="w-3 h-3 bg-[#38BFA1] rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-[#0A2540]">Personalized Results</span>
                </div>
                <div className="flex items-center bg-[#F0F7FF] px-4 py-2 rounded-full">
                  <div className="w-3 h-3 bg-[#38BFA1] rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-[#0A2540]">Quick & Easy</span>
                </div>
                <div className="flex items-center bg-[#F0F7FF] px-4 py-2 rounded-full">
                  <div className="w-3 h-3 bg-[#38BFA1] rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-[#0A2540]">30+ Club Options</span>
                </div>
              </div>
            </div>
            
            <ClubQuiz />
          </div>
        </div>
      </div>
    </div>
  );
} 