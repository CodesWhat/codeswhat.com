/**
 * Date formatting utilities for the frontend application
 */

/**
 * Format a date string to local time with consistent formatting
 */
export const formatLocalTime = (
  dateString: string, 
  options?: Intl.DateTimeFormatOptions
): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  // Ensure UTC string format
  const utcString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
  const date = new Date(utcString);
  
  // Validate date
  if (isNaN(date.getTime())) {
    console.error(`Invalid date string: ${dateString}`);
    return 'Invalid date';
  }
  
  return date.toLocaleString('en-US', options || defaultOptions);
};

/**
 * Format a date string to local time with extended options (includes year and timezone)
 */
export const formatLocalTimeExtended = (dateString: string): string => {
  return formatLocalTime(dateString, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });
};

/**
 * Format relative time (e.g., "2 hours ago", "just now")
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  
  // Validate date
  if (isNaN(date.getTime())) {
    console.error(`Invalid date string: ${dateString}`);
    return 'Invalid date';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Handle future dates
  if (diffMs < 0) {
    return formatLocalTime(dateString);
  }
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatLocalTime(dateString);
};

/**
 * Format duration in seconds to human-readable string
 * Examples: 45 → "45s", 90 → "1m 30s", 3665 → "1h 1m"
 */
export const formatDuration = (seconds: number): string => {
  // Validate input
  if (seconds < 0 || !Number.isInteger(seconds)) {
    console.error(`Invalid duration: ${seconds}. Duration must be a non-negative integer.`);
    return '0s';
  }
  
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 
    ? `${hours}h ${remainingMinutes}m` 
    : `${hours}h`;
};