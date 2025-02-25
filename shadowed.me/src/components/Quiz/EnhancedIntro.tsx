import React from 'react';

interface EnhancedIntroProps {
  onStartQuiz: () => void;
}

const EnhancedIntro: React.FC<EnhancedIntroProps> = ({ onStartQuiz }) => {
  return (
    <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#38BFA1] opacity-5 rounded-full -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#0A2540] opacity-5 rounded-full -ml-16 -mb-16"></div>
      
      <div className="relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E6F7F4] rounded-full mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#38BFA1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-[#0A2540] mb-4">
          Find Your Perfect Club Match
        </h2>
        
        <p className="text-gray-600 mb-6 max-w-lg mx-auto">
          Answer a few questions about your interests and preferences, and we&apos;ll suggest clubs that might be a great fit for you!
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#38BFA1] text-white font-medium mr-3">
              1
            </div>
            <span className="text-sm text-gray-600">Answer questions</span>
          </div>
          
          <div className="hidden sm:block w-8 h-[2px] bg-gray-200"></div>
          
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#38BFA1] text-white font-medium mr-3">
              2
            </div>
            <span className="text-sm text-gray-600">Get matched</span>
          </div>
          
          <div className="hidden sm:block w-8 h-[2px] bg-gray-200"></div>
          
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#38BFA1] text-white font-medium mr-3">
              3
            </div>
            <span className="text-sm text-gray-600">Explore clubs</span>
          </div>
        </div>
        
        <div className="bg-[#F0F7FF] p-4 rounded-lg mb-8 max-w-md mx-auto">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-[#0A2540]">Pro tip:</span> You can skip up to 10 questions if you&apos;re not sure about an answer.
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8 max-w-2xl mx-auto">
          <div className="bg-[#E6F7F4]/30 p-3 rounded-lg text-center">
            <span className="text-lg mb-1 block">🎨</span>
            <span className="text-xs font-medium text-[#0A2540]">Art Clubs</span>
          </div>
          <div className="bg-[#E6F7F4]/30 p-3 rounded-lg text-center">
            <span className="text-lg mb-1 block">🌎</span>
            <span className="text-xs font-medium text-[#0A2540]">Language & Culture</span>
          </div>
          <div className="bg-[#E6F7F4]/30 p-3 rounded-lg text-center">
            <span className="text-lg mb-1 block">🔬</span>
            <span className="text-xs font-medium text-[#0A2540]">STEM Clubs</span>
          </div>
          <div className="bg-[#E6F7F4]/30 p-3 rounded-lg text-center">
            <span className="text-lg mb-1 block">🎭</span>
            <span className="text-xs font-medium text-[#0A2540]">Performing Arts</span>
          </div>
          <div className="bg-[#E6F7F4]/30 p-3 rounded-lg text-center">
            <span className="text-lg mb-1 block">💼</span>
            <span className="text-xs font-medium text-[#0A2540]">Business Clubs</span>
          </div>
          <div className="bg-[#E6F7F4]/30 p-3 rounded-lg text-center">
            <span className="text-lg mb-1 block">❤️</span>
            <span className="text-xs font-medium text-[#0A2540]">Community Service</span>
          </div>
        </div>
        
        <button
          onClick={onStartQuiz}
          className="bg-[#38BFA1] text-white px-8 py-3 rounded-lg hover:bg-[#2DA891] transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-200"
        >
          Start Quiz
        </button>
      </div>
    </div>
  );
};

export default EnhancedIntro; 