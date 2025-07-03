// Mock API client for portfolio demo
// Simulates API calls without making real network requests

interface VisualSchedule {
  id: number;
  title: string;
  emoji: string;
  position: number | null;
  startTimeUTC: string | null;
  duration: number;
  enabled: boolean;
  frequency: string;
  entity: string;
  syncType: string;
  description?: string;
}

// Mock data storage
let mockSchedules: VisualSchedule[] = [
  // USA schedules
  {
    id: 1,
    title: 'User Sync',
    emoji: '👤',
    entity: 'usa',
    syncType: 'user_sync',
    enabled: true,
    frequency: 'daily',
    position: 8, // 2 AM = 2 * 4 blocks
    startTimeUTC: '2024-01-01T07:00:00Z',
    duration: 60,
    description: 'Sync users from OneLogin to Fyle',
  },
  {
    id: 2,
    title: 'Project Sync',
    emoji: '📁',
    entity: 'usa',
    syncType: 'project_sync',
    enabled: true,
    frequency: 'daily',
    position: 12, // 3 AM = 3 * 4 blocks
    startTimeUTC: '2024-01-01T08:00:00Z',
    duration: 60,
    description: 'Sync projects from Sage to Fyle',
  },
  // Europe schedules
  {
    id: 3,
    title: 'User Sync',
    emoji: '👤',
    entity: 'europe',
    syncType: 'user_sync',
    enabled: false,
    frequency: 'daily',
    position: null,
    startTimeUTC: null,
    duration: 60,
    description: 'Sync users from OneLogin to Fyle',
  },
  {
    id: 4,
    title: 'Project Sync',
    emoji: '📁',
    entity: 'europe',
    syncType: 'project_sync',
    enabled: false,
    frequency: 'daily',
    position: null,
    startTimeUTC: null,
    duration: 60,
    description: 'Sync projects from Sage to Fyle',
  },
  // Asia schedules
  {
    id: 5,
    title: 'User Sync',
    emoji: '👤',
    entity: 'asia',
    syncType: 'user_sync',
    enabled: false,
    frequency: 'daily',
    position: null,
    startTimeUTC: null,
    duration: 60,
    description: 'Sync users from OneLogin to Fyle',
  },
  {
    id: 6,
    title: 'Project Sync',
    emoji: '📁',
    entity: 'asia',
    syncType: 'project_sync',
    enabled: false,
    frequency: 'daily',
    position: null,
    startTimeUTC: null,
    duration: 60,
    description: 'Sync projects from Sage to Fyle',
  },
];

// Helper to simulate async delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API client
export const api = {
  getVisualSchedules: async ({ timezone }: { timezone: string }) => {
    await delay(300); // Simulate network delay
    return {
      data: [...mockSchedules],
      success: true,
    };
  },

  updateVisualScheduleTime: async (scheduleId: number, data: { position: number; timezone: string }) => {
    await delay(500); // Simulate network delay
    
    const schedule = mockSchedules.find(s => s.id === scheduleId);
    if (schedule) {
      schedule.position = data.position;
      // Mock UTC time calculation
      const hours = Math.floor(data.position / 4);
      const minutes = (data.position % 4) * 15;
      schedule.startTimeUTC = `2024-01-01T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00Z`;
    }
    
    return {
      data: {
        success: true,
        schedule,
        queue_info: {
          message: `Schedule updated to ${Math.floor(data.position / 4)}:${((data.position % 4) * 15).toString().padStart(2, '0')}`,
        },
      },
    };
  },

  toggleVisualSchedule: async (scheduleId: number, enabled: boolean) => {
    await delay(500); // Simulate network delay
    
    const schedule = mockSchedules.find(s => s.id === scheduleId);
    if (schedule) {
      schedule.enabled = enabled;
      if (!enabled) {
        schedule.position = null;
        schedule.startTimeUTC = null;
      }
    }
    
    return {
      data: {
        success: true,
        schedule,
      },
    };
  },

  autoSchedule: async (data: { timezone: string }) => {
    await delay(1000); // Simulate processing time
    
    // Auto-schedule all syncs
    mockSchedules.forEach(schedule => {
      if (!schedule.enabled) {
        schedule.enabled = true;
        // User syncs at 2 AM, project syncs at 3 AM
        const hour = schedule.syncType === 'user_sync' ? 2 : 3;
        schedule.position = hour * 4;
        schedule.startTimeUTC = `2024-01-01T${(hour + 5).toString().padStart(2, '0')}:00:00Z`; // Mock UTC
      }
    });
    
    return {
      data: {
        success: true,
        message: 'All schedules optimized successfully',
        schedules: [...mockSchedules],
      },
    };
  },
}; 