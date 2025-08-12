'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface RoleBasedAccessProps {
  allowedRoles: string[];
  children: React.ReactNode;
  redirectTo?: string;
  showLoading?: boolean;
}

export default function RoleBasedAccess({ 
  allowedRoles, 
  children, 
  redirectTo = '/student-dashboard',
  showLoading = true 
}: RoleBasedAccessProps) {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Check if user has access to this dashboard
      if (!userRole || !allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        let redirectPath = redirectTo;
        
        if (userRole === 'admin') {
          redirectPath = '/admin-dashboard';
        } else if (userRole === 'captain') {
          redirectPath = '/captain-dashboard';
        } else if (userRole === 'sponsor') {
          redirectPath = '/sponsor-dashboard';
        } else if (userRole === 'student') {
          redirectPath = '/student-dashboard';
        }
        
        router.push(redirectPath);
      }
    } else if (!loading && !user) {
      // User not logged in, redirect to login
      router.push('/');
    }
  }, [user, userRole, loading, allowedRoles, redirectTo, router]);

  // Show loading spinner while checking auth
  if (loading || !user) {
    return showLoading ? (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    ) : null;
  }

  // Check if user has access
  if (!userRole || !allowedRoles.includes(userRole)) {
    return showLoading ? (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    ) : null;
  }

  // User has access, render children
  return <>{children}</>;
}

// Convenience components for specific roles
export function AdminOnly({ children, showLoading = true }: { children: React.ReactNode; showLoading?: boolean }) {
  return (
    <RoleBasedAccess allowedRoles={['admin']} redirectTo="/admin-dashboard" showLoading={showLoading}>
      {children}
    </RoleBasedAccess>
  );
}

export function CaptainOnly({ children, showLoading = true }: { children: React.ReactNode; showLoading?: boolean }) {
  return (
    <RoleBasedAccess allowedRoles={['captain', 'admin']} redirectTo="/captain-dashboard" showLoading={showLoading}>
      {children}
    </RoleBasedAccess>
  );
}

export function SponsorOnly({ children, showLoading = true }: { children: React.ReactNode; showLoading?: boolean }) {
  return (
    <RoleBasedAccess allowedRoles={['sponsor', 'admin']} redirectTo="/sponsor-dashboard" showLoading={showLoading}>
      {children}
    </RoleBasedAccess>
  );
}

export function StudentOnly({ children, showLoading = true }: { children: React.ReactNode; showLoading?: boolean }) {
  return (
    <RoleBasedAccess allowedRoles={['student', 'captain', 'sponsor', 'admin']} redirectTo="/student-dashboard" showLoading={showLoading}>
      {children}
    </RoleBasedAccess>
  );
} 