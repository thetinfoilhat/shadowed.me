'use client';
import Link from "next/link";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="bg-[#001440] text-white py-10">
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold mb-4 text-white">shadowed.me</h3>
            <p className="text-white/80">Helping students find their light.</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h3 className="text-xl font-bold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/clubs" className="text-white/80 hover:text-white transition-colors">School Clubs</Link></li>
              <li><Link href="/what-fits-you" className="text-white/80 hover:text-white transition-colors">Discover</Link></li>
              <li><Link href="/about" className="text-white/80 hover:text-white transition-colors">About</Link></li>
            </ul>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h3 className="text-xl font-bold mb-4 text-white">Contact</h3>
            <ul className="space-y-2">
              <li className="text-white/80">Naperville North HS</li>
              <li className="text-white/80">899 N Mill St, Naperville, IL 60563</li>
              <li><a href="mailto:infoshadowed@gmail.com" className="text-white/80 hover:text-white transition-colors">infoshadowed@gmail.com</a></li>
            </ul>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <h3 className="text-xl font-bold mb-4 text-white">Follow Us</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://www.naperville203.org/nnhs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  NNHS Website
                </a>
              </li>
              <li>
                <a 
                  href="https://www.linkedin.com/company/shadowedme" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </motion.div>
        </div>
        
        <div className="border-t border-white/10 mt-10 pt-6 text-center text-white/60 text-sm">
          © {new Date().getFullYear()} shadowed.me. All rights reserved.
        </div>
      </div>
    </footer>
  );
} 