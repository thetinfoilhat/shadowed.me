'use client';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="pt-[80px] min-h-screen bg-[#FAFAFA]">
      {/* Hero Section */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-16 pt-12 pb-48 md:pb-64">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-24">
          {/* Left Column */}
          <div>
            <motion.h1 
              className="text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] leading-[1.15] mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-[#180D39]">
                Helping<br />
                students<br />
                <span className="font-bold">find their<br />light.</span>
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-[#180D39]/70 mb-12 max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              Supporting students with simple searching, instant club 
              <span className="relative inline-block group">
                registration, and easy outreach tracking.
                <span 
                  className="absolute bottom-0 left-0 w-full h-[2px] origin-left transform scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
                  style={{
                    background: 'linear-gradient(90deg, #38BFA1 0%, rgba(56, 191, 161, 0.4) 100%)'
                  }}
                />
              </span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <button className="bg-[#2A8E9E] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-medium hover:bg-[#247A87] transition-colors">
                Get Started →
              </button>
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
            <div className="absolute w-full">
              {/* Vertical Cards Container */}
              <div className="relative h-full">
                {/* First Card */}
                <motion.div 
                  className="absolute right-0 bg-white rounded-3xl p-8 w-[450px] shadow-[0_20px_50px_rgba(8,112,184,0.07)] hover:shadow-[0_24px_60px_rgba(8,112,184,0.1)]"
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  style={{ 
                    background: 'linear-gradient(to bottom, white, rgba(255,255,255,0.9))',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-2xl font-bold tracking-tight text-[#0A2540]">Neuqua Valley High School</h4>
                    <span className="text-[#38BFA1] bg-[#E6F7F4] px-4 py-2 rounded-full text-sm font-medium">Mar 15</span>
                  </div>
                  <h3 className="text-[#38BFA1] text-xl font-semibold tracking-wide mb-4">Physics Club Visit</h3>
                  <p className="text-gray-600 leading-relaxed mb-6 font-light text-lg">
                    Join us for an interactive session exploring practical physics applications. 
                    Perfect for students interested in STEM fields.
                  </p>
                  <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <span className="text-[#38BFA1]">⏱</span>
                        <span className="text-sm font-medium text-gray-600">45 min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#38BFA1]">👥</span>
                        <span className="text-sm font-medium text-gray-600">15 spots</span>
                      </div>
                    </div>
                    <button className="text-[#38BFA1] font-semibold text-sm tracking-wide hover:underline">
                      Learn more →
                    </button>
                  </div>
                </motion.div>

                {/* Second Card */}
                <motion.div 
                  className="absolute right-12 top-[180px] bg-white rounded-3xl p-8 w-[450px] shadow-[0_20px_50px_rgba(8,112,184,0.07)] hover:shadow-[0_24px_60px_rgba(8,112,184,0.1)]"
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  style={{ 
                    background: 'linear-gradient(to bottom, white, rgba(255,255,255,0.9))',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-2xl font-semibold text-[#0A2540]">Loaves & Fishes</h4>
                    <span className="text-[#38BFA1] bg-[#E6F7F4] px-4 py-2 rounded-full text-sm font-medium">Mar 18</span>
                  </div>
                  <h3 className="text-[#38BFA1] text-lg font-medium mb-4">Food Bank Volunteering</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Help sort and distribute food to local families in need. 
                    Great opportunity to make a direct impact in your community.
                  </p>
                  <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <span className="text-[#38BFA1]">⏱</span>
                        <span className="text-sm text-gray-600">2 hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#38BFA1]">👥</span>
                        <span className="text-sm text-gray-600">8 spots</span>
                      </div>
                    </div>
                    <button className="text-[#38BFA1] font-medium text-sm hover:underline">
                      Learn more →
                    </button>
                  </div>
                </motion.div>

                {/* Third Card */}
                <motion.div 
                  className="absolute right-24 top-[360px] bg-white rounded-3xl p-8 w-[450px] shadow-[0_20px_50px_rgba(8,112,184,0.07)] hover:shadow-[0_24px_60px_rgba(8,112,184,0.1)]"
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  style={{ 
                    background: 'linear-gradient(to bottom, white, rgba(255,255,255,0.9))',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-2xl font-semibold text-[#0A2540]">NCHS Robotics Team</h4>
                    <span className="text-[#38BFA1] bg-[#E6F7F4] px-4 py-2 rounded-full text-sm font-medium">Mar 20</span>
                  </div>
                  <h3 className="text-[#38BFA1] text-lg font-medium mb-4">Competition Prep</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Join the robotics team as they prepare for upcoming competitions. 
                    Learn about robotics, programming, and teamwork.
                  </p>
                  <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <span className="text-[#38BFA1]">⏱</span>
                        <span className="text-sm text-gray-600">3 hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#38BFA1]">👥</span>
                        <span className="text-sm text-gray-600">5 spots</span>
                      </div>
                    </div>
                    <button className="text-[#38BFA1] font-medium text-sm hover:underline">
                      Learn more →
                    </button>
                  </div>
                </motion.div>

                {/* Background Decorative Elements */}
                <div className="absolute -z-10 top-[20%] right-[25%] w-[500px] h-[500px] bg-[#E6F7F4] rounded-full opacity-20 blur-[100px]"></div>
                <div className="absolute -z-10 top-[50%] right-[45%] w-[400px] h-[400px] bg-[#38BFA1] rounded-full opacity-10 blur-[100px]"></div>
              </div>
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
