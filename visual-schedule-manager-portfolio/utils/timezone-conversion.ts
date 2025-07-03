import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';

export const convertUTCToPosition = (
  timeUTC: string, // "HH:mm"
  displayTimezone: string
): number => {
  try {
    // Parse the UTC time
    const [hours, minutes] = timeUTC.split(':').map(Number);
    
    // Create a date object in UTC for today with the specified time
    const utcDate = new Date();
    utcDate.setUTCHours(hours, minutes, 0, 0);
    
    // Convert to display timezone
    const zonedDate = toZonedTime(utcDate, displayTimezone);
    
    // Get local hours and minutes
    const localHours = zonedDate.getHours();
    const localMinutes = zonedDate.getMinutes();
    
    // Convert to position (0-95) - each position is 15 minutes
    return localHours * 4 + Math.floor(localMinutes / 15);
  } catch (error) {
    console.error('Error converting UTC to position:', error);
    return 0;
  }
};

export const convertPositionToUTC = (
  position: number, // 0-95
  displayTimezone: string
): string => {
  try {
    // Calculate hours and minutes from position
    const hours = Math.floor(position / 4);
    const minutes = (position % 4) * 15;
    
    // Create a date object in the display timezone for today
    const localDate = new Date();
    localDate.setHours(hours, minutes, 0, 0);
    
    // Convert to UTC
    const utcDate = fromZonedTime(localDate, displayTimezone);
    
    // Return in HH:mm format
    return format(utcDate, 'HH:mm', { timeZone: 'UTC' });
  } catch (error) {
    console.error('Error converting position to UTC:', error);
    return '00:00';
  }
};

export const formatTimeForDisplay = (
  timeUTC: string,
  displayTimezone: string
): string => {
  try {
    const [hours, minutes] = timeUTC.split(':').map(Number);
    const utcDate = new Date();
    utcDate.setUTCHours(hours, minutes, 0, 0);
    
    const zonedDate = toZonedTime(utcDate, displayTimezone);
    
    // Format as "2:00 AM EST"
    return format(zonedDate, 'h:mm a zzz', { timeZone: displayTimezone });
  } catch (error) {
    console.error('Error formatting time for display:', error);
    return timeUTC;
  }
};

export const getTimezoneOffset = (timezone: string): number => {
  try {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utcTime + (getTimezoneOffsetInMs(timezone)));
    return (targetTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  } catch (error) {
    console.error('Error getting timezone offset:', error);
    return 0;
  }
};

const getTimezoneOffsetInMs = (timezone: string): number => {
  const now = new Date();
  const zonedTime = toZonedTime(now, timezone);
  const utcTime = fromZonedTime(zonedTime, 'UTC');
  return zonedTime.getTime() - utcTime.getTime();
};

export const getBusinessHours = (
  entity: 'usa' | 'adgm',
  displayTimezone: string
): { start: number; end: number } => {
  try {
    if (entity === 'usa') {
      // USA: 8 AM EST to 8 PM PST
      // Convert 8 AM EST to display timezone
      const estStartUTC = convertPositionToUTC(32, 'America/New_York'); // 8 AM EST = position 32
      const pstEndUTC = convertPositionToUTC(80, 'America/Los_Angeles'); // 8 PM PST = position 80
      
      const startPosition = convertUTCToPosition(estStartUTC, displayTimezone);
      const endPosition = convertUTCToPosition(pstEndUTC, displayTimezone);
      
      return { start: startPosition, end: endPosition };
    } else {
      // ADGM: 8 AM to 6 PM GST
      const gstStartUTC = convertPositionToUTC(32, 'Asia/Dubai'); // 8 AM GST = position 32
      const gstEndUTC = convertPositionToUTC(72, 'Asia/Dubai'); // 6 PM GST = position 72
      
      const startPosition = convertUTCToPosition(gstStartUTC, displayTimezone);
      const endPosition = convertUTCToPosition(gstEndUTC, displayTimezone);
      
      return { start: startPosition, end: endPosition };
    }
  } catch (error) {
    console.error('Error calculating business hours:', error);
    return { start: 32, end: 72 }; // Default 8 AM to 6 PM
  }
};

export const getCurrentTimePosition = (timezone: string): number => {
  try {
    const now = new Date();
    const zonedNow = toZonedTime(now, timezone);
    const hours = zonedNow.getHours();
    const minutes = zonedNow.getMinutes();
    
    // Convert to position with sub-minute precision
    return hours * 4 + (minutes / 15);
  } catch (error) {
    console.error('Error getting current time position:', error);
    return 0;
  }
};

export const getTimelinePosition = (hours: number, minutes: number): number => {
  return hours * 4 + Math.floor(minutes / 15);
};

export const formatTimeMarker = (hour: number): string => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

export const getGridColumns = (): string => {
  return 'repeat(96, 1fr)';
};