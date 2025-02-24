'use client';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        return; // Stay on home page if not logged in
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (userData?.role === 'captain') {
          router.push('/captain-dashboard');
        } else {
          router.push('/my-visits'); // Regular user view
        }
      } catch (err) {
        console.error('Error checking user role:', err);
      }
    };

    checkUserRole();
  }, [user, router]);

  return (
    <div className="pt-[80px] min-h-screen bg-[#FAFAFA]">
      {/* Hero Section */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-16 pt-12 pb-48 md:pb-64">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-24">
          {/* Left Column */}
          <div>
            <motion.h1 
              className="text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] leading-[1.15] mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-[#180D39]">
                Helping<br />
                students<br />
                <span className="font-bold relative">
                  find their<br />
                  <span className="relative">
                    light.
                    <span className="absolute bottom-2 left-0 w-full h-1 bg-gradient-to-r from-[#2A8E9E] to-[#2A8E9E]/30" />
                  </span>
                </span>
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-[#180D39]/70 mb-12 max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              Supporting students with simple searching, instant club registration, and easy outreach tracking.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center gap-6"
            >
              <button className="bg-[#2A8E9E] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-medium hover:bg-[#247A87] transition-all hover:shadow-lg hover:shadow-[#2A8E9E]/20">
                Get Started →
              </button>
              <span className="text-[#180D39]/40 text-sm">Join 500+ students</span>
            </motion.div>

            <motion.div 
              className="mt-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="flex gap-12">
                <img src="/neuqua.png" alt="Neuqua" className="h-6 grayscale opacity-50" />
                <img src="/naperville-central.png" alt="NCHS" className="h-6 grayscale opacity-50" />
                <img src="/naperville-north.png" alt="NNHS" className="h-6 grayscale opacity-50" />
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="relative mt-8 lg:mt-0">
            <div className="space-y-6">
              {/* First Card */}
              <motion.div 
                className="bg-gradient-to-br from-white to-[#2A8E9E]/5 rounded-2xl p-6 shadow-lg relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transform: ["translateY(0px)", "translateY(-10px)", "translateY(0px)"]
                }}
                transition={{
                  duration: 0.5,
                  transform: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#2A8E9E]/5 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#2A8E9E]/10 rounded-full blur-xl" />
                
                <div className="relative"> {/* Content wrapper to stay above blurred elements */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-[#180D39] font-semibold text-lg mb-1">Neuqua Valley High School</h3>
                      <div className="inline-block bg-white/50 backdrop-blur-sm text-[#2A8E9E] text-sm font-medium px-3 py-1 rounded-full mb-3">
                        Mar 15
                      </div>
                      <h4 className="text-[#2A8E9E] font-medium mb-2">Physics Club Visit</h4>
                      <p className="text-[#180D39]/70 text-sm">
                        Join us for an interactive session exploring practical physics applications.
                      </p>
                    </div>
                    <button className="text-[#2A8E9E]">
                      →
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#2A8E9E]/10">
                    <div className="flex items-center gap-2 text-sm text-[#180D39]/60">
                      <span>🕒</span> 3 hours
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#180D39]/60">
                      <span>👥</span> 5 spots
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Second Card - with different animation phase */}
              <motion.div 
                className="bg-gradient-to-bl from-white to-[#2A8E9E]/5 rounded-2xl p-6 shadow-lg relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transform: ["translateY(-10px)", "translateY(0px)", "translateY(-10px)"]
                }}
                transition={{
                  duration: 0.5,
                  transform: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                {/* Similar structure with different gradient direction and animation phase */}
              </motion.div>

              {/* Third Card - with another animation phase */}
              <motion.div 
                className="bg-gradient-to-tr from-white to-[#2A8E9E]/5 rounded-2xl p-6 shadow-lg relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transform: ["translateY(0px)", "translateY(-10px)", "translateY(0px)"]
                }}
                transition={{
                  duration: 0.5,
                  transform: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5 // Slight delay for more organic feel
                  }
                }}
              >
                {/* Similar structure with different gradient direction and animation phase */}
              </motion.div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -z-10 top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
              <div className="w-96 h-96 rounded-full bg-gradient-to-br from-[#2A8E9E]/10 to-transparent blur-3xl" />
            </div>
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
                <div className="bg-[#E6F7F4] w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="text-xl font-semibold text-[#0A2540] mb-3">Quick Registration</h3>
                <p className="text-gray-600">
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
        <motion.h2 
          className="text-4xl font-bold text-[#0A2540] mb-24 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Why students choose shadowed.me
        </motion.h2>

        <div className="grid grid-cols-2 gap-8">
          <motion.div 
            className="bg-white rounded-[2rem] p-12 shadow-sm"
            whileHover={{ y: -8 }}
          >
            <div className="text-5xl font-bold text-[#38BFA1] mb-4">3k+</div>
            <h3 className="text-2xl font-semibold mb-2">Students already using</h3>
            <p className="text-gray-600">our platform to find opportunities</p>
          </motion.div>

          <motion.div 
            className="bg-white rounded-[2rem] p-12 shadow-sm"
            whileHover={{ y: -8 }}
          >
            <h3 className="text-2xl font-semibold mb-4">Instant Registration</h3>
            <p className="text-gray-600 mb-8">Sign up for opportunities with one click</p>
            <div className="flex gap-4">
              <span className="text-3xl">📱</span>
              <span className="text-3xl">✨</span>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-[2rem] p-12 shadow-sm"
            whileHover={{ y: -8 }}
          >
            <h3 className="text-2xl font-semibold mb-4">No Schedule Conflicts</h3>
            <p className="text-gray-600">Smart filtering ensures opportunities match your availability</p>
          </motion.div>

          <motion.div 
            className="bg-white rounded-[2rem] p-12 shadow-sm"
            whileHover={{ y: -8 }}
          >
            <div className="h-32 bg-[#F7FAFC] rounded-xl mb-4"></div>
            <p className="text-gray-600">Track your volunteer hours over time</p>
          </motion.div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-[#0A2540] mt-48 py-24 text-white">
        <div className="max-w-[1400px] mx-auto px-8">
          <motion.h2 
            className="text-4xl font-bold mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Maximize your experience with a
            <br />
            platform that connects.
          </motion.h2>

          <div className="grid grid-cols-3 gap-16">
            <div>
              <div className="text-8xl font-light text-[#38BFA1] mb-8">1</div>
              <h3 className="text-2xl font-semibold mb-4">Create your profile</h3>
              <p className="text-gray-400">Set your interests, availability, and preferences</p>
            </div>
            <div>
              <div className="text-8xl font-light text-[#38BFA1] mb-8">2</div>
              <h3 className="text-2xl font-semibold mb-4">Discover opportunities</h3>
              <p className="text-gray-400">Browse and filter opportunities that match your profile</p>
            </div>
            <div>
              <div className="text-8xl font-light text-[#38BFA1] mb-8">3</div>
              <h3 className="text-2xl font-semibold mb-4">Track your growth</h3>
              <p className="text-gray-400">Build your portfolio as you participate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-[1400px] mx-auto px-8 pt-48">
        <motion.h2 
          className="text-4xl font-bold text-center text-[#0A2540] mb-32"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          We&apos;ve helped students discover opportunities
        </motion.h2>
        
        <div className="flex justify-center gap-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="text-7xl font-bold text-[#38BFA1] mb-4">500+</div>
            <div className="text-xl text-gray-600">Active Students</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="text-7xl font-bold text-[#38BFA1] mb-4">50+</div>
            <div className="text-xl text-gray-600">School Clubs</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="text-7xl font-bold text-[#38BFA1] mb-4">1k+</div>
            <div className="text-xl text-gray-600">Hours Logged</div>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#0A2540] mt-48">
        <div className="max-w-[1400px] mx-auto px-8 py-24">
          <div className="flex justify-between items-center">
            <div>
              <motion.h2 
                className="text-4xl font-bold text-white mb-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                Ready to start exploring?
              </motion.h2>
              <motion.p 
                className="text-xl text-gray-400"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                Join hundreds of students discovering opportunities.
              </motion.p>
            </div>
            <motion.button 
              className="bg-[#38BFA1] text-white px-10 py-5 text-xl rounded-2xl hover:bg-[#2DA891] transition-all"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              Get Started →
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
