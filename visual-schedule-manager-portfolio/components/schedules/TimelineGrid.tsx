"use client"

import React from 'react';
import { useMemo } from 'react';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { BusinessHoursOverlay } from './BusinessHoursOverlay';
import { getGridColumns, formatTimeForDisplay } from '../../utils/timeline-helpers';
import { cn } from '../../lib/utils';

// Constants for timeline dimensions
const TRACK_LABEL_WIDTH = 96; // Reduced since we removed labels
const TIMELINE_MIN_WIDTH = 2400; // Increased from 1200 to make blocks larger
const TOTAL_TIME_BLOCKS = 96;
const TIME_BLOCK_WIDTH = 25; // Increased from implicit ~12.5px to 25px

interface TimelineGridProps {
  timezone: string;
  currentTimeZone?: string;
  showBusinessHours?: boolean;
  entity?: 'usa' | 'europe' | 'asia';
  children?: React.ReactNode;
  className?: string;
}

export const TimelineGrid: React.FC<TimelineGridProps> = ({
  timezone,
  currentTimeZone,
  showBusinessHours = false,
  entity = 'usa',
  children,
  className
}) => {
  // Generate hour markers for 24-hour period
  const hourMarkers = Array.from({ length: 24 }, (_, index) => ({
    hour: index,
    label: formatTimeForDisplay(index),
    position: index * 4 // Each hour spans 4 blocks
  }));

  return (
    <div className={cn("relative border rounded-lg overflow-hidden bg-white", className)}>
      {/* Grid container with fixed labels and scrollable timeline */}
      <div className="grid" style={{ gridTemplateColumns: `${TRACK_LABEL_WIDTH}px 1fr` }}>
        {/* Fixed Labels Column */}
        <div className="border-r border-gray-200">
          {/* Schedule header */}
          <div className="h-12 p-2 bg-gray-50 border-b border-gray-200 flex items-center">
            <span className="text-xs font-medium text-gray-500">Schedule</span>
          </div>
          {/* Track labels container - will be filled by TimelineTrack components */}
          <div className="timeline-track-labels">
            {/* Labels will be absolutely positioned here by TimelineTrack */}
          </div>
        </div>

        {/* Scrollable Timeline */}
        <div className="overflow-x-auto">
          <div style={{ 
            minWidth: `${TIMELINE_MIN_WIDTH}px`,
            width: `${TOTAL_TIME_BLOCKS * TIME_BLOCK_WIDTH}px`
          }}>
            {/* Hour markers header */}
            <div className="relative h-12 flex bg-gray-50 border-b border-gray-200">
              {hourMarkers.map(({ hour, label, position }) => (
                <div
                  key={hour}
                  className="relative flex items-center justify-start pl-2 border-l border-gray-300"
                  style={{ 
                    width: `${4 * TIME_BLOCK_WIDTH}px`, // Each hour is 4 blocks
                    flexShrink: 0
                  }}
                >
                  <span className="text-xs font-medium text-gray-700">
                    {formatTimeForDisplay(hour)}
                  </span>
                </div>
              ))}
            </div>

            {/* Timeline content */}
            <div className="relative">
              {/* Grid background with 15-minute lines */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: TOTAL_TIME_BLOCKS }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-full border-l",
                      // Hour lines are stronger
                      index % 4 === 0 ? "border-gray-300" : "border-gray-200"
                    )}
                    style={{ 
                      width: `${TIME_BLOCK_WIDTH}px`,
                      flexShrink: 0
                    }}
                  />
                ))}
              </div>
              
              {/* Business hours overlay */}
              {showBusinessHours && entity && (
                <BusinessHoursOverlay 
                  entity={entity} 
                  className="absolute inset-0"
                />
              )}
              
              {/* Current time indicator - use currentTimeZone if provided, otherwise fall back to timezone */}
              <CurrentTimeIndicator 
                timezone={currentTimeZone || timezone}
                className="absolute top-0 bottom-0"
              />
              
              {/* Timeline tracks content */}
              <div className="relative z-20 timeline-tracks-container">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
