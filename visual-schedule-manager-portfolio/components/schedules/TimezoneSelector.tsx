'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '../ui/select';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  className?: string;
}

interface TimezoneOption {
  value: string;
  label: string;
  abbreviation: string;
  region: 'usa' | 'europe' | 'asia';
}

const TIMEZONE_GROUPS = {
  usa: [
    { value: 'America/New_York', label: 'Eastern Time', abbreviation: 'EST/EDT' },
    { value: 'America/Chicago', label: 'Central Time', abbreviation: 'CST/CDT' },
    { value: 'America/Los_Angeles', label: 'Pacific Time', abbreviation: 'PST/PDT' },
  ],
  europe: [
    { value: 'Europe/London', label: 'London', abbreviation: 'GMT/BST' },
  ],
  asia: [
    { value: 'Asia/Tokyo', label: 'Tokyo', abbreviation: 'JST' },
  ],
};

export const TimezoneSelector = ({ 
  value, 
  onChange, 
  className 
}: TimezoneSelectorProps) => {

  // Build the timezone options list with regions
  const timezoneOptions = useMemo(() => {
    const options: TimezoneOption[] = [];
    
    // Add USA timezones
    TIMEZONE_GROUPS.usa.forEach(option => {
      options.push({
        ...option,
        region: 'usa'
      });
    });
    
    // Add Europe timezones
    TIMEZONE_GROUPS.europe.forEach(option => {
      options.push({
        ...option,
        region: 'europe'
      });
    });
    
    // Add Asia timezones
    TIMEZONE_GROUPS.asia.forEach(option => {
      options.push({
        ...option,
        region: 'asia'
      });
    });
    
    return options;
  }, []);

  // Group options by region
  const groupedOptions = useMemo(() => {
    const groups: Record<string, TimezoneOption[]> = {
      usa: [],
      europe: [],
      asia: []
    };
    
    timezoneOptions.forEach(option => {
      groups[option.region].push(option);
    });
    
    return groups;
  }, [timezoneOptions]);

  // Get current timezone display info
  const currentTimezone = useMemo(() => {
    return timezoneOptions.find(option => option.value === value);
  }, [timezoneOptions, value]);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'usa':
        return '🇺🇸 North America';
      case 'europe':
        return '🇬🇧 Europe';
      case 'asia':
        return '🇯🇵 Asia';
      default:
        return category;
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="min-w-[200px]">
          <SelectValue placeholder="Select timezone...">
            {currentTimezone ? currentTimezone.label : 'Select timezone...'}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent className="max-h-[300px]">
          {Object.entries(groupedOptions).map(([category, options]) => {
            if (options.length === 0) return null;
            
            return (
              <SelectGroup key={category}>
                <SelectLabel>{getCategoryLabel(category)}</SelectLabel>
                {options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {option.abbreviation}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};
