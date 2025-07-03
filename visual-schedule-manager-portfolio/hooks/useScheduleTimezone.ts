import { useMemo, useCallback } from 'react';
import { useScheduleStore, ScheduleWithPosition, ConflictInfo } from '../stores/schedule-store';
import { 
  convertUTCToPosition, 
  convertPositionToUTC, 
  formatTimeForDisplay,
  getCurrentTimePosition,
  getBusinessHours
} from '../utils/timezone-conversion';

export const useScheduleTimezone = () => {
  const { 
    selectedTimezone, 
    schedules, 
    businessHoursVisible
  } = useScheduleStore();

  // Convert all schedules to display timezone with positions
  const schedulesInTimezone = useMemo(() => {
    return schedules.map(schedule => {
      const position = convertUTCToPosition(schedule.startTimeUTC, selectedTimezone);
      const displayTime = formatTimeForDisplay(schedule.startTimeUTC, selectedTimezone);
      
      return {
        ...schedule,
        position,
        displayTime
      } as ScheduleWithPosition;
    });
  }, [schedules, selectedTimezone]);

  // Get current time position for the selected timezone
  const currentTimePosition = useMemo(() => {
    return getCurrentTimePosition(selectedTimezone);
  }, [selectedTimezone]);

  // Get business hours for entities in the selected timezone
  const businessHours = useMemo(() => {
    return {
      usa: getBusinessHours('usa', selectedTimezone),
      adgm: getBusinessHours('adgm', selectedTimezone)
    };
  }, [selectedTimezone]);

  // Helper to convert UTC time to local display time
  const convertTimeToLocal = useCallback((timeUTC: string) => {
    return formatTimeForDisplay(timeUTC, selectedTimezone);
  }, [selectedTimezone]);

  // Helper to convert position to UTC time
  const convertPositionToTime = useCallback((position: number) => {
    return convertPositionToUTC(position, selectedTimezone);
  }, [selectedTimezone]);

  // Helper to convert UTC time to position
  const convertTimeToPosition = useCallback((timeUTC: string) => {
    return convertUTCToPosition(timeUTC, selectedTimezone);
  }, [selectedTimezone]);

  // Get schedules by entity with timezone conversion
  const getSchedulesByEntityInTimezone = useCallback((entity?: 'usa' | 'adgm') => {
    return schedulesInTimezone.filter(schedule => 
      !entity || schedule.entity === entity
    );
  }, [schedulesInTimezone]);

  // Get enabled schedules in timezone
  const enabledSchedulesInTimezone = useMemo(() => {
    return schedulesInTimezone.filter(schedule => schedule.enabled);
  }, [schedulesInTimezone]);

  // Get conflicts with detailed information
  const conflictsInTimezone = useMemo(() => {
    const conflicts: ConflictInfo[] = [];
    const positionGroups: { [position: number]: ScheduleWithPosition[] } = {};
    
    // Group enabled schedules by position
    enabledSchedulesInTimezone.forEach(schedule => {
      const position = schedule.position;
      if (!positionGroups[position]) {
        positionGroups[position] = [];
      }
      positionGroups[position].push(schedule);
    });
    
    // Identify conflicts
    Object.entries(positionGroups).forEach(([, schedules]) => {
      if (schedules.length > 1) {
        // Sort by priority (users first, then by entity)
        const sortedSchedules = [...schedules].sort((a, b) => {
          if (a.syncType !== b.syncType) {
            return a.syncType === 'user' ? -1 : 1;
          }
          return a.entity.localeCompare(b.entity);
        });
        
        sortedSchedules.forEach((schedule, index) => {
          if (index > 0) { // First schedule runs immediately, others are queued
            conflicts.push({
              scheduleId: schedule.id,
              conflictsWith: sortedSchedules.slice(0, index).map(s => s.id),
              queuePosition: index + 1,
              estimatedDelay: sortedSchedules.slice(0, index).reduce((sum, s) => sum + s.duration, 0)
            });
          }
        });
      }
    });
    
    return conflicts;
  }, [enabledSchedulesInTimezone]);

  // Check if a specific time position has conflicts
  const hasConflictAtPosition = useCallback((position: number, excludeId?: string) => {
    const schedulesAtPosition = enabledSchedulesInTimezone.filter(
      schedule => schedule.position === position && schedule.id !== excludeId
    );
    return schedulesAtPosition.length > 0;
  }, [enabledSchedulesInTimezone]);

  // Get queue information for a position
  const getQueueInfoForPosition = useCallback((position: number, excludeId?: string) => {
    const schedulesAtPosition = enabledSchedulesInTimezone.filter(
      schedule => schedule.position === position && schedule.id !== excludeId
    );
    
    if (schedulesAtPosition.length === 0) {
      return { willQueue: false };
    }
    
    return {
      willQueue: true,
      queuedAfter: schedulesAtPosition.map(s => s.title),
      estimatedDelay: schedulesAtPosition.reduce((sum, s) => sum + s.duration, 0),
      queuePosition: schedulesAtPosition.length + 1
    };
  }, [enabledSchedulesInTimezone]);

  // Check if a time is during business hours
  const isBusinessHours = useCallback((position: number, entity: 'usa' | 'adgm') => {
    const entityBusinessHours = businessHours[entity];
    return position >= entityBusinessHours.start && position <= entityBusinessHours.end;
  }, [businessHours]);

  // Get next available position after a given position
  const getNextAvailablePosition = useCallback((startPosition: number, entity?: 'usa' | 'adgm') => {
    const position = startPosition;
    
    // Check up to 24 hours ahead
    for (let i = 0; i < 96; i++) {
      const checkPosition = (position + i) % 96;
      
      if (!hasConflictAtPosition(checkPosition)) {
        // If entity is specified, prefer non-business hours
        if (entity && isBusinessHours(checkPosition, entity)) {
          continue;
        }
        return checkPosition;
      }
    }
    
    // Fallback: return a position even if it has conflicts
    return (startPosition + 1) % 96;
  }, [hasConflictAtPosition, isBusinessHours]);

  // Format time for display with timezone
  const formatScheduleTime = useCallback((schedule: ScheduleWithPosition) => {
    return {
      utc: schedule.startTimeUTC,
      local: schedule.displayTime,
      position: schedule.position
    };
  }, []);

  // Get timeline metadata for rendering
  const timelineMetadata = useMemo(() => {
    return {
      timezone: selectedTimezone,
      currentTimePosition,
      businessHours,
      businessHoursVisible,
      totalSchedules: schedules.length,
      enabledSchedules: enabledSchedulesInTimezone.length,
      conflicts: conflictsInTimezone.length
    };
  }, [
    selectedTimezone, 
    currentTimePosition, 
    businessHours, 
    businessHoursVisible, 
    schedules.length, 
    enabledSchedulesInTimezone.length, 
    conflictsInTimezone.length
  ]);

  return {
    // Core data
    timezone: selectedTimezone,
    schedules: schedulesInTimezone,
    enabledSchedules: enabledSchedulesInTimezone,
    conflicts: conflictsInTimezone,
    
    // Metadata
    currentTimePosition,
    businessHours,
    timelineMetadata,
    
    // Helper functions
    convertTimeToLocal,
    convertPositionToTime,
    convertTimeToPosition,
    getSchedulesByEntityInTimezone,
    hasConflictAtPosition,
    getQueueInfoForPosition,
    isBusinessHours,
    getNextAvailablePosition,
    formatScheduleTime,
    
    // Computed properties
    hasConflicts: conflictsInTimezone.length > 0,
    hasEnabledSchedules: enabledSchedulesInTimezone.length > 0
  };
};
