'use client';
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[95vh] overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#001440] to-[#002D80]"></div>
        
        <div className="container mx-auto px-6 sm:px-8 lg:px-16 relative z-10 pt-12 md:pt-24 lg:pt-32 pb-16 md:pb-24 lg:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-6 items-center">
            {/* Text content */}
            <div className="text-white">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight">
                <span className="text-white">Helping students</span>
                <div className="mt-3">
                  <span className="text-white">find their</span> <span className="relative">
                    <span className="text-[#FF9913]">light.</span>
                    <span className="absolute bottom-2 left-0 w-full h-1 bg-[#FF9913]"></span>
                  </span>
                </div>
              </h1>
              
              <p className="text-xl text-white mt-8 mb-10 max-w-xl">
                The one-stop shop for discovering clubs, events, experiences, and opportunities at Naperville North High School, helping eighth-graders and underclassmen get involved and interested.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/clubs">
                  <button className="px-6 py-3 bg-[#4A9DFF] text-white font-medium rounded-lg flex items-center justify-center hover:bg-[#2A7CD3] transition-all duration-300 hover:shadow-lg hover:shadow-[#4A9DFF]/30 transform hover:translate-y-[-2px]">
                    Find Clubs 
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </Link>
                
                <Link href="/about">
                  <button className="px-6 py-3 bg-white/10 border border-white text-white font-medium rounded-lg flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-white/20 transform hover:translate-y-[-2px]">
                    Learn More
                  </button>
                </Link>
              </div>
            </div>
            
            {/* Right side content */}
            <div className="hidden lg:block">
              <div className="relative w-full">
                {/* Main Feature Card */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#E5EEFF] hover:shadow-lg transition-all duration-500 transform hover:-translate-y-1 group">
                  <div className="bg-[#4A9DFF] px-6 py-4 flex items-center">
                    <div className="w-10 h-10 bg-white/20 text-white flex items-center justify-center rounded-lg mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-white text-lg font-semibold">
                      Upcoming Opportunities
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-[#4A9DFF] p-2 rounded-lg text-white flex flex-col items-center justify-center w-12 h-14 shadow-sm group-hover:scale-105 transition-transform duration-300">
                            <span className="text-xs font-medium">MAR</span>
                            <span className="text-xl font-bold">17</span>
                          </div>
                          <div>
                            <div className="text-[#001440] font-medium">Physics Club</div>
                            <div className="text-gray-500 text-xs mt-1">Naperville North High School</div>
                          </div>
                        </div>
                        <div className="text-gray-500 text-xs">Mar 15</div>
                      </div>
                      
                      <div className="flex items-center justify-between pb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-[#38BFA1] p-2 rounded-lg text-white flex flex-col items-center justify-center w-12 h-14 shadow-sm group-hover:scale-105 transition-transform duration-300">
                            <span className="text-xs font-medium">MAR</span>
                            <span className="text-xl font-bold">23</span>
                          </div>
                          <div>
                            <div className="text-[#001440] font-medium">HOSA Competition</div>
                            <div className="text-gray-500 text-xs mt-1">Naperville North High School</div>
                          </div>
                        </div>
                        <div className="text-gray-500 text-xs">Mar 18</div>
                      </div>
                    </div>
                    
                    <Link href="/clubs" className="text-[#4A9DFF] text-sm font-medium flex items-center mt-4 hover:underline group">
                      View all opportunities
                      <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                </div>
                
                {/* Stats Card */}
                <div className="absolute -top-6 -right-6 bg-[#FF9913] rounded-lg p-4 shadow-md rotate-3 hover:rotate-0 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 bg-white/20 text-white flex items-center justify-center rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="text-white text-sm font-medium">Active Students</div>
                  </div>
                  <div className="text-white text-2xl font-bold">500+</div>
                  <div className="text-white/90 text-xs font-medium">across 110 clubs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-10 hover:translate-y-8 transition-transform duration-1000 ease-in-out">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L48,106.7C96,117,192,139,288,154.7C384,171,480,181,576,165.3C672,149,768,107,864,101.3C960,96,1056,128,1152,138.7C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>
      
      {/* Mission Section */}
      <section className="py-12 bg-gradient-to-br from-[#F8FAFC] via-white to-[#F0F7FF] relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#4A9DFF]/5 rounded-full -translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#38BFA1]/5 rounded-full translate-x-1/4 translate-y-1/4"></div>
        
        <div className="container mx-auto px-6 sm:px-8 lg:px-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto"
          >
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center bg-[#4A9DFF]/10 px-4 py-2 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#4A9DFF] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-[#4A9DFF] font-medium">Our Mission</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-bold text-[#001440] mb-4">
                We help students
              </h2>
              
              <div className="w-full h-[60px] sm:h-[72px] relative mb-8 overflow-hidden">
                {[
                  { text: "Connect curiosity to action", color: "#FF9913", bg: "transparent" },
                  { text: "Explore interests & passions", color: "#E77D22", bg: "transparent" },
                  { text: "Serve their communities", color: "#CC5900", bg: "transparent" },
                  { text: "Lead with confidence", color: "#A64500", bg: "transparent" }
                ].map((item, index) => {
                  return (
                    <motion.div
                      key={index}
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: [0, 1, 1, 0],
                        y: [20, 0, 0, -20]
                      }}
                      transition={{
                        times: [0, 0.1, 0.9, 1],
                        duration: 4,
                        delay: index * 4,
                        repeat: Infinity,
                        repeatDelay: 12
                      }}
                      style={{ backgroundColor: item.bg }}
                    >
                      <span className="font-bold text-4xl sm:text-5xl" style={{ color: item.color }}>
                        {item.text.split(' ')[0]}
                      </span>
                      <span className="text-4xl sm:text-5xl text-[#001440] font-bold">
                        &nbsp;{item.text.split(' ').slice(1).join(' ')}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg text-gray-600 max-w-2xl mx-auto mb-6"
              >
                At shadowed.me, we&apos;re dedicated to helping students at Naperville North discover their passions, engage with their community, and develop leadership skills through meaningful club participation.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Link href="/about">
                  <button className="px-6 py-2 bg-white border border-[#4A9DFF] text-[#4A9DFF] font-medium rounded-lg flex items-center hover:bg-[#4A9DFF] hover:text-white transition-colors shadow-sm">
                    Learn about our mission
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Feature Boxes */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 sm:px-8 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#E9EFFD] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:border-[#4A9DFF]/50 group">
                <div className="flex flex-col h-full">
                  <div className="bg-[#E9EFFD] p-4 flex items-center">
                    <div className="w-12 h-12 bg-[#4A9DFF] text-white flex items-center justify-center rounded-lg shadow-sm transform group-hover:scale-110 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#001440] ml-4">Connect</h3>
                  </div>
                  <div className="p-6 flex-grow">
                    <p className="text-gray-600">
                      Connect with 110+ clubs at Naperville North and the events & opportunities they offer. Visit the &quot;Clubs&quot; page to read detailed descriptions and join communication lists.
                    </p>
                  </div>
                  <div className="px-6 pb-5">
                    <Link href="/clubs" className="text-[#4A9DFF] text-sm font-medium flex items-center hover:underline group">
                      Browse clubs
                      <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[#001440] mb-6">
                Discover Your Perfect Clubs
              </h2>
              <p className="text-xl text-[#000000] mb-6">
                We make it easy to find clubs that match your interests and schedule.
              </p>
              <Link href="/clubs">
                <motion.button 
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(74, 157, 255, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="px-6 py-3 bg-[#4A9DFF] text-white font-medium rounded-lg flex items-center shadow-sm"
                >
                  Browse All Clubs
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[#001440] mb-6">
                Find What Fits You
              </h2>
              <p className="text-xl text-[#000000] mb-6">
                Take our personalized quiz to get matched with clubs that align with your interests.
              </p>
              <Link href="/what-fits-you">
                <motion.button 
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(74, 157, 255, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="px-6 py-3 bg-[#4A9DFF] text-white font-medium rounded-lg flex items-center shadow-sm"
                >
                  Take the Quiz
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </motion.button>
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#E7F5FF] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:border-[#38BFA1]/50 hover:bg-gradient-to-br hover:from-white hover:to-[#E7F5FF] group">
                <div className="flex flex-col h-full">
                  <div className="bg-[#E7F5FF] p-4 flex items-center">
                    <div className="w-12 h-12 bg-[#38BFA1] text-white flex items-center justify-center rounded-lg shadow-sm transform group-hover:rotate-12 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#001440] ml-4">Explore</h3>
                  </div>
                  <div className="p-6 flex-grow">
                    <p className="text-gray-600">
                      Try out the 25-question quiz to discover clubs that fit your interests, goals, and schedule. Whether you&apos;re looking to compete, create, lead, or perform.
                    </p>
                  </div>
                  <div className="px-6 pb-5">
                    <Link href="/what-fits-you" className="text-[#38BFA1] text-sm font-medium flex items-center hover:underline group">
                      Take the quiz
                      <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#FFF1E6] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.01] hover:border-[#FF9913]/50 group">
                <div className="flex flex-col h-full">
                  <div className="bg-[#FFF1E6] p-4 flex items-center">
                    <div className="w-12 h-12 bg-[#FF9913] text-white flex items-center justify-center rounded-lg shadow-sm transform group-hover:scale-110 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#001440] ml-4">About</h3>
                  </div>
                  <div className="p-6 flex-grow">
                    <p className="text-gray-600">
                      Learn about our mission to connect students with clubs and opportunities at Naperville North. Discover how we help you find your perfect fit.
                    </p>
                  </div>
                  <div className="px-6 pb-5">
                    <Link href="/about" className="text-[#FF9913] text-sm font-medium flex items-center hover:underline group">
                      Learn more
                      <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[#001440] mb-6">
                Learn About Us
              </h2>
              <p className="text-xl text-[#000000] mb-6">
                Discover our mission and how we support NNHS students.
              </p>
              <Link href="/about">
                <motion.button 
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(74, 157, 255, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="px-6 py-3 bg-[#4A9DFF] text-white font-medium rounded-lg flex items-center shadow-sm"
                >
                  About Our Platform
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[#001440] mb-6">
                Manage Your Club
              </h2>
              <p className="text-xl text-[#000000] mb-6">
                Captains and sponsors can easily create a club site and display key info.
              </p>
              <Link href="/captain-dashboard">
                <motion.button 
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(74, 157, 255, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className="px-6 py-3 bg-[#4A9DFF] text-white font-medium rounded-lg flex items-center shadow-sm"
                >
                  Captain Dashboard
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </motion.button>
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#EBE7FF] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:rotate-[0.5deg] hover:border-[#7C3AED]/50 group">
                <div className="flex flex-col h-full">
                  <div className="bg-[#EBE7FF] p-4 flex items-center">
                    <div className="w-12 h-12 bg-[#7C3AED] text-white flex items-center justify-center rounded-lg shadow-sm transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#001440] ml-4">Lead</h3>
                  </div>
                  <div className="p-6 flex-grow">
                    <p className="text-gray-600">
                      Shadowed.me is here to serve as the first touchpoint for your club. Take a look at who&apos;s interested and manage your club site&apos;s information.
                    </p>
                  </div>
                  <div className="px-6 pb-5">
                    <Link href="/captain-dashboard" className="text-[#7C3AED] text-sm font-medium flex items-center hover:underline group">
                      Dashboard
                      <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#001440] via-[#0F2A80] to-[#1F49B3]">
        <div className="container mx-auto px-6 sm:px-8 lg:px-16 text-center relative">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-xl"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#4A9DFF]/10 rounded-full translate-x-1/3 translate-y-1/3 blur-xl"></div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6"
          >
            Driven to be interested and involved?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-white/80 mb-12 max-w-2xl mx-auto"
          >
            Join thousands of students discovering events and opportunities.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10"
          >
            <Link href="/clubs">
              <button className="px-10 py-4 bg-gradient-to-r from-[#4A9DFF] to-[#38BFA1] text-white text-base font-medium rounded-lg hover:from-[#38BFA1] hover:to-[#4A9DFF] transition-all duration-300 shadow-lg transform hover:scale-105 hover:shadow-xl hover:shadow-[#4A9DFF]/20">
                Get Started
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}