'use client';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <div className="pt-[100px] min-h-screen bg-[#FAFAFA]">
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