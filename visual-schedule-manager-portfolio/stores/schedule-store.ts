import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { convertUTCToPosition, getBusinessHours } from '../utils/timezone-conversion';

export interface Schedule {
  id: string;
  title: string;
  entity: 'usa' | 'adgm';
  syncType: 'project' | 'user';
  emoji: string;
  startTimeUTC: string; // HH:mm format
  duration: number; // minutes
  enabled: boolean;
  frequency: 'daily' | 'manual';
}

export interface ScheduleWithPosition extends Schedule {
  position: number; // 0-95
  displayTime: string;
}

export interface ConflictInfo {
  scheduleId: string;
  conflictsWith: string[];
  queuePosition: number;
  estimatedDelay: number;
}

interface ScheduleStore {
  // State
  schedules: Schedule[];
  selectedTimezone: string;
  businessHoursVisible: boolean;
  recentTimezones: string[];
  
  // Actions
  setSchedules: (schedules: Schedule[]) => void;
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (id: string, updates: Partial<Schedule>) => void;
  updateScheduleTime: (id: string, newTimeUTC: string) => void;
  deleteSchedule: (id: string) => void;
  setTimezone: (timezone: string) => void;
  toggleBusinessHours: () => void;
  addRecentTimezone: (timezone: string) => void;
  
  // Computed
  getSchedulePosition: (schedule: Schedule) => number;
  getSchedulesWithPositions: () => ScheduleWithPosition[];
  getConflicts: () => ConflictInfo[];
  getSchedulesByEntity: (entity?: 'usa' | 'adgm') => ScheduleWithPosition[];
  getEnabledSchedules: () => ScheduleWithPosition[];
}

// Auto-detect user's timezone
const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set, get) => ({
      // Initial state
      schedules: [],
      selectedTimezone: getUserTimezone(),
      businessHoursVisible: true,
      recentTimezones: [],
      
      // Actions
      setSchedules: (schedules) => set({ schedules }),
      
      addSchedule: (schedule) => set((state) => ({
        schedules: [...state.schedules, schedule]
      })),
      
      updateSchedule: (id, updates) => set((state) => ({
        schedules: state.schedules.map(schedule =>
          schedule.id === id ? { ...schedule, ...updates } : schedule
        )
      })),
      
      updateScheduleTime: (id, newTimeUTC) => set((state) => ({
        schedules: state.schedules.map(schedule =>
          schedule.id === id ? { ...schedule, startTimeUTC: newTimeUTC } : schedule
        )
      })),
      
      deleteSchedule: (id) => set((state) => ({
        schedules: state.schedules.filter(schedule => schedule.id !== id)
      })),
      
      setTimezone: (timezone) => {
        const { addRecentTimezone } = get();
        addRecentTimezone(timezone);
        set({ selectedTimezone: timezone });
      },
      
      toggleBusinessHours: () => set((state) => ({
        businessHoursVisible: !state.businessHoursVisible
      })),
      
      addRecentTimezone: (timezone) => set((state) => {
        // Valid timezones for our system
        const validTimezones = [
          'America/New_York',
          'America/Chicago',
          'America/Denver',
          'America/Los_Angeles',
          'Asia/Dubai'
        ];
        
        // Only add if it's a valid timezone
        if (!validTimezones.includes(timezone)) {
          return state;
        }
        
        const recentTimezones = [
          timezone,
          ...state.recentTimezones.filter(tz => tz !== timezone && validTimezones.includes(tz))
        ].slice(0, 3); // Keep only 3 most recent and valid
        
        return { recentTimezones };
      }),
      
      // Computed functions
      getSchedulePosition: (schedule) => {
        const { selectedTimezone } = get();
        return convertUTCToPosition(schedule.startTimeUTC, selectedTimezone);
      },
      
      getSchedulesWithPositions: () => {
        const { schedules, selectedTimezone } = get();
        return schedules.map(schedule => ({
          ...schedule,
          position: convertUTCToPosition(schedule.startTimeUTC, selectedTimezone),
          displayTime: schedule.startTimeUTC // This will be formatted by the component
        }));
      },
      
      getConflicts: () => {
        const schedulesWithPositions = get().getSchedulesWithPositions();
        const conflicts: ConflictInfo[] = [];
        
        // Group schedules by position
        const positionGroups: { [position: number]: ScheduleWithPosition[] } = {};
        
        schedulesWithPositions.forEach(schedule => {
          if (!schedule.enabled) return;
          
          const position = schedule.position;
          if (!positionGroups[position]) {
            positionGroups[position] = [];
          }
          positionGroups[position].push(schedule);
        });
        
        // Find conflicts
        Object.entries(positionGroups).forEach(([, schedules]) => {
          if (schedules.length > 1) {
            schedules.forEach((schedule, index) => {
              if (index > 0) { // First schedule runs immediately, others are queued
                conflicts.push({
                  scheduleId: schedule.id,
                  conflictsWith: schedules.slice(0, index).map(s => s.id),
                  queuePosition: index + 1,
                  estimatedDelay: schedules.slice(0, index).reduce((sum, s) => sum + s.duration, 0)
                });
              }
            });
          }
        });
        
        return conflicts;
      },
      
      getSchedulesByEntity: (entity) => {
        const schedulesWithPositions = get().getSchedulesWithPositions();
        if (!entity) return schedulesWithPositions;
        return schedulesWithPositions.filter(schedule => schedule.entity === entity);
      },
      
      getEnabledSchedules: () => {
        const schedulesWithPositions = get().getSchedulesWithPositions();
        return schedulesWithPositions.filter(schedule => schedule.enabled);
      }
    }),
    {
      name: 'schedule-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain fields
      partialize: (state) => ({
        schedules: state.schedules,
        selectedTimezone: state.selectedTimezone,
        businessHoursVisible: state.businessHoursVisible,
        recentTimezones: state.recentTimezones,
      }),
    }
  )
);

// Helper function to create a new schedule
export const createSchedule = (
  entity: 'usa' | 'adgm',
  syncType: 'project' | 'user',
  startTimeUTC?: string
): Omit<Schedule, 'id'> => ({
  title: `${entity.toUpperCase()} ${syncType === 'project' ? 'Projects' : 'Users'}`,
  entity,
  syncType,
  emoji: entity === 'usa' ? '🇺🇸' : '🇦🇪',
  startTimeUTC: startTimeUTC || '02:00', // Default to 2 AM UTC
  duration: 5, // Default 5 minutes
  enabled: false,
  frequency: 'daily'
});

// Helper to validate schedule time
export const validateScheduleTime = (
  timeUTC: string,
  entity: 'usa' | 'adgm',
  displayTimezone: string
): { valid: boolean; warning?: string } => {
  try {
    const position = convertUTCToPosition(timeUTC, displayTimezone);
    const businessHours = getBusinessHours(entity, displayTimezone);
    
    // Check if the time falls within business hours
    const isInBusinessHours = position >= businessHours.start && position <= businessHours.end;
    
    if (isInBusinessHours) {
      return {
        valid: true,
        warning: 'Scheduling during business hours is not recommended as it may impact users.'
      };
    }
    
    return { valid: true };
  } catch {
    return {
      valid: false,
      warning: 'Invalid time format or timezone.'
    };
  }
};
