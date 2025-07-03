"use client"

import React from 'react';
import { getTimelinePosition, DEFAULT_BUSINESS_HOURS, TIME_BLOCK_WIDTH } from '../../utils/timeline-helpers';
import { cn } from '../../lib/utils';

interface BusinessHoursOverlayProps {
  entity: 'usa' | 'europe' | 'asia';
  className?: string;
}

interface BusinessHours {
  start: number; // position 0-95
  end: number;   // position 0-95
  label: string;
}

const getBusinessHours = (entity: 'usa' | 'europe' | 'asia'): BusinessHours[] => {
  const config = DEFAULT_BUSINESS_HOURS[entity];
  
  if (!config) {
    return [];
  }
  
  const startPos = getTimelinePosition(config.start, 0);
  const endPos = getTimelinePosition(config.end, 0);
  
  return [{
    start: startPos,
    end: endPos,
    label: 'Business hours - preferred scheduling window'
  }];
};

export const BusinessHoursOverlay: React.FC<BusinessHoursOverlayProps> = ({ 
  entity, 
  className 
}) => {
  const businessHours = getBusinessHours(entity);

  if (businessHours.length === 0) {
    return null;
  }

  return (
    <>
      {businessHours.map((hours, index) => {
        const leftPosition = hours.start * TIME_BLOCK_WIDTH;
        const width = (hours.end - hours.start) * TIME_BLOCK_WIDTH;
        
        return (
          <div
            key={index}
            className={cn(
              "absolute top-0 bottom-0 bg-amber-50 opacity-60 z-10 pointer-events-none",
              className
            )}
            style={{ 
              left: `${leftPosition}px`, 
              width: `${width}px` 
            }}
            title={hours.label}
          >
            {/* Optional: Add a subtle pattern or border */}
            <div className="absolute inset-0 border-l-2 border-r-2 border-amber-200 border-dashed opacity-50"></div>
          </div>
        );
      })}
    </>
  );
};
