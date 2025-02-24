'use client';
import Link from "next/link";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="bg-[#0A2540] text-white">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="font-semibold text-white mb-4 text-lg">shadowed.me</h3>
            <p className="text-white/70 text-sm">
              Connecting students to opportunities that spark their light.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h3 className="font-semibold text-white mb-4 text-lg">Quick Links</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/school-clubs" className="text-white/70 hover:text-[#2A8E9E] transition-colors text-sm">School Clubs</Link>
              <Link href="/volunteering" className="text-white/70 hover:text-[#2A8E9E] transition-colors text-sm">Volunteering</Link>
              <Link href="/about" className="text-white/70 hover:text-[#2A8E9E] transition-colors text-sm">About Us</Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h3 className="font-semibold text-white mb-4 text-lg">Contact</h3>
            <div className="flex flex-col space-y-2 text-sm text-white/70">
              <p>Naperville, IL</p>
              <p>hello@shadowed.me</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <h3 className="font-semibold text-white mb-4 text-lg">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-white/70 hover:text-[#2A8E9E] transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-white/70 hover:text-[#2A8E9E] transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          className="border-t border-white/10 mt-12 pt-8 text-sm text-white/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <p>© 2025 shadowed.me. All rights reserved.</p>
        </motion.div>
      </div>
    </footer>
  );
} 