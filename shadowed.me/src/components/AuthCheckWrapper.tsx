'use client';
import dynamic from 'next/dynamic';

const AuthCheck = dynamic(() => import('./AuthCheck'), { ssr: false });

export default function AuthCheckWrapper() {
  return <AuthCheck />;
} 