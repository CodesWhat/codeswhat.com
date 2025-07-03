import React from 'react';
import { cn } from '../../lib/utils';
import { JobBadgePreview } from './DraggableJobBadge';
import type { DragItem } from '../../hooks/useDragAndDrop';

interface DragPreviewProps {
  item: DragItem;
  showTimePreview?: boolean;
  previewPosition?: number; // Position where it will be dropped
}

export const DragPreview: React.FC<DragPreviewProps> = ({
  item,
  showTimePreview = false,
  previewPosition,
}) => {
  const formatTimeFromPosition = (position: number): string => {
    const hours = Math.floor(position / 4);
    const minutes = (position % 4) * 15;
    
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    return `${formattedHours}:${formattedMinutes}`;
  };

  return (
    <div className="pointer-events-none z-50">
      {/* Main badge preview */}
      <div className="transform scale-105 shadow-xl">
        <JobBadgePreview
          id={item.id}
          title={item.title}
          emoji={item.emoji}
          color={item.color}
          enabled={item.enabled}
          hasConflict={item.hasConflict}
        />
      </div>
      
      {/* Time preview tooltip */}
      {showTimePreview && previewPosition !== undefined && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            Drop at {formatTimeFromPosition(previewPosition)}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
              <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced drag preview with queue information
interface EnhancedDragPreviewProps extends DragPreviewProps {
  willQueue?: boolean;
  queuedAfter?: string[];
  estimatedStartTime?: number;
}

export const EnhancedDragPreview: React.FC<EnhancedDragPreviewProps> = ({
  item,
  showTimePreview = false,
  previewPosition,
  willQueue = false,
  queuedAfter = [],
  estimatedStartTime,
}) => {
  const formatTimeFromPosition = (position: number): string => {
    const hours = Math.floor(position / 4);
    const minutes = (position % 4) * 15;
    
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    return `${formattedHours}:${formattedMinutes}`;
  };

  return (
    <div className="pointer-events-none z-50">
      {/* Main badge preview */}
      <div className="transform scale-105 shadow-xl">
        <JobBadgePreview
          id={item.id}
          title={item.title}
          emoji={item.emoji}
          color={item.color}
          enabled={item.enabled}
          hasConflict={willQueue}
        />
      </div>
      
      {/* Enhanced preview with queue information */}
      {showTimePreview && previewPosition !== undefined && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
          <div className={cn(
            'text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap max-w-xs',
            {
              'bg-gray-900 text-white': !willQueue,
              'bg-orange-600 text-white': willQueue,
            }
          )}>
            {willQueue ? (
              <div className="space-y-1">
                <div className="font-medium">
                  Will be queued
                </div>
                <div className="text-xs opacity-90">
                  Scheduled: {formatTimeFromPosition(previewPosition)}
                </div>
                {estimatedStartTime !== undefined && estimatedStartTime !== previewPosition && (
                  <div className="text-xs opacity-90">
                    Estimated start: {formatTimeFromPosition(estimatedStartTime)}
                  </div>
                )}
                {queuedAfter.length > 0 && (
                  <div className="text-xs opacity-75">
                    After {queuedAfter.length} job{queuedAfter.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ) : (
              <div>
                Drop at {formatTimeFromPosition(previewPosition)}
              </div>
            )}
            
            {/* Tooltip arrow */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
              <div className={cn('w-2 h-2 rotate-45', {
                'bg-gray-900': !willQueue,
                'bg-orange-600': willQueue,
              })}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple drag preview for use in DragOverlay
export const SimpleDragPreview: React.FC<{ item: DragItem }> = ({ item }) => {
  return (
    <div className="transform scale-105 shadow-xl pointer-events-none">
      <JobBadgePreview
        id={item.id}
        title={item.title}
        emoji={item.emoji}
        color={item.color}
        enabled={item.enabled}
        hasConflict={item.hasConflict}
      />
    </div>
  );
};