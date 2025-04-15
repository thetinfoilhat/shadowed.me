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
            
            <p className="text-xl text-white/90 mt-6 mb-10 max-w-3xl mx-auto leading-relaxed">
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
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
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
                  <p className="text-gray-600">{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Mission & Vision Section */}
      <section className="py-20 bg-gradient-to-br from-[#F8FAFC] via-white to-[#F0F7FF] relative overflow-hidden">
        <div className="container mx-auto px-6 sm:px-8 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[#001440] mb-6">
                Our Mission
              </h2>
              
              <p className="text-lg text-[#000000] mb-6 leading-relaxed">
                To revolutionize how students connect with school activities by providing 
                a modern platform that makes discovering and joining clubs effortless.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[#001440] mb-6">
                Our Vision
              </h2>
              
              <p className="text-lg text-[#000000] mb-6 leading-relaxed">
                Building a vibrant ecosystem where every student can explore their interests, 
                develop leadership skills, and contribute to their school community.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* How We Help Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 sm:px-8 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-[#001440] mb-6">
              How We Help
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-[#E9EFFD] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:border-[#4A9DFF]/50 group p-6"
            >
              <h3 className="text-xl font-bold text-[#001440] mb-3">Connect</h3>
              <p className="text-gray-600">
                Find clubs and activities that align with your interests and schedule.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-[#E7F5FF] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:border-[#38BFA1]/50 group p-6"
            >
              <h3 className="text-xl font-bold text-[#001440] mb-3">Explore</h3>
              <p className="text-gray-600">
                Discover new opportunities and activities through our matching quiz.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-[#EBE7FF] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:border-[#7C3AED]/50 group p-6"
            >
              <h3 className="text-xl font-bold text-[#001440] mb-3">Lead</h3>
              <p className="text-gray-600">
                Club captains and sponsors can create sites and connect with interested students.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 sm:px-8 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-[#001440] mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Everything you need to know about Shadowed.me
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {[
              {
                question: "Can I show interest in a club even if I missed the Jamboree?",
                answer: "Yes! Just head to the &quot;Clubs&quot; page and click the &quot;I'm Interested!&quot; button. Captains and sponsors will be able to see who's interested and use it to share information about the club throughout the school year."
              },
              {
                question: "What is the 25-question quiz and how does it work?",
                answer: "Our 25-question quiz helps students—and their parents—better understand their interests and discover clubs that align with them. Students are matched based on attributes, and no personal information is collected."
              },
              {
                question: "What does it mean to &quot;shadow&quot; an event?",
                answer: "Clubs post meetings, events, and volunteer opportunities that students can attend—like 8th graders joining a freshman intro session or current students visiting a competition. It's completely free and requires no commitment."
              },
              {
                question: "How do I track my volunteer hours and event attendance?",
                answer: "In the 2025-2026 school year, the student dashboard automatically logs hours and events for any club you attend through the platform. Additionally, club captains and sponsors will be able to verify your participation!"
              },
              {
                question: "Where can I find updates from club captains and sponsors?",
                answer: "All updates—like meeting reminders, announcements, and important dates—will appear on your dashboard if you're marked as &quot;Interested&quot; in a club."
              },
              {
                question: "Can I be in more than one club at the same time?",
                answer: "Absolutely! Most students are involved in multiple clubs, and this platform is designed to help you explore as many as you'd like."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-[#F8FAFC] rounded-xl p-6 border border-[#E9EFFD] shadow-sm hover:shadow-md transition-all duration-300 hover:border-[#4A9DFF]/30"
              >
                <h3 className="text-xl font-bold text-[#001440] mb-3">{faq.question}</h3>
                <p className="text-gray-600" dangerouslySetInnerHTML={{ __html: faq.answer }}></p>
              </motion.div>
            ))}
          </div>
        </div>
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
                
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
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