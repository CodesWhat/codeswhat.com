import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '../../lib/utils';

interface DroppableTimeSlotProps {
  slotId: string;
  position: number; // 0-95
  isOccupied: boolean;
}

export const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
  slotId,
  position,
  isOccupied,
}) => {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id: slotId,
    data: {
      position,
      isOccupied,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute top-0 h-full transition-colors duration-150',
        {
          // Empty slot - transparent
          'bg-transparent': !isOver,
          
          // Drag over available slot - green background
          'bg-green-100 border-l border-r border-green-300': isOver && !isOccupied,
          
          // Drag over occupied slot (will queue) - orange background
          'bg-orange-100 border-l border-r border-orange-300': isOver && isOccupied,
        }
      )}
      style={{
        // Position the drop zone at the correct time slot
        left: `${(position / 96) * 100}%`,
        width: `${100 / 96}%`, // Width of one 15-minute block
      }}
    >
      {/* Visual indicator when hovering */}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            'w-1 h-8 rounded-full opacity-70',
            {
              'bg-green-500': !isOccupied,
              'bg-orange-500': isOccupied,
            }
          )} />
        </div>
      )}
      
      {/* Accessibility - screen reader only content */}
      <span className="sr-only">
        Drop zone for {formatTimeFromPosition(position)}
        {isOccupied && ' (will be queued)'}
      </span>
    </div>
  );
};

// Helper function to format time from position
const formatTimeFromPosition = (position: number): string => {
  const hours = Math.floor(position / 4);
  const minutes = (position % 4) * 15;
  
  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  
  return `${formattedHours}:${formattedMinutes}`;
};

// Component to render all drop zones for a timeline
interface TimelineDropZonesProps {
  occupiedPositions: Set<number>;
  className?: string;
}

export const TimelineDropZones: React.FC<TimelineDropZonesProps> = ({
  occupiedPositions,
  className,
}) => {
  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      {Array.from({ length: 96 }, (_, index) => (
        <DroppableTimeSlot
          key={`slot-${index}`}
          slotId={`slot-${index}`}
          position={index}
          isOccupied={occupiedPositions.has(index)}
        />
      ))}
    </div>
  );
};