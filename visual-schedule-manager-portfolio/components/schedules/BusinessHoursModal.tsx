'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Clock, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface BusinessHoursModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BusinessHoursConfig {
  usa: { start: number; end: number; enabled: boolean };
  europe: { start: number; end: number; enabled: boolean };
  asia: { start: number; end: number; enabled: boolean };
}

const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  usa: { start: 8, end: 18, enabled: true },
  europe: { start: 8, end: 18, enabled: true },
  asia: { start: 9, end: 18, enabled: true }
};

export function BusinessHoursModal({ open, onOpenChange }: BusinessHoursModalProps) {
  const [config, setConfig] = useState<BusinessHoursConfig>(DEFAULT_BUSINESS_HOURS);
  const [isDirty, setIsDirty] = useState(false);

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  };

  const handleSave = () => {
    // In a real implementation, this would save to backend/store
    toast.success('Business hours configuration saved');
    setIsDirty(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setConfig(DEFAULT_BUSINESS_HOURS);
        setIsDirty(false);
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const updateConfig = (entity: 'usa' | 'europe' | 'asia', field: keyof typeof config.usa, value: any) => {
    setConfig(prev => ({
      ...prev,
      [entity]: {
        ...prev[entity],
        [field]: value
      }
    }));
    setIsDirty(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Hours Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* USA Business Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <span className="text-xl">🇺🇸</span>
                North America Business Hours
                <span className="text-sm text-gray-500 font-normal">(Eastern Time)</span>
              </h3>
              <Switch
                checked={config.usa.enabled}
                onCheckedChange={(checked) => updateConfig('usa', 'enabled', checked)}
              />
            </div>
            
            {config.usa.enabled && (
              <div className="grid gap-4 md:grid-cols-2 ml-7">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select
                    value={config.usa.start.toString()}
                    onValueChange={(value) => updateConfig('usa', 'start', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {formatHour(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select
                    value={config.usa.end.toString()}
                    onValueChange={(value) => updateConfig('usa', 'end', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem 
                          key={i} 
                          value={i.toString()}
                          disabled={i <= config.usa.start}
                        >
                          {formatHour(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Europe Business Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <span className="text-xl">🇬🇧</span>
                Europe Business Hours
                <span className="text-sm text-gray-500 font-normal">(London Time)</span>
              </h3>
              <Switch
                checked={config.europe.enabled}
                onCheckedChange={(checked) => updateConfig('europe', 'enabled', checked)}
              />
            </div>
            
            {config.europe.enabled && (
              <div className="grid gap-4 md:grid-cols-2 ml-7">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select
                    value={config.europe.start.toString()}
                    onValueChange={(value) => updateConfig('europe', 'start', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {formatHour(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select
                    value={config.europe.end.toString()}
                    onValueChange={(value) => updateConfig('europe', 'end', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem 
                          key={i} 
                          value={i.toString()}
                          disabled={i <= config.europe.start}
                        >
                          {formatHour(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Asia Business Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <span className="text-xl">🇯🇵</span>
                Asia Business Hours
                <span className="text-sm text-gray-500 font-normal">(Tokyo Time)</span>
              </h3>
              <Switch
                checked={config.asia.enabled}
                onCheckedChange={(checked) => updateConfig('asia', 'enabled', checked)}
              />
            </div>
            
            {config.asia.enabled && (
              <div className="grid gap-4 md:grid-cols-2 ml-7">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select
                    value={config.asia.start.toString()}
                    onValueChange={(value) => updateConfig('asia', 'start', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {formatHour(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select
                    value={config.asia.end.toString()}
                    onValueChange={(value) => updateConfig('asia', 'end', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem 
                          key={i} 
                          value={i.toString()}
                          disabled={i <= config.asia.start}
                        >
                          {formatHour(i)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">About Business Hours</p>
                <ul className="space-y-1">
                  <li>• Business hours are shown as a shaded area on the timeline</li>
                  <li>• Scheduling during business hours will show a warning</li>
                  <li>• Times are in each region's local timezone</li>
                  <li>• Sync jobs should ideally run outside business hours</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isDirty}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 