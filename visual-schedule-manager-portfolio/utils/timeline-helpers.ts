interface BusinessHoursConfig {
  [key: string]: { start: number; end: number };
}

const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  usa: { start: 8, end: 18 },
  europe: { start: 8, end: 18 },
  asia: { start: 9, end: 18 }
};

export const TIME_BLOCK_WIDTH = 25; // Width of each 15-minute block in pixels

export const getTimelinePosition = (hours: number, minutes: number): number => {
  // Validate inputs
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time: hours must be 0-23, minutes must be 0-59');
  }
  
  // Convert time to position (0-95)
  // Each hour has 4 blocks (15-minute each)
  // Clamp minutes to nearest 15-minute block
  const minuteBlock = Math.floor(minutes / 15);
  return hours * 4 + minuteBlock;
};

export function formatTimeForDisplay(hour: number, minute: number = 0): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  if (minute === 0) {
    return `${displayHour} ${period}`;
  }
  
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

export const getGridColumns = (): string => {
  // CSS grid template columns for 96 time blocks
  return `repeat(96, ${TIME_BLOCK_WIDTH}px)`;
};

export const getTimeFromPosition = (position: number): { hours: number; minutes: number } => {
  // Validate input
  if (position < 0 || position > 95) {
    throw new Error('Invalid position: must be between 0 and 95');
  }
  
  // Convert position back to hours and minutes
  const hours = Math.floor(position / 4);
  const minutes = (position % 4) * 15;
  return { hours, minutes };
};

export const isWithinBusinessHours = (
  position: number,
  entity: 'usa' | 'europe' | 'asia',
  businessHours: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS
): boolean => {
  // Check if position falls within business hours
  // This is a simplified check - timezone-aware business hours
  // will be handled by the BusinessHoursOverlay component
  const { hours } = getTimeFromPosition(position);
  
  const config = businessHours[entity];
  return config ? hours >= config.start && hours < config.end : false;
};

export const calculateGridWidth = (blockWidth: number = TIME_BLOCK_WIDTH): number => {
  // Calculate total grid width based on block width in pixels
  return 96 * blockWidth;
};

// Export the business hours config for reuse
export { DEFAULT_BUSINESS_HOURS, type BusinessHoursConfig };