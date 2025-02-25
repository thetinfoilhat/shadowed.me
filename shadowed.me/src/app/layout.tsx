import type { Metadata } from "next";
import { Inter, Outfit } from 'next/font/google';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });
const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Shadowed.me - Connect & Grow",
  description: "Connecting students to opportunities through clubs, volunteering, and career shadowing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} overflow-x-hidden`}>
        <AuthProvider>
          {/* Subtle blue and orange accent elements */}
          <div className="fixed top-0 left-0 w-1 h-screen bg-gradient-to-b from-[#1E40AF] via-[#2A8E9E] to-transparent opacity-30 z-0"></div>
          <div className="fixed top-0 right-0 w-1 h-screen bg-gradient-to-b from-[#F97316] via-[#FB923C] to-transparent opacity-30 z-0"></div>
          <div className="fixed bottom-0 left-0 w-screen h-1 bg-gradient-to-r from-[#1E40AF] via-[#2A8E9E] to-[#F97316] opacity-30 z-0"></div>
          
          {/* Subtle accent orbs */}
          <div className="fixed -top-20 -left-20 w-40 h-40 rounded-full bg-[#1E40AF]/5 blur-3xl z-0"></div>
          <div className="fixed -bottom-20 -right-20 w-40 h-40 rounded-full bg-[#F97316]/5 blur-3xl z-0"></div>
          
          <Header />
          <main className={`${outfit.className} relative z-10`}>
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
