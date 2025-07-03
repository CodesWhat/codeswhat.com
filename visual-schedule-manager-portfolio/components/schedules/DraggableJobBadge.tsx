"use client"

import React from 'react';
import { Badge } from '../ui/badge';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TIME_BLOCK_WIDTH } from '../../utils/timeline-helpers';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface Schedule {
  id: string;
  title: string;
  entity: string; // Now can be 'usa', 'europe', or 'asia'
  syncType: string; // Can be 'user_sync' or 'project_sync'
  emoji: string;
  startTimeUTC: string;
  duration: number;
  enabled: boolean;
  frequency: 'daily' | 'manual';
  position: number;
  hasConflict?: boolean;
  stackIndex?: number; // For handling overlapping schedules
}

interface DraggableJobBadgeProps {
  schedule: Schedule;
  onDrag: (scheduleId: string) => void;
  onDrop: (scheduleId: string, newPosition: number) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  isPositioned?: boolean; // Whether to use absolute positioning
}

export const DraggableJobBadge: React.FC<DraggableJobBadgeProps> = ({
  schedule,
  onDrag,
  onDrop,
  isSelected = false,
  onSelect,
  isPositioned = true
}) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('scheduleId', schedule.id);
    setIsDragging(true);
    onDrag(schedule.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Calculate position and width based on TIME_BLOCK_WIDTH
  const leftPosition = schedule.position * TIME_BLOCK_WIDTH;
  const width = schedule.duration * TIME_BLOCK_WIDTH;
  
  // Vertical offset for stacked schedules
  const topOffset = schedule.stackIndex ? schedule.stackIndex * 36 : 4;

  // Determine source and destination icons
  const getSourceIcon = () => {
    if (schedule.syncType === 'user_sync' || schedule.title === 'User Sync') {
      return '../../assets/integrations/onelogin_favicon.png';
    }
    return '../../assets/integrations/sage_favicon.png';
  };

  const getDestinationIcon = () => {
    return '../../assets/integrations/fyle_favicon.png';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            draggable={true}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={onSelect}
            className={cn(
              "transition-all",
              isPositioned && "absolute",
              "cursor-move",
              !schedule.enabled && "opacity-60",
              isDragging && "opacity-50",
              isSelected && "ring-2 ring-blue-500 ring-offset-1",
              schedule.stackIndex && "opacity-90" // Slight transparency for stacked items
            )}
            style={isPositioned ? { 
              left: `${leftPosition}px`, 
              width: `${width}px`,
              minWidth: '100px', // Ensure minimum visibility for 1-hour blocks
              top: `${topOffset}px`,
              height: '32px'
            } : {
              minWidth: '100px',
              height: '32px'
            }}
          >
            <Badge
              variant={schedule.enabled ? "default" : "secondary"}
              className={cn(
                "h-full w-full flex items-center justify-start px-2 py-1 text-xs font-medium hover:shadow-md transition-shadow",
                schedule.hasConflict && "border-red-500 border-2",
                "overflow-hidden",
                // Light grey background for better icon visibility
                schedule.enabled ? "bg-gray-100 text-gray-900 border-gray-300" : "bg-gray-50 text-gray-500 border-gray-200"
              )}
            >
              <div className="flex items-center gap-1 w-full justify-start">
                {/* Source icon */}
                <div className="relative w-4 h-4 flex-shrink-0">
                                  <Image 
                  src={getSourceIcon()} 
                  alt="Source" 
                  fill
                  sizes="16px"
                  className="object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                </div>
                
                {/* Arrow */}
                <ArrowRight className="h-3 w-3 flex-shrink-0 text-gray-700" />
                
                {/* Destination icon */}
                <div className="relative w-4 h-4 flex-shrink-0">
                                  <Image 
                  src={getDestinationIcon()} 
                  alt="Fyle" 
                  fill
                  sizes="16px"
                  className="object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                </div>
                
                {/* Title */}
                <span className="truncate ml-1">{schedule.title}</span>
                
                {schedule.hasConflict && (
                  <AlertCircle className="ml-auto h-3 w-3 text-red-500 flex-shrink-0" />
                )}
              </div>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{schedule.entity.toUpperCase()} - {schedule.title}</p>
          <p className="text-xs text-gray-400">
            {schedule.syncType === 'user_sync' ? 'OneLogin → Fyle' : 'Sage → Fyle'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Simplified badge preview for drag operations
interface JobBadgePreviewProps {
  id: string;
  title: string;
  emoji: string;
  color?: string;
  enabled: boolean;
  hasConflict?: boolean;
}

export const JobBadgePreview: React.FC<JobBadgePreviewProps> = ({
  id,
  title,
  emoji,
  color,
  enabled,
  hasConflict
}) => {
  return (
    <Badge
      variant={enabled ? "default" : "secondary"}
      className={cn(
        "h-8 px-3 py-1 text-xs font-medium flex items-center gap-1",
        hasConflict && "border-red-500 border-2",
        // Light grey background for consistency
        enabled ? "bg-gray-100 text-gray-900 border-gray-300" : "bg-gray-50 text-gray-500 border-gray-200"
      )}
    >
      <span className="flex-shrink-0">{emoji}</span>
      <span className="truncate">{title}</span>
      {hasConflict && (
        <AlertCircle className="ml-1 h-3 w-3 text-red-500 flex-shrink-0" />
      )}
    </Badge>
  );
};
