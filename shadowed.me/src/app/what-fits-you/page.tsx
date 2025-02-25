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
        
        {/* Competition Club List Section */}
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.08)] mb-12 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0A2540] opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#38BFA1] opacity-5 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <div className="inline-block p-2 bg-[#F0F7FF] rounded-lg mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#0A2540]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-[#0A2540] mb-4">
                Competition Clubs
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Explore these competitive clubs where you can showcase your talents, develop leadership skills, and represent your school at competitions.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* DECA */}
              <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">💼</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2540]">DECA</h3>
                </div>
                <p className="text-gray-600 mb-3">Prepare for careers in marketing, finance, hospitality, and management through competitive events.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Business</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Competitive</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Leadership</span>
                </div>
              </div>
              
              {/* BPA */}
              <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">📊</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2540]">BPA</h3>
                </div>
                <p className="text-gray-600 mb-3">Business Professionals of America prepares students for the business workforce through competitions.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Business</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Technology</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Professional</span>
                </div>
              </div>
              
              {/* Robotics */}
              <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">🤖</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2540]">Robotics Team</h3>
                </div>
                <p className="text-gray-600 mb-3">Design, build, and program robots to compete in challenging FIRST Robotics competitions.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Engineering</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Coding</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Teamwork</span>
                </div>
              </div>
              
              {/* HOSA */}
              <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">⚕️</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2540]">HOSA</h3>
                </div>
                <p className="text-gray-600 mb-3">Future Health Professionals organization for students pursuing careers in healthcare.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Healthcare</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Science</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Medical</span>
                </div>
              </div>
              
              {/* Esports */}
              <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">🎮</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2540]">Esports Club</h3>
                </div>
                <p className="text-gray-600 mb-3">Compete in organized video game competitions representing your school in various game titles.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Gaming</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Strategy</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Teamwork</span>
                </div>
              </div>
              
              {/* Chess Team */}
              <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">♟️</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2540]">Chess Team</h3>
                </div>
                <p className="text-gray-600 mb-3">Develop strategic thinking and compete in chess tournaments against other schools.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Strategy</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Critical Thinking</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Competition</span>
                </div>
              </div>
              
              {/* Math Team */}
              <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">🔢</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2540]">Math Team</h3>
                </div>
                <p className="text-gray-600 mb-3">Solve challenging math problems and compete in regional and national mathematics competitions.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Mathematics</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Problem-Solving</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Analytical</span>
                </div>
              </div>
              
              {/* Debate */}
              <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">🗣️</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2540]">Debate</h3>
                </div>
                <p className="text-gray-600 mb-3">Develop argumentation skills and compete in formal debate competitions on current issues.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Public Speaking</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Critical Thinking</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Research</span>
                </div>
              </div>
              
              {/* Model UN */}
              <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">🌎</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2540]">Model UN</h3>
                </div>
                <p className="text-gray-600 mb-3">Simulate United Nations conferences and compete in diplomatic negotiations on global issues.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Global Issues</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Diplomacy</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Public Speaking</span>
                </div>
              </div>
              
              {/* Show Choir */}
              <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">🎤</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2540]">Show Choir</h3>
                </div>
                <p className="text-gray-600 mb-3">Perform choreographed singing routines and compete in show choir competitions.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Singing</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Dance</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Performance</span>
                </div>
              </div>
              
              {/* Orchesis */}
              <div className="bg-gradient-to-br from-[#F0F7FF] to-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl">💃</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0A2540]">Orchesis</h3>
                </div>
                <p className="text-gray-600 mb-3">Perform in dance showcases and compete in dance competitions across various styles.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Dance</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Choreography</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Performance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 