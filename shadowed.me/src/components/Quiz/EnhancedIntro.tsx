'use client';
import React from 'react';
import { motion } from 'framer-motion';

interface EnhancedIntroProps {
  onStartQuiz: () => void;
}

const EnhancedIntro: React.FC<EnhancedIntroProps> = ({ onStartQuiz }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative overflow-hidden border border-gray-100"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#38BFA1] opacity-5 rounded-full -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#0A2540] opacity-5 rounded-full -ml-16 -mb-16"></div>
      <div className="absolute top-1/4 left-0 w-24 h-24 bg-[#FF7D54] opacity-10 rounded-full -ml-12"></div>
      <div className="absolute bottom-1/3 right-0 w-32 h-32 bg-[#3B82F6] opacity-10 rounded-full -mr-16"></div>
      
      <div className="relative z-10 text-center">
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#3B82F6] to-[#38BFA1] rounded-full mb-6 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-3xl font-bold text-[#0A2540] mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#0A2540] to-[#3B82F6]"
        >
          Find Your Perfect Club Match
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-gray-600 mb-6 max-w-lg mx-auto leading-relaxed"
        >
          Answer questions about your interests and preferences, and our advanced matching algorithm will suggest clubs that might be a great fit for you!
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="bg-blue-50 p-4 rounded-lg mb-8 max-w-lg mx-auto"
        >
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-semibold text-blue-600">How it works:</span> Our algorithm analyzes your responses to find clubs that match your core interests. A high match percentage (90%+) means the club aligns exceptionally well with your preferences. Most matches will fall in the 60-85% range, indicating good compatibility.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10"
        >
          <div className="flex items-center group">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#38BFA1] text-white font-medium mr-3 shadow-md transition-transform group-hover:scale-110 duration-300">
              1
            </div>
            <span className="text-sm text-gray-600 group-hover:text-[#3B82F6] transition-colors duration-300">Answer questions</span>
          </div>
          
          <div className="hidden sm:block w-12 h-[2px] bg-gradient-to-r from-[#3B82F6] to-[#38BFA1]"></div>
          
          <div className="flex items-center group">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#38BFA1] text-white font-medium mr-3 shadow-md transition-transform group-hover:scale-110 duration-300">
              2
            </div>
            <span className="text-sm text-gray-600 group-hover:text-[#3B82F6] transition-colors duration-300">Get matched</span>
          </div>
          
          <div className="hidden sm:block w-12 h-[2px] bg-gradient-to-r from-[#3B82F6] to-[#38BFA1]"></div>
          
          <div className="flex items-center group">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#38BFA1] text-white font-medium mr-3 shadow-md transition-transform group-hover:scale-110 duration-300">
              3
            </div>
            <span className="text-sm text-gray-600 group-hover:text-[#3B82F6] transition-colors duration-300">Explore clubs</span>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto"
        >
          {[
            { emoji: "🎨", name: "Art Clubs", delay: 0.7 },
            { emoji: "🌎", name: "Language & Culture", delay: 0.75 },
            { emoji: "🔬", name: "STEM Clubs", delay: 0.8 },
            { emoji: "🎭", name: "Performing Arts", delay: 0.85 },
            { emoji: "💼", name: "Business Clubs", delay: 0.9 },
            { emoji: "❤️", name: "Community Service", delay: 0.95 }
          ].map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: category.delay }}
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              className="bg-gradient-to-br from-white to-[#E6F7F4]/30 p-4 rounded-xl text-center border border-gray-100 shadow-sm hover:border-[#38BFA1]/30 cursor-pointer"
            >
              <span className="text-2xl mb-2 block">{category.emoji}</span>
              <span className="text-xs font-medium text-[#0A2540]">{category.name}</span>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStartQuiz}
          className="bg-gradient-to-r from-[#3B82F6] to-[#38BFA1] text-white px-10 py-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Start Quiz
        </motion.button>
      </div>
    </motion.div>
  );
};

export default EnhancedIntro; 