'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Clock, Settings, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { formatInTimeZone } from 'date-fns-tz';

// Components
import { TimelineGrid } from './TimelineGrid';
import { TimelineTrack } from './TimelineTrack';
import { TimezoneSelector } from './TimezoneSelector';
import { AutoScheduleDialog } from './AutoScheduleDialog';
import { BusinessHoursModal } from './BusinessHoursModal';
import { DraggableJobBadge } from './DraggableJobBadge';

// API
import { api } from '../../lib/api/client';

interface Schedule {
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
  stackIndex?: number;
}

interface TimelineSchedulerProps {
  className?: string;
}

export const TimelineScheduler: React.FC<TimelineSchedulerProps> = ({ className }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoScheduleOpen, setAutoScheduleOpen] = useState(false);
  const [businessHoursOpen, setBusinessHoursOpen] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState<string>('America/New_York');
  const [dropTarget, setDropTarget] = useState<{ position: number | null }>({ position: null });
  const [draggedScheduleId, setDraggedScheduleId] = useState<string | null>(null);

  // Auto-detect user's timezone on mount
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) {
      setSelectedTimezone(detected);
    }
  }, []);

  // Mock data for disabled syncs (for demonstration)
  const getMockDisabledSyncs = (entity: string): Schedule[] => {
    // Use negative IDs for mock data to avoid conflicts
    const baseId = entity === 'usa' ? -1000 : entity === 'europe' ? -2000 : -3000;
    return [
      {
        id: baseId - 1,
        title: 'User Sync',
        entity: entity,
        syncType: 'user_sync',
        emoji: '👤',
        enabled: false,
        frequency: 'daily',
        position: null,
        startTimeUTC: null,
        duration: 60,
        description: 'Mock disabled user sync',
      },
      {
        id: baseId - 2,
        title: 'Project Sync',
        entity: entity,
        syncType: 'project_sync',
        emoji: '📁',
        enabled: false,
        frequency: 'daily',
        position: null,
        startTimeUTC: null,
        duration: 60,
        description: 'Mock disabled project sync',
      }
    ];
  };

  // Load schedules
  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.getVisualSchedules({ timezone: selectedTimezone });
      
      // Ensure response is an array
      if (response.data && Array.isArray(response.data)) {
        let schedulesData = response.data.map(s => ({
          ...s,
          position: s.position ?? null,
          startTimeUTC: s.startTimeUTC ?? null
        }));
        
        // Auto-schedule enabled syncs that don't have positions
        schedulesData = autoScheduleEnabledSyncs(schedulesData);
        
        // For mockup: ensure we have disabled syncs for each entity
        const entities = ['usa', 'europe', 'asia'];
        entities.forEach(entity => {
          const hasDisabledSyncs = schedulesData.some(s => 
            s.entity === entity && !s.enabled
          );
          if (!hasDisabledSyncs) {
            // Add mock disabled syncs
            schedulesData.push(...getMockDisabledSyncs(entity));
          }
        });
        
        setSchedules(schedulesData);
      } else {
        // For mockup: create default disabled syncs
        const mockSchedules = [
          ...getMockDisabledSyncs('usa'),
          ...getMockDisabledSyncs('europe'),
          ...getMockDisabledSyncs('asia')
        ];
        setSchedules(mockSchedules);
      }
    } catch (error: any) {
      console.error('Load schedules error:', error);
      
      // For mockup: use mock data on error
      const mockSchedules = [
        ...getMockDisabledSyncs('usa'),
        ...getMockDisabledSyncs('europe'),
        ...getMockDisabledSyncs('asia')
      ];
      setSchedules(mockSchedules);
    } finally {
      setLoading(false);
    }
  };

  // Auto-schedule enabled syncs starting at 2am local time
  const autoScheduleEnabledSyncs = (scheduleList: Schedule[]) => {
    // Separate schedules by entity
    const usaSchedules = scheduleList.filter(s => s.entity === 'usa');
    const europeSchedules = scheduleList.filter(s => s.entity === 'europe');
    const asiaSchedules = scheduleList.filter(s => s.entity === 'asia');
    
    // Auto-schedule function for a group of schedules
    const scheduleGroup = (group: Schedule[]) => {
      return group.map(schedule => {
        // Only auto-schedule if enabled and no position set
        if (schedule.enabled && schedule.position === null) {
          // User Sync at 2am, Project Sync at 3am
          const hour = schedule.syncType === 'user_sync' ? 2 : 3;
          const newSchedule = { ...schedule, position: hour * 4 }; // Convert hour to position
          return newSchedule;
        }
        return schedule;
      });
    };
    
    // Schedule syncs for each region
    const scheduledUsa = scheduleGroup(usaSchedules);
    const scheduledEurope = scheduleGroup(europeSchedules);
    const scheduledAsia = scheduleGroup(asiaSchedules);
    
    return [...scheduledUsa, ...scheduledEurope, ...scheduledAsia];
  };

  useEffect(() => {
    loadSchedules();
  }, [selectedTimezone]);

  // Handle schedule time update
  const handleScheduleUpdate = async (scheduleId: number, newPosition: number) => {
    try {
      const result = await api.updateVisualScheduleTime(scheduleId, { 
        position: newPosition, 
        timezone: selectedTimezone 
      });
      
      if (result.data.success) {
        toast.success(result.data.queue_info ? result.data.queue_info.message : "Schedule time updated successfully");
        loadSchedules();
      }
    } catch (error) {
      toast.error('Failed to update schedule');
    }
  };

  // Handle drop from drag and drop
  const handleDrop = (trackId: string, position: number) => {
    // Get the schedule ID from the drag event
    const scheduleId = parseInt(draggedScheduleId || '0');
    if (scheduleId) {
      // Enable the sync and set its position
      handleEnableSync(scheduleId, position);
      setDraggedScheduleId(null);
    }
  };
  
  // Handle enabling a sync and setting its position
  const handleEnableSync = async (scheduleId: number, position: number) => {
    // For mock data (negative IDs), just update state directly
    if (scheduleId < 0) {
      setSchedules(prev => prev.map(s => 
        s.id === scheduleId ? { ...s, enabled: true, position: position } : s
      ));
      toast.success("Schedule enabled and time updated");
      return;
    }
    
    try {
      // First enable the sync, then update its position
      const schedule = schedules.find(s => s.id === scheduleId);
      if (schedule && !schedule.enabled) {
        // Update to enable
        await api.toggleVisualSchedule(scheduleId, true);
      }
      
      // Then update position
      const result = await api.updateVisualScheduleTime(scheduleId, { 
        position: position, 
        timezone: selectedTimezone 
      });
      
      if (result.data.success) {
        toast.success("Schedule enabled and time updated");
        loadSchedules();
      }
    } catch (error) {
      toast.error('Failed to enable schedule');
    }
  };
  
  // Handle disabling a sync
  const handleDisableSync = async (scheduleId: number) => {
    // For mock data (negative IDs), just update state directly
    if (scheduleId < 0) {
      setSchedules(prev => prev.map(s => 
        s.id === scheduleId ? { ...s, enabled: false, position: null } : s
      ));
      toast.success("Schedule disabled");
      return;
    }
    
    try {
      const result = await api.toggleVisualSchedule(scheduleId, false);
      
      if (result.data.success) {
        toast.success("Schedule disabled");
        loadSchedules();
      }
    } catch (error) {
      toast.error('Failed to disable schedule');
    }
  };

  // Get current time in different timezones
  const getCurrentTimeForTimezone = (tz: string) => {
    try {
      return formatInTimeZone(new Date(), tz, 'h:mm a zzz');
    } catch {
      return 'Invalid timezone';
    }
  };

  // Separate schedules by entity
  const usaSchedules = schedules.filter(s => s.entity === 'usa');
  const europeSchedules = schedules.filter(s => s.entity === 'europe');
  const asiaSchedules = schedules.filter(s => s.entity === 'asia');

  // Calculate stack indices for overlapping schedules
  const calculateStackIndices = (scheduleList: Schedule[]) => {
    // Only calculate for enabled schedules
    const enabledSchedules = scheduleList.filter(s => s.enabled);
    
    // Sort by position
    const sorted = [...enabledSchedules].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const schedulesWithStack = [];
    
    for (const schedule of sorted) {
      let stackIndex = 0;
      
      // Check for overlaps with already processed schedules
      for (const existing of schedulesWithStack) {
        const schedStart = schedule.position ?? 0;
        const schedEnd = schedStart + 4; // 1 hour duration
        const existStart = existing.position ?? 0;
        const existEnd = existStart + 4;
        
        // Check if they overlap and are on the same stack level
        if (schedStart < existEnd && schedEnd > existStart && existing.stackIndex === stackIndex) {
          stackIndex++;
        }
      }
      
      schedulesWithStack.push({ ...schedule, stackIndex });
    }
    
    return schedulesWithStack;
  };

  const usaSchedulesWithStack = calculateStackIndices(usaSchedules);
  const europeSchedulesWithStack = calculateStackIndices(europeSchedules);
  const asiaSchedulesWithStack = calculateStackIndices(asiaSchedules);
  
  // Calculate max stack depth for track height
  const getMaxStackDepth = (scheduleList: any[]) => {
    return Math.max(0, ...scheduleList.map(s => s.stackIndex || 0));
  };
  
  const usaMaxStack = getMaxStackDepth(usaSchedulesWithStack);
  const europeMaxStack = getMaxStackDepth(europeSchedulesWithStack);
  const asiaMaxStack = getMaxStackDepth(asiaSchedulesWithStack);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  // Show message if no schedules exist
  if (schedules.length === 0 && !loading) {
    return (
      <div className={className}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Visual Schedule Manager</h2>
            <p className="text-sm text-gray-600 mt-1">
              No schedules found. Click Auto-Schedule to create default schedules.
            </p>
          </div>
          
          <Button
            onClick={() => setAutoScheduleOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Auto-Schedule
          </Button>
        </div>
        
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Schedules Configured</h3>
          <p className="text-gray-600 mb-4">
            Get started by using auto-schedule to create optimal sync timings for all regions.
          </p>
        </Card>
        
        <AutoScheduleDialog
          open={autoScheduleOpen}
          onOpenChange={(open) => {
            setAutoScheduleOpen(open);
            if (!open) {
              loadSchedules();
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Visual Schedule Manager</h2>
          <p className="text-sm text-gray-600 mt-1">
            Drag and drop to schedule sync jobs. Times shown in your selected timezone.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ✓ Syncs on the timeline are enabled and will run at the scheduled time
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <TimezoneSelector 
            value={selectedTimezone}
            onChange={setSelectedTimezone}
          />
          <Button
            variant="outline"
            onClick={() => setBusinessHoursOpen(true)}
          >
            Business Hours
          </Button>
          <Button
            onClick={() => setAutoScheduleOpen(true)}
          >
            Auto-Schedule
          </Button>
        </div>
      </div>

      {/* USA Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🇺🇸</span>
                <CardTitle>North America Schedule</CardTitle>
              </div>
              
              {/* Disabled USA syncs */}
              <div 
                className="flex items-center gap-2 min-h-[40px] p-2 rounded-md border-2 border-dashed border-gray-300 bg-gray-50"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-red-400', 'bg-red-50');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-red-400', 'bg-red-50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-red-400', 'bg-red-50');
                  const scheduleId = parseInt(draggedScheduleId || '0');
                  if (scheduleId) {
                    handleDisableSync(scheduleId);
                    setDraggedScheduleId(null);
                  }
                }}
              >
                {usaSchedules.filter(s => !s.enabled).map(schedule => (
                  <DraggableJobBadge
                    key={schedule.id}
                    schedule={{
                      id: schedule.id.toString(),
                      title: schedule.syncType === 'user_sync' ? 'User Sync' : 'Project Sync',
                      entity: schedule.entity,
                      syncType: schedule.syncType,
                      emoji: schedule.syncType === 'user_sync' ? '👤' : '📁',
                      startTimeUTC: schedule.startTimeUTC || '',
                      duration: 4,
                      enabled: schedule.enabled,
                      frequency: schedule.frequency as 'daily' | 'manual',
                      position: 0,
                    }}
                    onDrag={(id) => { setDraggedScheduleId(id); }}
                    onDrop={() => {}}
                    isPositioned={false}
                  />
                ))}
                {usaSchedules.filter(s => !s.enabled).length === 0 && (
                  <div className="text-sm text-gray-400 italic flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                    Drag syncs here to disable
                  </div>
                )}
              </div>
            </div>
            
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getCurrentTimeForTimezone('America/New_York')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <TimelineGrid
            timezone={selectedTimezone}
            currentTimeZone="America/New_York"
            showBusinessHours={true}
            entity="usa"
          >
            <TimelineTrack
              label=""
              emoji=""
              trackId="usa-syncs"
              maxStackDepth={usaMaxStack}
              onDrop={(position) => handleDrop('usa-syncs', position)}
            >
              {/* Render only enabled USA schedules on the timeline */}
              {usaSchedulesWithStack.filter(s => s.enabled).map(schedule => (
                <DraggableJobBadge
                  key={schedule.id}
                  schedule={{
                    id: schedule.id.toString(),
                    title: schedule.syncType === 'user_sync' ? 'User Sync' : 'Project Sync',
                    entity: schedule.entity,
                    syncType: schedule.syncType,
                    emoji: schedule.syncType === 'user_sync' ? '👤' : '📁',
                    startTimeUTC: schedule.startTimeUTC || '',
                    duration: 4, // 1 hour = 4 * 15-minute blocks
                    enabled: schedule.enabled,
                    frequency: schedule.frequency as 'daily' | 'manual',
                    position: schedule.position ?? 0,
                    stackIndex: schedule.stackIndex,
                  }}
                  onDrag={(id) => { setDraggedScheduleId(id); }}
                  onDrop={(id, pos) => handleScheduleUpdate(parseInt(id), pos)}
                />
              ))}
            </TimelineTrack>
          </TimelineGrid>
        </CardContent>
      </Card>

      {/* Europe Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🇬🇧</span>
                <CardTitle>Europe Schedule</CardTitle>
              </div>
              
              {/* Disabled Europe syncs */}
              <div 
                className="flex items-center gap-2 min-h-[40px] p-2 rounded-md border-2 border-dashed border-gray-300 bg-gray-50"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-red-400', 'bg-red-50');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-red-400', 'bg-red-50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-red-400', 'bg-red-50');
                  const scheduleId = parseInt(draggedScheduleId || '0');
                  if (scheduleId) {
                    handleDisableSync(scheduleId);
                    setDraggedScheduleId(null);
                  }
                }}
              >
                {europeSchedules.filter((s: Schedule) => !s.enabled).map((schedule: Schedule) => (
                  <DraggableJobBadge
                    key={schedule.id}
                    schedule={{
                      id: schedule.id.toString(),
                      title: schedule.syncType === 'user_sync' ? 'User Sync' : 'Project Sync',
                      entity: schedule.entity,
                      syncType: schedule.syncType,
                      emoji: schedule.syncType === 'user_sync' ? '👤' : '📁',
                      startTimeUTC: schedule.startTimeUTC || '',
                      duration: 4,
                      enabled: schedule.enabled,
                      frequency: schedule.frequency as 'daily' | 'manual',
                      position: 0,
                    }}
                    onDrag={(id) => { setDraggedScheduleId(id); }}
                    onDrop={() => {}}
                    isPositioned={false}
                  />
                ))}
                {europeSchedules.filter((s: Schedule) => !s.enabled).length === 0 && (
                  <div className="text-sm text-gray-400 italic flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                    Drag syncs here to disable
                  </div>
                )}
              </div>
            </div>
            
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getCurrentTimeForTimezone('Europe/London')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <TimelineGrid
            timezone={selectedTimezone}
            currentTimeZone="Europe/London"
            showBusinessHours={true}
            entity="europe"
          >
            <TimelineTrack
              label=""
              emoji=""
              trackId="europe-syncs"
              maxStackDepth={europeMaxStack}
              onDrop={(position) => handleDrop('europe-syncs', position)}
            >
              {/* Render only enabled Europe schedules on the timeline */}
              {europeSchedulesWithStack.filter((s: any) => s.enabled).map((schedule: any) => (
                <DraggableJobBadge
                  key={schedule.id}
                  schedule={{
                    id: schedule.id.toString(),
                    title: schedule.syncType === 'user_sync' ? 'User Sync' : 'Project Sync',
                    entity: schedule.entity,
                    syncType: schedule.syncType,
                    emoji: schedule.syncType === 'user_sync' ? '👤' : '📁',
                    startTimeUTC: schedule.startTimeUTC || '',
                    duration: 4, // 1 hour = 4 * 15-minute blocks
                    enabled: schedule.enabled,
                    frequency: schedule.frequency as 'daily' | 'manual',
                    position: schedule.position ?? 0,
                    stackIndex: schedule.stackIndex,
                  }}
                  onDrag={(id) => { setDraggedScheduleId(id); }}
                  onDrop={(id, pos) => handleScheduleUpdate(parseInt(id), pos)}
                />
              ))}
            </TimelineTrack>
          </TimelineGrid>
        </CardContent>
      </Card>

      {/* Asia Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🇯🇵</span>
                <CardTitle>Asia Schedule</CardTitle>
              </div>
              
              {/* Disabled Asia syncs */}
              <div 
                className="flex items-center gap-2 min-h-[40px] p-2 rounded-md border-2 border-dashed border-gray-300 bg-gray-50"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-red-400', 'bg-red-50');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-red-400', 'bg-red-50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-red-400', 'bg-red-50');
                  const scheduleId = parseInt(draggedScheduleId || '0');
                  if (scheduleId) {
                    handleDisableSync(scheduleId);
                    setDraggedScheduleId(null);
                  }
                }}
              >
                {asiaSchedules.filter((s: Schedule) => !s.enabled).map((schedule: Schedule) => (
                  <DraggableJobBadge
                    key={schedule.id}
                    schedule={{
                      id: schedule.id.toString(),
                      title: schedule.syncType === 'user_sync' ? 'User Sync' : 'Project Sync',
                      entity: schedule.entity,
                      syncType: schedule.syncType,
                      emoji: schedule.syncType === 'user_sync' ? '👤' : '📁',
                      startTimeUTC: schedule.startTimeUTC || '',
                      duration: 4,
                      enabled: schedule.enabled,
                      frequency: schedule.frequency as 'daily' | 'manual',
                      position: 0,
                    }}
                    onDrag={(id) => { setDraggedScheduleId(id); }}
                    onDrop={() => {}}
                    isPositioned={false}
                  />
                ))}
                {asiaSchedules.filter((s: Schedule) => !s.enabled).length === 0 && (
                  <div className="text-sm text-gray-400 italic flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                    Drag syncs here to disable
                  </div>
                )}
              </div>
            </div>
            
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getCurrentTimeForTimezone('Asia/Tokyo')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <TimelineGrid
            timezone={selectedTimezone}
            currentTimeZone="Asia/Tokyo"
            showBusinessHours={true}
            entity="asia"
          >
            <TimelineTrack
              label=""
              emoji=""
              trackId="asia-syncs"
              maxStackDepth={asiaMaxStack}
              onDrop={(position) => handleDrop('asia-syncs', position)}
            >
              {/* Render only enabled Asia schedules on the timeline */}
              {asiaSchedulesWithStack.filter((s: any) => s.enabled).map((schedule: any) => (
                <DraggableJobBadge
                  key={schedule.id}
                  schedule={{
                    id: schedule.id.toString(),
                    title: schedule.syncType === 'user_sync' ? 'User Sync' : 'Project Sync',
                    entity: schedule.entity,
                    syncType: schedule.syncType,
                    emoji: schedule.syncType === 'user_sync' ? '👤' : '📁',
                    startTimeUTC: schedule.startTimeUTC || '',
                    duration: 4, // 1 hour = 4 * 15-minute blocks
                    enabled: schedule.enabled,
                    frequency: schedule.frequency as 'daily' | 'manual',
                    position: schedule.position ?? 0,
                    stackIndex: schedule.stackIndex,
                  }}
                  onDrag={(id) => { setDraggedScheduleId(id); }}
                  onDrop={(id, pos) => handleScheduleUpdate(parseInt(id), pos)}
                />
              ))}
            </TimelineTrack>
          </TimelineGrid>
        </CardContent>
      </Card>

      {/* Modals */}
      <AutoScheduleDialog
        open={autoScheduleOpen}
        onOpenChange={(open) => {
          setAutoScheduleOpen(open);
          if (!open) {
            // Reload schedules when dialog closes
            loadSchedules();
          }
        }}
      />
      
      <BusinessHoursModal
        open={businessHoursOpen}
        onOpenChange={setBusinessHoursOpen}
      />
    </div>
  );
};