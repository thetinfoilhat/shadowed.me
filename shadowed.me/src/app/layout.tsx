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
          <Header />
          <main className={outfit.className}>
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}