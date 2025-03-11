'use client';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

export default function About() {
  const [showModal, setShowModal] = useState(true);
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
    <div className="pt-[100px] min-h-screen bg-[#FAFAFA]">
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

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-16 py-24">
        <motion.h1 
          className="text-[2.5rem] sm:text-[3.5rem] md:text-[4.5rem] leading-[1.15] mb-8 text-[#180D39]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          About <span className="font-bold">Shadowed.me</span>
        </motion.h1>
        
        <motion.p 
          className="text-lg md:text-xl text-[#180D39]/70 mb-16 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          We&apos;re on a mission to help students discover their passions and connect with meaningful opportunities 
          in their local community.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <motion.div 
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-[#180D39]/5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-[#2A8E9E]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold text-[#180D39] mb-3">Our Mission</h3>
            <p className="text-[#180D39]/70">
              To empower students by connecting them with enriching opportunities that foster personal growth 
              and community engagement.
            </p>
          </motion.div>

          <motion.div 
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-[#180D39]/5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="bg-[#2A8E9E]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">👁️</span>
            </div>
            <h3 className="text-xl font-semibold text-[#180D39] mb-3">Our Vision</h3>
            <p className="text-[#180D39]/70">
              Creating a vibrant community where every student can explore their interests and make 
              meaningful contributions.
            </p>
          </motion.div>
        </div>

        <motion.div 
          className="mb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-[#180D39] mb-8">How We Help</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#180D39]/5">
              <div className="text-[#2A8E9E] mb-4">Connect</div>
              <p className="text-[#180D39]/70">Connect students with school clubs that match their interests</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#180D39]/5">
              <div className="text-[#2A8E9E] mb-4">Facilitate</div>
              <p className="text-[#180D39]/70">Facilitate meaningful volunteer opportunities in the community</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#180D39]/5">
              <div className="text-[#2A8E9E] mb-4">Build</div>
              <p className="text-[#180D39]/70">Build bridges between students and local organizations</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-[#180D39] to-[#1D1145] rounded-2xl p-12 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-4">Get In Touch</h2>
          <p className="text-white/70 mb-8 max-w-xl">
            Have questions or want to learn more about how we can help? We&apos;d love to hear from you.
          </p>
          <button className="bg-[#2A8E9E] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-medium hover:bg-[#247A87] transition-colors">
            Contact Us →
          </button>
        </motion.div>
      </div>
    </div>
  );
} 