import { format, isValid, parseISO, parse } from 'date-fns';

const parseDate = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;
  
  try {
    // Parse date as local time, not UTC
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // For YYYY-MM-DD format, parse as local date at noon to avoid timezone issues
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day, 12, 0, 0);
    }
    
    // Try ISO format for full datetime strings
    let date = parseISO(dateStr);
    
    // If invalid, try other common formats
    if (!isValid(date)) {
      date = parse(dateStr, 'yyyy-MM-dd', new Date());
    }
    
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
};

// Helper function to parse date strings as local dates
export const parseLocalDate = (dateStr: string): Date => {
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // For YYYY-MM-DD format, parse as local date at noon to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  // For other formats or datetime strings, add 'T12:00:00' to avoid timezone shifts
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return new Date(dateStr);
  }
  // For date-only strings without time, add noon time
  return new Date(dateStr + 'T12:00:00');
};

export const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return 'Date not set';
  
  const date = parseDate(dateStr);
  if (!date) return 'Invalid date';
  
  return format(date, 'MMM d, yyyy');
};

export const formatDateForCircle = (dateStr: string | undefined) => {
  if (!dateStr) return { month: '---', day: '--' };
  
  const date = parseDate(dateStr);
  if (!date) return { month: '---', day: '--' };
  
  return {
    month: format(date, 'MMM'),
    day: format(date, 'd')
  };
};

export const formatTime = (timeStr: string | undefined): string => {
  if (!timeStr) return 'Time not set';
  
  try {
    // Handle both HH:mm and h:mm a formats
    let hours: number;
    let minutes: number;
    
    if (timeStr.includes('M')) {
      // Parse 12-hour format (e.g., "2:30 PM")
      const [time, period] = timeStr.split(' ');
      const [h, m] = time.split(':').map(Number);
      hours = period.toUpperCase() === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
      minutes = m;
    } else {
      // Parse 24-hour format (e.g., "14:30")
      const [h, m] = timeStr.split(':').map(Number);
      hours = h;
      minutes = m;
    }
    
    if (isNaN(hours) || isNaN(minutes)) return 'Invalid time';
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour = hours % 12 || 12;
    const minute = minutes.toString().padStart(2, '0');
    
    return `${hour}:${minute} ${period}`;
  } catch {
    return 'Invalid time format';
  }
};

// Helper function to format a Date object as YYYY-MM-DD in local timezone
// This prevents timezone shifts that can cause dates to appear one day earlier
export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to format a Date object as YYYY-MM-DD for comparison
// This prevents timezone shifts when comparing dates
export const formatDateForComparison = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}; 