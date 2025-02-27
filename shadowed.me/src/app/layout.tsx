import type { Metadata } from "next";
import { Inter, Outfit } from 'next/font/google';
import { Suspense } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ToasterProvider from "@/components/ToasterProvider";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const outfit = Outfit({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "Shadowed.me - Connect & Grow",
  description: "Connecting students to opportunities through clubs, volunteering, and career shadowing",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden`} suppressHydrationWarning>
        <AuthProvider>
          <Header />
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <LoadingSpinner size="lg" />
            </div>
          }>
            <main className={outfit.className}>
              {children}
            </main>
          </Suspense>
          <Footer />
          <ToasterProvider />
        </AuthProvider>
      </body>
    </html>
  );
}