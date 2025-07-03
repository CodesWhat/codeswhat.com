import { Schedule } from '../stores/schedule-store';
import { convertPositionToUTC, convertUTCToPosition } from './timezone-conversion';

export interface AutoScheduleOptions {
  baseHour: number; // 2 for 2 AM
  staggerMinutes: number; // 15
  syncOrder: ('user' | 'project')[];
}

export interface ScheduleUpdate {
  scheduleId: string;
  newTimeUTC: string;
  displayTime: string;
  timezone: string;
  entity: 'usa' | 'adgm';
  syncType: 'project' | 'user';
}

export const generateAutoSchedule = (
  unscheduledSyncs: Schedule[],
  options: AutoScheduleOptions = {
    baseHour: 2,
    staggerMinutes: 15,
    syncOrder: ['user', 'project']
  }
): ScheduleUpdate[] => {
  const scheduleUpdates: ScheduleUpdate[] = [];
  
  // Group syncs by entity
  const syncsByEntity = unscheduledSyncs.reduce((groups, sync) => {
    if (!groups[sync.entity]) {
      groups[sync.entity] = {};
    }
    if (!groups[sync.entity][sync.syncType]) {
      groups[sync.entity][sync.syncType] = [];
    }
    groups[sync.entity][sync.syncType].push(sync);
    return groups;
  }, {} as Record<string, Record<string, Schedule[]>>);
  
  // Process each entity
  Object.entries(syncsByEntity).forEach(([entity, syncTypes]) => {
    const entityTimezone = getLocalTimezone(entity as 'usa' | 'adgm');
    let currentMinuteOffset = 0;
    
    // Process sync types in order (users first, then projects)
    options.syncOrder.forEach(syncType => {
      if (syncTypes[syncType]) {
        syncTypes[syncType].forEach(sync => {
          // Calculate the scheduled time
          const totalMinutes = (options.baseHour * 60) + currentMinuteOffset;
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          
          // Create local time and convert to UTC
          const localTimeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          const position = convertUTCToPosition(localTimeString, entityTimezone);
          const utcTimeString = convertPositionToUTC(position, entityTimezone);
          
          scheduleUpdates.push({
            scheduleId: sync.id,
            newTimeUTC: utcTimeString,
            displayTime: localTimeString,
            timezone: entityTimezone,
            entity: sync.entity,
            syncType: sync.syncType
          });
          
          // Increment for next sync
          currentMinuteOffset += options.staggerMinutes;
        });
      }
    });
  });
  
  return scheduleUpdates;
};

export const getLocalTimezone = (entity: 'usa' | 'adgm'): string => {
  switch (entity) {
    case 'usa':
      return 'America/New_York'; // EST/EDT
    case 'adgm':
      return 'Asia/Dubai'; // GST
    default:
      return 'UTC';
  }
};

export const validateScheduleTime = (
  timeUTC: string,
  entity: 'usa' | 'adgm'
): { valid: boolean; warning?: string } => {
  try {
    const entityTimezone = getLocalTimezone(entity);
    const position = convertUTCToPosition(timeUTC, entityTimezone);
    
    // Convert position back to hours for readability
    const hours = Math.floor(position / 4);
    
    // Define business hours for each entity
    const businessHours = {
      usa: { start: 8, end: 20 }, // 8 AM to 8 PM
      adgm: { start: 8, end: 18 }  // 8 AM to 6 PM
    };
    
    const entityHours = businessHours[entity];
    const isInBusinessHours = hours >= entityHours.start && hours < entityHours.end;
    
    if (isInBusinessHours) {
      return {
        valid: true,
        warning: `Scheduling during business hours (${entityHours.start}:00-${entityHours.end}:00 local time) may impact users.`
      };
    }
    
    return { valid: true };
  } catch {
    return {
      valid: false,
      warning: 'Invalid time format or timezone configuration.'
    };
  }
};

export const calculateOptimalStartTime = (
  entity: 'usa' | 'adgm',
  existingSchedules: Schedule[] = []
): string => {
  const entityTimezone = getLocalTimezone(entity);
  const baseHour = 2; // 2 AM local time
  
  // Find occupied time slots
  const occupiedPositions = existingSchedules
    .filter(schedule => schedule.entity === entity && schedule.enabled)
    .map(schedule => convertUTCToPosition(schedule.startTimeUTC, entityTimezone));
  
  // Start from 2 AM and find first available slot
  let currentPosition = baseHour * 4; // 2 AM = position 8
  
  while (occupiedPositions.includes(currentPosition)) {
    currentPosition += 1; // Move to next 15-minute slot
    
    // If we've gone past 6 AM, wrap to next day or return original time
    if (currentPosition >= 24 * 4) {
      break;
    }
  }
  
  return convertPositionToUTC(currentPosition, entityTimezone);
};

export const getRecommendedScheduleTimes = (entity: 'usa' | 'adgm'): string[] => {
  const entityTimezone = getLocalTimezone(entity);
  const recommendedHours = [2, 3, 4, 5]; // 2 AM to 5 AM local time
  
  return recommendedHours.map(hour => {
    const position = hour * 4; // Convert hour to position
    return convertPositionToUTC(position, entityTimezone);
  });
};

export const analyzeScheduleDistribution = (schedules: Schedule[]): {
  usa: { user: number; project: number };
  adgm: { user: number; project: number };
  total: number;
  unscheduled: number;
} => {
  const analysis = {
    usa: { user: 0, project: 0 },
    adgm: { user: 0, project: 0 },
    total: schedules.length,
    unscheduled: 0
  };
  
  schedules.forEach(schedule => {
    if (!schedule.startTimeUTC || !schedule.enabled) {
      analysis.unscheduled++;
    } else {
      analysis[schedule.entity][schedule.syncType]++;
    }
  });
  
  return analysis;
};

export const generateSchedulePreview = (
  updates: ScheduleUpdate[]
): {
  summary: string;
  timeline: { time: string; entity: string; syncType: string; timezone: string }[];
  conflicts: string[];
} => {
  const timeline = updates
    .map(update => ({
      time: update.displayTime,
      entity: update.entity,
      syncType: update.syncType,
      timezone: update.timezone
    }))
    .sort((a, b) => a.time.localeCompare(b.time));
  
  // Check for potential conflicts (same time slots)
  const timeSlots: Record<string, typeof timeline> = {};
  timeline.forEach(item => {
    const key = `${item.time}-${item.timezone}`;
    if (!timeSlots[key]) timeSlots[key] = [];
    timeSlots[key].push(item);
  });
  
  const conflicts = Object.entries(timeSlots)
    .filter(([, items]) => items.length > 1)
    .map(([time, items]) => 
      `${time}: ${items.map(i => `${i.entity} ${i.syncType}`).join(', ')}`
    );
  
  const summary = `Scheduling ${updates.length} sync jobs starting at 2:00 AM local time, staggered by 15 minutes.`;
  
  return { summary, timeline, conflicts };
};