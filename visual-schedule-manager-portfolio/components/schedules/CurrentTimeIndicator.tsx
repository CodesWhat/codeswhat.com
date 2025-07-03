"use client"

import React, { useEffect, useState } from 'react';
import { getTimelinePosition, TIME_BLOCK_WIDTH } from '../../utils/timeline-helpers';
import { cn } from '../../lib/utils';

interface CurrentTimeIndicatorProps {
  timezone: string;
  className?: string;
}

export const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({ 
  timezone, 
  className 
}) => {
  const [position, setPosition] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updatePosition = () => {
      // Get current time in the specified timezone
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      };
      
      const timeString = now.toLocaleString('en-US', options);
      const [hours, minutes] = timeString.split(':').map(Number);
      
      // Calculate position based on current time
      const timelinePosition = getTimelinePosition(hours, minutes);
      setPosition(timelinePosition);
      
      // Format time for display
      setCurrentTime(
        now.toLocaleString('en-US', {
          timeZone: timezone,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      );
    };

    // Update immediately and then every minute
    updatePosition();
    const interval = setInterval(updatePosition, 60000);

    return () => clearInterval(interval);
  }, [timezone]);

  if (position === null) {
    return null;
  }

  const leftPosition = position * TIME_BLOCK_WIDTH;

  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 w-0.5 bg-red-500 z-30",
        "before:content-[''] before:absolute before:top-0 before:-left-1",
        "before:w-3 before:h-3 before:bg-red-500 before:rounded-full",
        "pointer-events-none",
        className
      )}
      style={{ left: `${leftPosition}px` }}
      title={`Current time: ${currentTime}`}
    >
      {/* Time label */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
        {currentTime}
      </div>
    </div>
  );
};
