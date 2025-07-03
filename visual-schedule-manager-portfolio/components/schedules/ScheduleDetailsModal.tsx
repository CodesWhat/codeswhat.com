'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Clock, Settings, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Schedule {
  id: string;
  title: string;
  entity: 'usa' | 'europe' | 'asia';
  syncType: 'project' | 'user';
  emoji: string;
  startTimeUTC?: string;
  duration: number;
  enabled: boolean;
  frequency: 'daily' | 'manual';
  position?: number;
  hasConflict?: boolean;
}

interface ScheduleDetailsModalProps {
  schedule: Schedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleDetailsModal({ schedule, open, onOpenChange }: ScheduleDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSchedule, setEditedSchedule] = useState<Partial<Schedule>>({});

  // Initialize edited schedule when modal opens
  React.useEffect(() => {
    if (schedule && open) {
      setEditedSchedule(schedule);
      setIsEditing(false);
    }
  }, [schedule, open]);

  if (!schedule) return null;

  const handleSave = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Schedule updated successfully');
      setIsEditing(false);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update schedule');
    }
  };

  const handleDelete = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Schedule deleted successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to delete schedule');
    }
  };

  const formatTime = (timeUTC?: string) => {
    if (!timeUTC) return 'Not scheduled';
    const [hours, minutes] = timeUTC.split(':').map(Number);
    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    }) + ' UTC';
  };

  const getStatusBadge = () => {
    if (!schedule.enabled) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    if (schedule.hasConflict) {
      return <Badge variant="destructive">Conflict</Badge>;
    }
    return <Badge variant="default" className="bg-green-500">Active</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">{schedule.emoji}</span>
            <div>
              <div className="text-lg">{schedule.title}</div>
              <div className="text-sm text-gray-500 font-normal">
                {schedule.entity.toUpperCase()} • {schedule.syncType} sync
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            {getStatusBadge()}
          </div>

          {/* Conflict Warning */}
          {schedule.hasConflict && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-orange-800 dark:text-orange-200">
                    Schedule Conflict
                  </div>
                  <div className="text-orange-700 dark:text-orange-300">
                    This sync will be queued after other jobs at the same time.
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <Separator />

          {/* Schedule Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Enabled</label>
                <div className="mt-1">
                  <Switch
                    checked={editedSchedule.enabled ?? schedule.enabled}
                    onCheckedChange={(checked) => 
                      setEditedSchedule(prev => ({ ...prev, enabled: checked }))
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Frequency</label>
                <div className="mt-1">
                  {isEditing ? (
                    <Select
                      value={editedSchedule.frequency ?? schedule.frequency}
                      onValueChange={(value) => 
                        setEditedSchedule(prev => ({ ...prev, frequency: value as 'daily' | 'manual' }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-gray-600 capitalize">
                      {schedule.frequency}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Scheduled Time</label>
              <div className="mt-1 text-sm text-gray-600">
                {formatTime(schedule.startTimeUTC)}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Duration</label>
              <div className="mt-1 text-sm text-gray-600">
                ~{schedule.duration} minutes
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Position on Timeline</label>
              <div className="mt-1 text-sm text-gray-600">
                Block {schedule.position || 0} of 96 (15-minute intervals)
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Drag on timeline to reschedule
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Use Auto-Schedule for optimization
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedSchedule(schedule);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Edit
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}