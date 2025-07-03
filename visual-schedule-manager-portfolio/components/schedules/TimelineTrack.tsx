"use client"

import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { TIME_BLOCK_WIDTH } from '../../utils/timeline-helpers';

const TRACK_LABEL_WIDTH = 96; // Reduced since we removed labels

interface TimelineTrackProps {
  label: string;
  emoji: string;
  trackId: string;
  children?: React.ReactNode;
  className?: string;
  maxStackDepth?: number;
  onDrop?: (position: number) => void;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  label,
  emoji,
  trackId,
  children,
  className,
  maxStackDepth = 0,
  onDrop
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  
  // Calculate height based on stack depth
  // Base height is 40px (32px badge + 8px padding), add 36px for each additional stack level
  const trackHeight = 40 + (maxStackDepth * 36);
  const minHeight = `${trackHeight}px`;
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!trackRef.current || !onDrop) return;
    
    // Get the position where the item was dropped
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = Math.floor(x / TIME_BLOCK_WIDTH);
    
    // Clamp position to valid range (0-95)
    const clampedPosition = Math.max(0, Math.min(95, position));
    
    onDrop(clampedPosition);
  };

  useEffect(() => {
    // Position the label in the fixed column
    if (trackRef.current && labelRef.current) {
      const trackElement = trackRef.current;
      const labelElement = labelRef.current;
      
      // Find the labels container
      const labelsContainer = trackElement.closest('.grid')?.querySelector('.timeline-track-labels');
      if (labelsContainer && !labelsContainer.contains(labelElement)) {
        labelsContainer.appendChild(labelElement);
      }
    }
  }, []);

  return (
    <>
      {/* Track label - rendered into the fixed column */}
      <div
        ref={labelRef}
        className="flex items-center px-4 bg-gray-50 border-b border-gray-200"
        data-track-label={trackId}
        style={{ minHeight }}
      >
        <div className="flex items-center gap-2">
          {emoji && <span className="text-lg">{emoji}</span>}
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
        </div>
      </div>

      {/* Track content - rendered in the scrollable area */}
      <div
        ref={trackRef}
        className={cn(
          "relative border-b border-gray-200 last:border-b-0",
          className
        )}
        style={{ minHeight }}
        data-track-id={trackId}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {children}
      </div>
    </>
  );
};
