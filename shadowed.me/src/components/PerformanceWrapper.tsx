'use client';
import { memo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import PageTransition from './PageTransition';

interface PerformanceWrapperProps {
  children: ReactNode;
  withTransition?: boolean;
}

function PerformanceWrapperComponent({ 
  children, 
  withTransition = true 
}: PerformanceWrapperProps) {
  if (!withTransition) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  }

  return <PageTransition>{children}</PageTransition>;
}

// Memoize the component to prevent unnecessary re-renders
export const PerformanceWrapper = memo(PerformanceWrapperComponent); 