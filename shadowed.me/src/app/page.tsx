'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import CountUp from 'react-countup';
import { useState, useEffect } from 'react';

// Animated text component that cycles between phrases
const AnimatedHeadline = () => {
  const phrases = [
    "find free opportunities",
    "discover their interests",
    "chase their passions"
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [phrases.length]);
  
  return (
    <motion.div 
      className="text-2xl md:text-4xl font-bold text-center mb-16 md:mb-32"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex flex-col md:flex-row justify-center items-center">
        <h2 className="flex flex-wrap justify-center items-center">
          <span className="text-[#0A2540] mr-0 md:mr-2 mb-2 md:mb-0">We help students</span>
          <span className="relative inline-block text-[#2A8E9E] overflow-hidden w-full md:w-auto" style={{ minHeight: '40px', height: 'auto' }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={currentIndex}
                className="absolute left-0 right-0 text-center md:text-left whitespace-normal md:whitespace-nowrap"
                initial={{ opacity: 0, filter: "blur(8px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(8px)" }}
                transition={{ 
                  opacity: { duration: 0.7, ease: "easeInOut" },
                  filter: { duration: 0.7, ease: "easeInOut" }
                }}
              >
                {phrases[currentIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
        </h2>
      </div>
      
      {/* Animated underline */}
      <motion.div 
        className="h-1 bg-gradient-to-r from-[#2A8E9E] to-[#38BFA1] rounded-full mx-auto mt-6"
        initial={{ width: 0 }}
        whileInView={{ width: "240px" }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
      />
    </motion.div>
  );
};

// Custom synchronized counter component
const SyncedCounters = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );
    
    const element = document.getElementById('stats-section');
    if (element) observer.observe(element);
    
    return () => {
      if (element) observer.unobserve(element);
    };
  }, [hasAnimated]);
  
  return (
    <div className="flex flex-wrap justify-center gap-20 md:gap-40 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 0.1 }}
        className="text-center relative group"
      >
        <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-[#2A8E9E]/5 to-[#38BFA1]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute -top-8 -right-8 w-12 h-12 rounded-full bg-[#2A8E9E]/10 flex items-center justify-center text-xl">
          👨‍🎓
        </div>
        <motion.div 
          className="text-7xl font-bold text-[#2A8E9E] mb-4 relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 60, 
            duration: 0.8 
          }}
        >
          {isVisible && (
            <CountUp
              start={0}
              end={500}
              duration={2.5}
              suffix="+"
              useEasing={true}
              decimals={0}
              decimal=""
              className="relative"
            />
          )}
          <motion.div 
            className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-[#2A8E9E] to-[#2A8E9E]/30"
            initial={{ width: 0 }}
            animate={isVisible ? { width: "100%" } : { width: 0 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
          />
        </motion.div>
        <motion.div 
          className="text-xl text-[#0A2540]"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.5 }}
        >
          Active Students
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 0.2 }}
        className="text-center relative group"
      >
        <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-[#2A8E9E]/5 to-[#38BFA1]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute -top-8 -right-8 w-12 h-12 rounded-full bg-[#2A8E9E]/10 flex items-center justify-center text-xl">
          🏫
        </div>
        <motion.div 
          className="text-7xl font-bold text-[#2A8E9E] mb-4 relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 60, 
            duration: 0.8 
          }}
        >
          {isVisible && (
            <CountUp
              start={0}
              end={50}
              duration={2.5}
              suffix="+"
              useEasing={true}
              decimals={0}
              decimal=""
              className="relative"
            />
          )}
          <motion.div 
            className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-[#2A8E9E] to-[#2A8E9E]/30"
            initial={{ width: 0 }}
            animate={isVisible ? { width: "100%" } : { width: 0 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
          />
        </motion.div>
        <motion.div 
          className="text-xl text-[#0A2540]"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.5 }}
        >
          School Clubs
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 0.3 }}
        className="text-center relative group"
      >
        <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-[#2A8E9E]/5 to-[#38BFA1]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute -top-8 -right-8 w-12 h-12 rounded-full bg-[#2A8E9E]/10 flex items-center justify-center text-xl">
          ⏱️
        </div>
        <motion.div 
          className="text-7xl font-bold text-[#2A8E9E] mb-4 relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 60, 
            duration: 0.8 
          }}
        >
          {isVisible && (
            <CountUp
              start={0}
              end={1000}
              duration={2.5}
              suffix="+"
              useEasing={true}
              decimals={0}
              decimal=""
              className="relative"
            />
          )}
          <motion.div 
            className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-[#2A8E9E] to-[#2A8E9E]/30"
            initial={{ width: 0 }}
            animate={isVisible ? { width: "100%" } : { width: 0 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
          />
        </motion.div>
        <motion.div 
          className="text-xl text-[#0A2540]"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.5 }}
        >
          Hours Logged
        </motion.div>
      </motion.div>
    </div>
  );
};

