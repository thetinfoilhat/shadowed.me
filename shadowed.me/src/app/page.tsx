'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#001440] to-[#002D80]"></div>
        
        <div className="container mx-auto px-6 sm:px-8 lg:px-16 relative z-10 pt-12 md:pt-24 lg:pt-32">
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
                  <button className="px-8 py-4 bg-[#FF9913] text-white font-medium rounded-full flex items-center justify-center hover:bg-[#e68a10] transition-colors shadow-lg">
                    Find Clubs 
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                  </button>
                </Link>
                
                <Link href="/about">
                  <button className="px-8 py-4 bg-transparent border-2 border-white text-white font-medium rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                    Learn More
                  </button>
                </Link>
              </div>
            </div>
            
            {/* Right side content */}
            <div className="hidden lg:block">
              <div className="relative w-full">
                {/* Main Feature Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
                  <div className="px-8 py-6 border-b border-white/20">
                    <h3 className="text-white text-xl font-semibold">
                      Upcoming Opportunities
                    </h3>
                  </div>
                  
                  <div className="px-8 py-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/20 pb-3">
                        <div className="flex items-center gap-4">
                          <div className="bg-[#4A9DFF] p-2 rounded-lg text-white flex flex-col items-center justify-center w-12 h-14 shadow-md">
                            <span className="text-xs">MAR</span>
                            <span className="text-xl font-bold">17</span>
                          </div>
                          <div>
                            <div className="text-white font-medium">Physics Club</div>
                            <div className="text-white/80 text-sm mt-1">Naperville North High School</div>
                          </div>
                        </div>
                        <div className="text-white/80 text-sm">Mar 15</div>
                      </div>
                      
                      <div className="flex items-center justify-between pb-3">
                        <div className="flex items-center gap-4">
                          <div className="bg-[#4A9DFF] p-2 rounded-lg text-white flex flex-col items-center justify-center w-12 h-14 shadow-md">
                            <span className="text-xs">MAR</span>
                            <span className="text-xl font-bold">23</span>
                          </div>
                          <div>
                            <div className="text-white font-medium">HOSA Competition</div>
                            <div className="text-white/80 text-sm mt-1">Naperville North High School</div>
                          </div>
                        </div>
                        <div className="text-white/80 text-sm">Mar 18</div>
                      </div>
                    </div>
                    
                    <Link href="/events" className="text-[#4A9DFF] text-sm font-medium flex items-center mt-4 hover:underline">
                      View all opportunities
                      <ArrowRightIcon className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
                
                {/* Stats Card */}
                <div className="absolute -top-6 -right-6 bg-[#4A9DFF] rounded-2xl p-4 shadow-xl transform rotate-6">
                  <div className="text-white text-sm font-medium">Active Students</div>
                  <div className="text-white text-2xl font-bold mt-1">500+</div>
                  <div className="text-white/90 text-xs mt-1">across 110 clubs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L48,106.7C96,117,192,139,288,154.7C384,171,480,181,576,165.3C672,149,768,107,864,101.3C960,96,1056,128,1152,138.7C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>
      
      {/* Mission Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6 sm:px-8 lg:px-16">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap justify-center items-center"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#001440] inline-flex items-center justify-center w-full">
                <span>We help students</span>&nbsp;
                
                {/* Inline Text Carousel */}
                <span className="relative inline-block h-[60px] sm:h-[72px] overflow-hidden align-bottom" style={{ minWidth: '650px', maxWidth: '800px', transform: 'translateY(13px)' }}>
                  {[
                    { text: "Connect curiosity to action", color: "#4A9DFF" },
                    { text: "Explore interests & passions", color: "#4A9DFF" },
                    { text: "Serve their communities", color: "#4A9DFF" },
                    { text: "Lead with confidence", color: "#4A9DFF" }
                  ].map((item, index) => {
                    const words = item.text.split(' ');
                    const firstWord = words[0];
                    const restWords = words.slice(1).join(' ');
                    
                    return (
                      <motion.span
                        key={index}
                        className="absolute left-0 whitespace-nowrap w-full"
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
                      >
                        <span className="font-bold" style={{ color: item.color }}>{firstWord}</span>
                        <span className="text-[#001440]"> {restWords}</span>
                      </motion.span>
                    );
                  })}
                </span>
              </h2>
              <div className="w-full mt-3">
                <span className="inline-block h-1 bg-[#4A9DFF] w-[650px] sm:w-[750px] md:w-[900px]"></span>
              </div>
            </motion.div>
          </div>
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
              <div className="p-2 bg-white shadow-xl rounded-3xl">
                <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-[#4A9DFF] to-[#2A7CD3] p-1">
                  <div className="bg-white rounded-xl p-8">
                    <div className="w-16 h-16 bg-[#4A9DFF]/10 text-[#4A9DFF] flex items-center justify-center rounded-xl text-2xl mb-6">
                      🔍
                    </div>
                    <h3 className="text-2xl font-bold text-[#001440] mb-4">Connect</h3>
                    <p className="text-[#000000]">
                      Connect with 110+ clubs at Naperville North and the events & opportunities they offer. Visit the &quot;Clubs&quot; page to read detailed descriptions and join communication lists linked to club sponsors, and check the &quot;Club Visits&quot; page during the school year to find meetings you can &quot;shadow&quot;.
                    </p>
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
                  whileHover={{ scale: 1.05 }}
                  className="px-6 py-3 bg-[#4A9DFF] text-white font-medium rounded-full flex items-center shadow-md"
                >
                  Browse All Clubs
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
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
                  whileHover={{ scale: 1.05 }}
                  className="px-6 py-3 bg-[#4A9DFF] text-white font-medium rounded-full flex items-center shadow-md"
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
              <div className="p-2 bg-white shadow-xl rounded-3xl">
                <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-[#4A9DFF] to-[#2A7CD3] p-1">
                  <div className="bg-white rounded-xl p-8">
                    <div className="w-16 h-16 bg-[#4A9DFF]/10 text-[#4A9DFF] flex items-center justify-center rounded-xl text-2xl mb-6">
                      🧭
                    </div>
                    <h3 className="text-2xl font-bold text-[#001440] mb-4">Explore</h3>
                    <p className="text-[#000000]">
                      Try out the 25-question quiz to discover the clubs that fit your interests, goals, and schedule. Whether you&apos;re looking to compete, create, lead, perform, or just try something new, it only takes a few minutes and might introduce you to a club you never expected to love!
                    </p>
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
              <div className="p-2 bg-white shadow-xl rounded-3xl">
                <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-[#4A9DFF] to-[#2A7CD3] p-1">
                  <div className="bg-white rounded-xl p-8">
                    <div className="w-16 h-16 bg-[#4A9DFF]/10 text-[#4A9DFF] flex items-center justify-center rounded-xl text-2xl mb-6">
                      🤝
                    </div>
                    <h3 className="text-2xl font-bold text-[#001440] mb-4">Serve</h3>
                    <p className="text-[#000000]">
                      Keep track of the events you have attended and the hours you volunteer. Shadowed.me helps you stay on top of everything you&apos;ve done—no spreadsheets needed. Great for resumes, service goals, or just looking back on the impact you&apos;ve made in the community.
                    </p>
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
                Track Your Impact
              </h2>
              <p className="text-xl text-[#000000] mb-6">
                Record your participation and volunteer hours all in one place.
              </p>
              <Link href="/my-visits">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  className="px-6 py-3 bg-[#4A9DFF] text-white font-medium rounded-full flex items-center shadow-md"
                >
                  View My Records
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
                Captains and sponsors can easily organize their club activities.
              </p>
              <Link href="/captain-dashboard">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  className="px-6 py-3 bg-[#4A9DFF] text-white font-medium rounded-full flex items-center shadow-md"
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
              <div className="p-2 bg-white shadow-xl rounded-3xl">
                <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-[#4A9DFF] to-[#2A7CD3] p-1">
                  <div className="bg-white rounded-xl p-8">
                    <div className="w-16 h-16 bg-[#4A9DFF]/10 text-[#4A9DFF] flex items-center justify-center rounded-xl text-2xl mb-6">
                      ⭐
                    </div>
                    <h3 className="text-2xl font-bold text-[#001440] mb-4">Lead</h3>
                    <p className="text-[#000000]">
                      Captains and club sponsors will use shadowed.me as their all-in-one platform to post everything students need to know—meeting times, room numbers, upcoming competitions, volunteer opportunities, and anything in between. It&apos;s easier than ever to keep your club organized and driven!
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-[#002D80] to-[#001440]">
        <div className="container mx-auto px-6 sm:px-8 lg:px-16 text-center">
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
            className="text-xl text-white mb-10 max-w-2xl mx-auto"
          >
            Join thousands of students discovering events and opportunities.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/clubs">
              <button className="px-10 py-5 bg-[#4A9DFF] text-white text-lg font-medium rounded-full hover:bg-[#2A7CD3] transition-colors shadow-lg">
                Get Started
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}