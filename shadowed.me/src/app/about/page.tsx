'use client';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

export default function About() {
  const [showModal, setShowModal] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Check when user scrolls to the bottom of the modal
  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 5) {
        setHasScrolledToBottom(true);
      }
    }
  };

  // Ensure modal appears on every visit (resets on refresh)
  useEffect(() => {
    setShowModal(true);
    setHasScrolledToBottom(false);
    
    // Reset scroll position
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div className="pt-[100px] min-h-screen bg-gradient-to-b from-[#FAFAFA] to-white">
      {/* Terms of Service Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          aria-modal="true"
          role="dialog"
          aria-labelledby="terms-modal-title"
        >
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h2 id="terms-modal-title" className="text-2xl font-bold text-[#180D39]">Terms of Service & Student Data Privacy Policy</h2>
              <p className="text-gray-500 text-sm mt-1">Effective Date: March 9th, 2025 | Last Updated: March 9th, 2025</p>
            </div>
            
            <div 
              ref={contentRef}
              onScroll={handleScroll}
              className="p-6 overflow-y-auto flex-grow text-[#180D39]/80 text-sm"
              tabIndex={0}
              aria-label="Terms of Service content, scroll to bottom to enable accept button"
            >
              <h3 className="font-bold text-lg mb-2">1. Introduction</h3>
              <p className="mb-4">
                Welcome to Shadowed.me (&quot;Platform,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We provide a platform that connects K-12 students with school clubs, events, activities, and opportunities. This Terms of Service & Student Data Privacy Policy (&quot;Agreement&quot;) outlines how we collect, use, and protect student data in compliance with the Student Online Personal Protection Act (SOPPA) and other applicable laws.
              </p>
              <p className="mb-6">
                By creating an account or using our services, students, parents, and school administrators agree to the terms outlined below. If you do not agree with these terms, please do not use our platform.
              </p>

              <h3 className="font-bold text-lg mb-2">2. Information We Collect</h3>
              <p className="mb-4">
                We collect and store the following personally identifiable information (PII) when students and school administrators voluntarily register on the platform:
              </p>
              <ul className="list-disc pl-6 mb-6">
                <li>Student Name</li>
                <li>Email Address</li>
                <li>Phone Number</li>
                <li>Grade Level</li>
              </ul>

              <h3 className="font-bold text-lg mb-2">3. How We Use Student Data</h3>
              <p className="mb-4">
                The data collected is used solely for educational purposes to facilitate connections between students and school-sponsored clubs, events, and activities. Specifically, we use the data to:
              </p>
              <ul className="list-disc pl-6 mb-6">
                <li>Allow students to register and manage their participation in school activities.</li>
                <li>Enable communication between students and school administrators.</li>
                <li>Improve platform functionality and user experience.</li>
              </ul>

              <h3 className="font-bold text-lg mb-2">4. Data Protection & Security Measures</h3>
              <p className="mb-4">
                We implement strict security controls to safeguard student data, including:
              </p>
              <ul className="list-disc pl-6 mb-6">
                <li>Access Restrictions: Only authorized personnel and school administrators can access student data.</li>
                <li>Secure Hosting: Data is stored using Firebase and Vercel, which provide industry-standard encryption and security.</li>
                <li>Data Minimization: We collect only the necessary information required for platform functionality.</li>
              </ul>

              <h3 className="font-bold text-lg mb-2">5. Data Sharing & Third-Party Services</h3>
              <p className="mb-6">
                We do not sell, rent, or share student data with third-party advertisers or unrelated entities. However, we use Firebase, Vercel, and Google Cloud for hosting and platform services. These third-party providers are required to comply with industry security standards to protect student data.
              </p>

              <h3 className="font-bold text-lg mb-2">6. Student & Parental Rights</h3>
              <p className="mb-4">
                Parents have the right to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Review & Delete Data: Users can delete their account at any time, which will remove all personal information from our system.</li>
                <li>Consent for Collection: Students must actively register on our platform before any data is collected.</li>
              </ul>
              <p className="mb-6">
                If you need to access, modify, or delete student data, please contact infoshadowed@gmail.com.
              </p>

              <h3 className="font-bold text-lg mb-2">7. Data Breach Notification</h3>
              <p className="mb-4">
                In the event of a data breach that compromises student information, we will:
              </p>
              <ul className="list-disc pl-6 mb-6">
                <li>Notify affected high school administrations within 30 days of the breach.</li>
                <li>Provide details about the nature of the breach, what data was affected, and the steps being taken to mitigate any risks.</li>
              </ul>

              <h3 className="font-bold text-lg mb-2">8. Compliance with SOPPA & Illinois Law</h3>
              <p className="mb-6">
                Since Shadowed.me operates exclusively in Illinois, we comply with SOPPA (105 ILCS 85), which requires that all student data collected is used strictly for educational purposes and is never sold or shared for commercial purposes.
              </p>

              <h3 className="font-bold text-lg mb-2">9. Contact Information</h3>
              <p className="mb-6">
                If you have any questions about this policy or how your data is handled, please contact us at:
                <br />Email: infoshadowed@gmail.com
                <br />Phone: +1 (630) 765-4125
              </p>

              <p className="font-medium">
                By continuing to use Shadowed.me, you agree to these terms and acknowledge that you have read and understood our Student Data Privacy Policy.
              </p>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                disabled={!hasScrolledToBottom}
                aria-disabled={!hasScrolledToBottom}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  hasScrolledToBottom 
                    ? 'bg-[#2A8E9E] text-white hover:bg-[#247A87]' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {hasScrolledToBottom ? 'I Accept' : 'Please scroll to the bottom to accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={() => setShowContactModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#180D39]">Contact Us</h2>
              <button 
                onClick={() => setShowContactModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Dean Section */}
              <div>
                <h3 className="text-xl font-semibold text-[#38BFA1] mb-2">Dean of Student Activities</h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[#180D39] font-medium">Jennifer Baumgartner</p>
                  <a 
                    href="mailto:jbaumgartner@naperville203.org"
                    className="text-[#2A8E9E] hover:text-[#38BFA1] transition-colors inline-flex items-center gap-2 mt-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    jbaumgartner@naperville203.org
                  </a>
                </div>
              </div>

              {/* Website Support Section */}
              <div>
                <h3 className="text-xl font-semibold text-[#38BFA1] mb-2">Website Support</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div>
                    <p className="text-[#180D39] font-medium">Arnav Sharma</p>
                    <a 
                      href="mailto:asharma1@stu.naperville203.org"
                      className="text-[#2A8E9E] hover:text-[#38BFA1] transition-colors inline-flex items-center gap-2 mt-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      asharma1@stu.naperville203.org
                    </a>
                  </div>
                  <div>
                    <p className="text-[#180D39] font-medium">Aiden Xie</p>
                    <a 
                      href="mailto:amxie@stu.naperville203.org"
                      className="text-[#2A8E9E] hover:text-[#38BFA1] transition-colors inline-flex items-center gap-2 mt-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      amxie@stu.naperville203.org
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <p className="text-sm text-gray-500 text-center">
                We typically respond within 24-48 hours during school days.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-16 py-12 md:py-20">
        <motion.div 
          className="text-center mb-16 md:mb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#38BFA1] to-[#2A8E9E] text-transparent bg-clip-text mb-6">
            About Shadowed.me
          </h1>
          
          <p className="text-xl md:text-2xl text-[#180D39]/70 max-w-3xl mx-auto leading-relaxed">
            Empowering students to discover their passions and create meaningful connections 
            within their school community.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <motion.div 
            className="bg-white rounded-2xl p-8 md:p-10 shadow-xl hover:shadow-2xl transition-all duration-300 border border-[#38BFA1]/10 group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gradient-to-br from-[#38BFA1]/10 to-[#2A8E9E]/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-2xl font-bold text-[#180D39] mb-4">Our Mission</h3>
            <p className="text-lg text-[#180D39]/70 leading-relaxed">
              To revolutionize how students connect with school activities by providing a modern platform 
              that makes discovering and joining clubs effortless and engaging.
            </p>
          </motion.div>

          <motion.div 
            className="bg-white rounded-2xl p-8 md:p-10 shadow-xl hover:shadow-2xl transition-all duration-300 border border-[#38BFA1]/10 group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="bg-gradient-to-br from-[#38BFA1]/10 to-[#2A8E9E]/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
              <span className="text-3xl">👁️</span>
            </div>
            <h3 className="text-2xl font-bold text-[#180D39] mb-4">Our Vision</h3>
            <p className="text-lg text-[#180D39]/70 leading-relaxed">
              Building a vibrant ecosystem where every student can explore their interests, develop leadership skills,
              and make lasting contributions to their school community.
            </p>
          </motion.div>
        </div>

        <motion.div 
          className="mb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#180D39] mb-12 text-center">How We Help</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-[#38BFA1]/10 group hover:-translate-y-1">
              <div className="text-[#38BFA1] font-semibold text-xl mb-4 group-hover:text-[#2A8E9E] transition-colors">Discover</div>
              <p className="text-[#180D39]/70 text-lg">Connect with clubs and activities that align perfectly with your interests and goals.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-[#38BFA1]/10 group hover:-translate-y-1">
              <div className="text-[#38BFA1] font-semibold text-xl mb-4 group-hover:text-[#2A8E9E] transition-colors">Engage</div>
              <p className="text-[#180D39]/70 text-lg">Participate in meaningful activities and create lasting connections within your school.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-[#38BFA1]/10 group hover:-translate-y-1">
              <div className="text-[#38BFA1] font-semibold text-xl mb-4 group-hover:text-[#2A8E9E] transition-colors">Grow</div>
              <p className="text-[#180D39]/70 text-lg">Develop leadership skills and make a positive impact in your community.</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-[#38BFA1] to-[#2A8E9E] rounded-3xl p-10 md:p-16 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-white/90 text-lg md:text-xl mb-10 leading-relaxed">
              Join our growing community of students and clubs. Whether you&apos;re looking to join a club
              or showcase your organization, we&apos;re here to help you succeed.
            </p>
            <button 
              onClick={() => setShowContactModal(true)}
              className="bg-white text-[#38BFA1] px-8 py-4 rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
            Contact Us →
          </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 