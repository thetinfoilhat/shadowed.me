'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function About() {
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* Hero Section */}
      <section className="relative pt-20 min-h-[70vh] overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#001440] to-[#002D80]"></div>
        
        <div className="container mx-auto px-6 sm:px-8 lg:px-16 relative z-10 pt-12 md:pt-24 lg:pt-20 pb-24 md:pb-32 lg:pb-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-6">
              About <span className="text-[#FF9913]">Shadowed.me</span>
            </h1>
            
            <p className="text-xl text-white mt-6 mb-10 max-w-3xl mx-auto leading-relaxed">
              Empowering students to discover their passions and create meaningful
              connections within their school community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/clubs">
                <button className="px-6 py-3 bg-[#4A9DFF] text-white font-medium rounded-lg flex items-center justify-center hover:bg-[#2A7CD3] transition-all duration-300 hover:shadow-lg hover:shadow-[#4A9DFF]/30 transform hover:translate-y-[-2px]">
                  Find Clubs 
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
              </Link>
              
              <button 
                onClick={() => setShowContactModal(true)}
                className="px-6 py-3 bg-white/10 border border-white text-white font-medium rounded-lg flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-white/20 transform hover:translate-y-[-2px]"
              >
                Contact Us
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L48,106.7C96,117,192,139,288,154.7C384,171,480,181,576,165.3C672,149,768,107,864,101.3C960,96,1056,128,1152,138.7C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>
      
      {/* Our Team Section */}
      <section className="py-20 bg-white relative z-10">
        <div className="container mx-auto px-6 sm:px-8 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-[#001440] mb-6">
              Our Team
            </h2>
            <p className="text-lg text-[#000000] max-w-3xl mx-auto">
              Meet the students behind Shadowed.me
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { name: "Arnav Sharma", role: "Co-founder" },
              { name: "Aiden Xie", role: "Co-founder" },
              { name: "Allen Xu", role: "Co-founder" },
              { name: "Rohan Rao", role: "Co-founder" }
            ].map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gradient-to-br from-white to-[#F8FAFC] rounded-xl p-6 border border-[#E9EFFD] shadow-sm hover:shadow-lg transition-all duration-300 hover:border-[#4A9DFF]/30 group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#4A9DFF]/10 to-[#38BFA1]/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                    <span className="text-3xl font-bold text-[#001440]">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#001440] mb-1 group-hover:text-[#4A9DFF] transition-colors duration-300">
                    {member.name}
                  </h3>
                  <p className="text-[#000000]">{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Our Mission Section */}
      <section className="py-28 bg-gradient-to-br from-[#F8FAFC] via-white to-[#F0F7FF] relative overflow-hidden">
        <div className="container mx-auto px-6 sm:px-8 lg:px-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-[#001440] mb-10">
              Our Mission
            </h2>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white p-8 rounded-2xl shadow-xl border border-[#E9EFFD] hover:shadow-2xl transition-all duration-500"
            >
              <p className="text-xl text-[#000000] leading-relaxed">
                To transform how students discover and engage with school activities by providing an accessible, student-centered platform. We make it easy and enjoyable to find clubs, events, and opportunities, helping students feel connected, inspired, and empowered to participate actively in their school community.
              </p>
            </motion.div>
          </motion.div>
          
          <div className="flex justify-center mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="w-24 h-1 bg-gradient-to-r from-[#4A9DFF] to-[#38BFA1] rounded-full"
            ></motion.div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-40 -right-24 w-64 h-64 bg-[#4A9DFF]/5 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 -left-32 w-80 h-80 bg-[#38BFA1]/5 rounded-full filter blur-3xl"></div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 sm:px-8 lg:px-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-[#001440] via-[#0F2A80] to-[#1F49B3] rounded-3xl overflow-hidden shadow-xl"
          >
            <div className="relative py-16 px-6 md:px-12 lg:px-24">
              <div className="relative z-10 max-w-3xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                  Ready to get involved?
                </h2>
                
                <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
                  Join thousands of students discovering events and opportunities.
                </p>
                
                <button 
                  onClick={() => setShowContactModal(true)}
                  className="px-10 py-4 bg-gradient-to-r from-[#4A9DFF] to-[#38BFA1] text-white text-base font-medium rounded-lg hover:from-[#38BFA1] hover:to-[#4A9DFF] transition-all duration-300 shadow-lg transform hover:scale-105 hover:shadow-xl hover:shadow-[#4A9DFF]/20"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Contact Modal */}
      {showContactModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={() => setShowContactModal(false)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-2xl max-w-2xl w-full mx-4 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#4A9DFF] to-[#38BFA1] p-6 text-white flex justify-between items-center">
              <h2 className="text-2xl font-bold">Contact Us</h2>
              <button 
                onClick={() => setShowContactModal(false)}
                className="text-white hover:text-white/80 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-[#4A9DFF] mb-2">Dean of Student Activities</h3>
                <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                  <p className="text-[#180D39] font-medium">Jennifer Baumgartner</p>
                  <a 
                    href="mailto:jbaumgartner@naperville203.org"
                    className="text-[#4A9DFF] hover:text-[#38BFA1] transition-colors"
                  >
                    jbaumgartner@naperville203.org
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#38BFA1] mb-2">Website Support</h3>
                <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300">
                  <p className="text-[#180D39] font-medium">Arnav Sharma</p>
                  <a 
                    href="mailto:asharma1@stu.naperville203.org"
                    className="text-[#38BFA1] hover:text-[#4A9DFF] transition-colors block mb-4"
                  >
                    asharma1@stu.naperville203.org
                  </a>
                  <p className="text-[#180D39] font-medium">Aiden Xie</p>
                  <a 
                    href="mailto:amxie@stu.naperville203.org"
                    className="text-[#38BFA1] hover:text-[#4A9DFF] transition-colors"
                  >
                    amxie@stu.naperville203.org
                  </a>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-[#F0F7FF] text-center text-sm text-[#001440]">
              We typically respond within 24-48 hours during school days.
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 