export default function Home() {
  return (
    <div className="pt-[70px] md:pt-[100px] min-h-screen bg-[#FAFAFA] overflow-x-hidden" suppressHydrationWarning>
      {/* Hero Section */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-16 pt-12 md:pt-24 pb-24 md:pb-48 lg:pb-64">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-24">
          {/* Left Column */}
          <div>
            <motion.h1 
              className="text-[2rem] sm:text-[2.5rem] md:text-[3.5rem] lg:text-[4.5rem] leading-[1.15] mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-[#180D39]">
                Helping students<br />
                <span className="font-bold">
                  find their<br />
                  <span className="relative inline-block">
                    light.
                    <span className="absolute bottom-2 left-0 w-full h-1 bg-gradient-to-r from-[#2A8E9E] to-[#2A8E9E]/30" />
                  </span>
                </span>
              </span>
            </motion.h1>
            
            <div className="mt-8">
              <motion.p 
                className="text-base md:text-lg lg:text-xl text-[#180D39]/70 mb-8 md:mb-12 max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
              >
                Supporting students with simple searching, instant club registration, and easy outreach tracking.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Link href="/school-clubs">
                  <button className="w-full sm:w-auto bg-[#2A8E9E] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-medium hover:bg-[#247A87] transition-colors">
                    Get Started →
                  </button>
                </Link>
                <span className="text-[#180D39]/40 mt-2 sm:mt-0">Join 500+ students</span>
              </motion.div>
            </div>
          </div>

          {/* Right Column - only show on larger screens */}
          <div className="relative pt-12 md:pt-24 hidden md:block">
            {/* Main Feature Card */}
            <motion.div 
              className="bg-gradient-to-br from-[#180D39] to-[#1D1145] rounded-2xl p-8 shadow-xl w-full md:w-[95%]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-start gap-6">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="relative w-16 h-16">
                    {/* Animated calendar illustration */}
                    <motion.div 
                      className="absolute inset-0 bg-[#2A8E9E]/20 rounded-lg"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <div className="relative h-full flex items-center justify-center">
                      <span className="text-3xl">📅</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-white text-xl font-semibold mb-3">
                    Upcoming Opportunities
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <div className="text-[#2A8E9E] font-medium">Physics Club Visit</div>
                        <div className="text-white/70 text-sm mt-1">Neuqua Valley High School</div>
                      </div>
                      <div className="text-white/50 text-sm">Mar 15</div>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <div className="text-[#2A8E9E] font-medium">Food Bank Volunteering</div>
                        <div className="text-white/70 text-sm mt-1">Loaves & Fishes</div>
                      </div>
                      <div className="text-white/50 text-sm">Mar 18</div>
                    </div>
                  </div>

                  <Link 
                    href="/school-clubs"
                    className="mt-6 text-[#2A8E9E] text-sm font-medium flex items-center gap-2 group w-fit"
                  >
                    <motion.span
                      className="flex items-center gap-2"
                      whileHover={{ x: 5 }}
                    >
                      View all opportunities
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </motion.span>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Stats Card */}
            <motion.div 
              className="absolute top-4 right-4 bg-[#2A8E9E] rounded-2xl p-4 shadow-lg w-56"
              initial={{ opacity: 0, y: 20, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-white/90 text-sm font-medium">Active Students</div>
              <div className="text-white text-2xl font-bold mt-1">500+</div>
              <div className="text-white/70 text-xs mt-1">across 12 schools</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Wave and Features Section */}
      <div className="relative w-full -mt-24 md:-mt-100">
        <svg 
          className="absolute top-0 left-0 w-full h-[600px]"
          viewBox="0 0 1440 600"
          preserveAspectRatio="none"
          style={{ transform: 'translateY(-15%)' }}
        >
          <defs>
            <linearGradient id="backgroundGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2A8E9E" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#2A8E9E" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#2A8E9E" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Wave Path */}
          <path 
            fill="url(#backgroundGradient)"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,106.7C960,117,1056,139,1152,133.3C1248,128,1344,96,1392,80L1440,64L1440,600L1392,600C1344,600,1248,600,1152,600C1056,600,960,600,864,600C768,600,672,600,576,600C480,600,384,600,288,600C192,600,96,600,48,600L0,600Z"
          />
        </svg>

        {/* Content */}
        <div className="relative pt-48 md:pt-64">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-16">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-20">
              <motion.h2 
                className="text-2xl sm:text-3xl font-bold text-[#0A2540] max-w-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Experience that grows with your interests
              </motion.h2>
              <motion.p 
                className="text-base sm:text-lg text-gray-500 max-w-md"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                Designed to find volunteering opportunities that work for your schedule and interests.
              </motion.p>
            </div>
            {/* Feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-12">
              {/* Easy Discovery Card */}
              <motion.div 
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-[#180D39]/5"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="bg-[#2A8E9E]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-[#180D39] mb-3">Easy Discovery</h3>
                <p className="text-[#180D39]/70">
                  Find opportunities that match your interests and schedule
                </p>
              </motion.div>

              {/* Quick Registration Card */}
              <motion.div 
                className="bg-white rounded-2xl p-10 shadow-lg hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="bg-[#2A8E9E]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold text-[#0A2540] mb-3">Quick Registration</h3>
                <p className="text-[#180D39]/70">
                  One-click signup for clubs and volunteer work
                </p>
              </motion.div>

              {/* Progress Tracking Card */}
              <motion.div 
                className="bg-white rounded-2xl p-10 shadow-lg hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="bg-[#E6F7F4] w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold text-[#0A2540] mb-3">Progress Tracking</h3>
                <p className="text-gray-600">
                  Automatically log your hours and experiences
                </p>
              </motion.div>

            </div>
          </div>
        </div>
      </div>

      {/* Why They Prefer Section */}
      <div className="max-w-[1400px] mx-auto px-8 pt-48">
        {/* Stats Section - Moved here */}
        <div id="stats-section" className="relative">
          {/* Decorative elements */}
          <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-[#2A8E9E]/10 to-transparent blur-3xl"></div>
          <div className="absolute top-1/3 right-0 translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-br from-[#38BFA1]/10 to-transparent blur-3xl"></div>
          
          <AnimatedHeadline />
          
          <SyncedCounters />
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-[#0A2540] mt-24 md:mt-48 py-16 md:py-24 text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <motion.h2 
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Maximize your experience with a
            <br className="hidden md:block" />
            platform that connects.
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
            <div>
              <div className="text-5xl md:text-8xl font-light text-[#38BFA1] mb-4 md:mb-8">1</div>
              <h3 className="text-xl md:text-2xl font-semibold mb-2 md:mb-4">Create your profile</h3>
              <p className="text-sm md:text-base text-gray-400">Set your interests, availability, and preferences</p>
            </div>
            <div>
              <div className="text-5xl md:text-8xl font-light text-[#38BFA1] mb-4 md:mb-8">2</div>
              <h3 className="text-xl md:text-2xl font-semibold mb-2 md:mb-4">Discover opportunities</h3>
              <p className="text-sm md:text-base text-gray-400">Browse and filter opportunities that match your profile</p>
            </div>
            <div>
              <div className="text-5xl md:text-8xl font-light text-[#38BFA1] mb-4 md:mb-8">3</div>
              <h3 className="text-xl md:text-2xl font-semibold mb-2 md:mb-4">Track your growth</h3>
              <p className="text-sm md:text-base text-gray-400">Build your portfolio as you participate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Why students choose section */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 pt-24 md:pt-48">
        <motion.h2 
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0A2540] mb-12 md:mb-24 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Why students choose shadowed.me
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
          <motion.div 
            className="bg-white rounded-[2rem] p-12 shadow-sm"
            whileHover={{ y: -8 }}
          >
            <div className="text-5xl font-bold text-[#2A8E9E] mb-4">500+</div>
            <h3 className="text-2xl font-semibold text-[#0A2540] mb-2">Active Students</h3>
            <p className="text-[#180D39]/80">discovering opportunities daily</p>
          </motion.div>

          <motion.div 
            className="bg-white rounded-[2rem] p-12 shadow-sm"
            whileHover={{ y: -8 }}
          >
            <h3 className="text-2xl font-semibold text-[#0A2540] mb-4">Quick Registration</h3>
            <p className="text-[#180D39]/80 mb-8">One-click signup for all opportunities</p>
            <div className="flex gap-4">
              <span className="text-3xl">📱</span>
              <span className="text-3xl">✨</span>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-[2rem] p-12 shadow-sm"
            whileHover={{ y: -8 }}
          >
            <h3 className="text-2xl font-semibold text-[#0A2540] mb-4">Smart Scheduling</h3>
            <p className="text-[#180D39]/80 mb-6">AI-powered conflict detection ensures you never double-book</p>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-[#2A8E9E]/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#2A8E9E]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                    />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#2A8E9E] text-white flex items-center justify-center text-xs">
                  ✓
                </div>
              </div>
              <div className="text-[#2A8E9E] font-medium">
                Conflict-free scheduling
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-[2rem] p-12 shadow-sm"
            whileHover={{ y: -8 }}
          >
            <h3 className="text-2xl font-semibold text-[#0A2540] mb-4">Growth Tracking</h3>
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[#2A8E9E]/10 flex items-center justify-center">
                  <div className="text-[#2A8E9E] font-bold text-xl">12</div>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#2A8E9E] text-white flex items-center justify-center text-sm">
                  +
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[#0A2540] font-semibold">Hours This Week</span>
                <span className="text-[#2A8E9E] text-sm">+3 from last week</span>
              </div>
            </div>
            <p className="text-[#180D39]/80">Track your hours and impact</p>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#102C4C] mt-24 md:mt-48">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-16 md:py-24">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <motion.h2 
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 md:mb-4 text-center md:text-left"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                Ready to start exploring?
              </motion.h2>
              <motion.p 
                className="text-lg md:text-xl text-white/70 text-center md:text-left"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                Join hundreds of students discovering opportunities.
              </motion.p>
            </div>
            <Link href="/school-clubs">
              <motion.button 
                className="w-full md:w-auto bg-[#2A8E9E] text-white px-6 md:px-10 py-3 md:py-5 text-lg md:text-xl rounded-xl md:rounded-2xl hover:bg-[#247A87] transition-all"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                Get Started →
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}