'use client';
import { useEffect, useState } from 'react';
import { formatDate, formatDateForCircle, formatTime } from '@/utils/dateUtils';

interface DateDisplayProps {
  date?: string;
  format?: 'normal' | 'circle' | 'time';
  className?: string;
}

export default function ClientDate({ date, format = 'normal', className = '' }: DateDisplayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={className}>Loading...</span>;
  }

  if (format === 'circle') {
    const { month, day } = formatDateForCircle(date);
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="text-sm font-medium">{month}</div>
        <div className="text-xl font-bold">{day}</div>
      </div>
    );
  }

  if (format === 'time') {
    return <span className={className}>{formatTime(date)}</span>;
  }

  return <span className={className}>{formatDate(date)}</span>;
} 