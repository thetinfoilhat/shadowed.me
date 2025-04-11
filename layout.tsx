import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastContextProvider } from '@/context/ToastContext';
import FormInputStyles from '@/components/FormInputStyles';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shadowed',
  description: 'Explore clubs at your school',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ToastContextProvider>
            <FormInputStyles />
            {children}
          </ToastContextProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 