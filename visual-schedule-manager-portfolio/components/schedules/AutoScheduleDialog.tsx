'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Clock, CheckCircle, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '../../lib/api/client';
import Image from 'next/image';

interface AutoScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProposedSchedule {
  id: string;
  title: string;
  emoji: string;
  entity: 'usa' | 'europe' | 'asia';
  syncType: 'project' | 'user';
  currentTime?: string;
  proposedTime: string;
  localTime: string;
  reason: string;
}

export function AutoScheduleDialog({ open, onOpenChange }: AutoScheduleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [proposedSchedules, setProposedSchedules] = useState<ProposedSchedule[]>([]);
  const [step, setStep] = useState<'preview' | 'generating' | 'success'>('preview');
  const [hasGenerated, setHasGenerated] = useState(false);

  // Generate proposed schedules when dialog opens
  React.useEffect(() => {
    if (open && step === 'preview' && !hasGenerated && !isLoading) {
      generateProposedSchedules();
    }
  }, [open, step, hasGenerated, isLoading]);

  const generateProposedSchedules = async () => {
    if (isLoading) return; // Prevent concurrent calls
    
    setIsLoading(true);
    setStep('generating');
    setHasGenerated(true);
    
    // Simulate delay for mock
    setTimeout(() => {
      // Mock proposals for each region
      const mockProposals: ProposedSchedule[] = [
        // North America
        {
          id: '-1001',
          title: 'User Sync',
          emoji: '👤',
          entity: 'usa',
          syncType: 'user',
          proposedTime: '2:00 AM EST',
          localTime: '2:00 AM',
          reason: 'Scheduled during off-peak hours to avoid business operations'
        },
        {
          id: '-1002',
          title: 'Project Sync',
          emoji: '📁',
          entity: 'usa',
          syncType: 'project',
          proposedTime: '3:00 AM EST',
          localTime: '3:00 AM',
          reason: 'Runs after user sync to ensure user data is current'
        },
        // Europe
        {
          id: '-2001',
          title: 'User Sync',
          emoji: '👤',
          entity: 'europe',
          syncType: 'user',
          proposedTime: '2:00 AM GMT',
          localTime: '2:00 AM',
          reason: 'Scheduled during off-peak hours to avoid business operations'
        },
        {
          id: '-2002',
          title: 'Project Sync',
          emoji: '📁',
          entity: 'europe',
          syncType: 'project',
          proposedTime: '3:00 AM GMT',
          localTime: '3:00 AM',
          reason: 'Runs after user sync to ensure user data is current'
        },
        // Asia
        {
          id: '-3001',
          title: 'User Sync',
          emoji: '👤',
          entity: 'asia',
          syncType: 'user',
          proposedTime: '2:00 AM JST',
          localTime: '2:00 AM',
          reason: 'Scheduled during off-peak hours to avoid business operations'
        },
        {
          id: '-3002',
          title: 'Project Sync',
          emoji: '📁',
          entity: 'asia',
          syncType: 'project',
          proposedTime: '3:00 AM JST',
          localTime: '3:00 AM',
          reason: 'Runs after user sync to ensure user data is current'
        }
      ];
      
      setProposedSchedules(mockProposals);
      setStep('preview');
      setIsLoading(false);
    }, 1500);
  };

  const handleApplySchedule = async () => {
    setIsLoading(true);
    
    // Mock apply - just show success
    setTimeout(() => {
      setStep('success');
      toast.success(`Applied auto-schedule for ${proposedSchedules.length} syncs`);
      
      // Close dialog after success
      setTimeout(() => {
        onOpenChange(false);
        setStep('preview');
        setProposedSchedules([]);
        setHasGenerated(false);
      }, 2000);
      
      setIsLoading(false);
    }, 1000);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setStep('preview');
    setProposedSchedules([]);
    setHasGenerated(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Auto-Schedule Optimization
          </DialogTitle>
          <DialogDescription>
            Automatically optimize your sync schedules to run during off-peak hours with minimal conflicts.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">Generating Optimal Schedule...</h3>
              <p className="text-gray-600 text-center max-w-md">
                Analyzing your sync requirements and optimizing timing to minimize conflicts 
                and avoid business hours.
              </p>
            </motion.div>
          )}

          {step === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Schedule Optimization Rules
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                      <li>• User syncs scheduled before project syncs</li>
                      <li>• All syncs start at 2:00 AM local time</li>
                      <li>• 1-hour spacing between syncs to prevent conflicts</li>
                      <li>• Avoids business hours</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Proposed Schedule Changes</h4>
                
                {proposedSchedules.map((schedule, index) => {
                  const sourceIcon = schedule.syncType === 'user' 
                    ? '../../assets/integrations/onelogin_favicon.png' 
                    : '../../assets/integrations/sage_favicon.png';
                  
                  return (
                    <motion.div
                      key={schedule.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {schedule.entity === 'usa' && '🇺🇸'}
                            {schedule.entity === 'europe' && '🇬🇧'}
                            {schedule.entity === 'asia' && '🇯🇵'}
                          </span>
                          
                          <div className="flex items-center gap-2 bg-gray-100 rounded-md px-3 py-2">
                            <div className="relative w-4 h-4 flex-shrink-0">
                              <Image 
                                src={sourceIcon} 
                                alt="Source" 
                                fill
                                sizes="16px"
                                className="object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                            
                            <ArrowRight className="h-3 w-3 flex-shrink-0 text-gray-700" />
                            
                            <div className="relative w-4 h-4 flex-shrink-0">
                              <Image 
                                src="../../assets/integrations/fyle_favicon.png" 
                                alt="Fyle" 
                                fill
                                sizes="16px"
                                className="object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                            
                            <span className="font-medium text-sm">{schedule.title}</span>
                          </div>
                          
                          <Badge variant="outline" className="text-xs">
                            {schedule.entity === 'usa' && 'North America'}
                            {schedule.entity === 'europe' && 'Europe'}
                            {schedule.entity === 'asia' && 'Asia'}
                          </Badge>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            {schedule.localTime}
                          </div>
                          <div className="text-xs text-gray-500">
                            {schedule.proposedTime}
                          </div>
                        </div>
                      </div>
                      
                      {schedule.currentTime && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>Current: {schedule.currentTime}</span>
                          <span>→</span>
                          <span className="text-green-600">New: {schedule.proposedTime}</span>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-600">{schedule.reason}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">Schedule Applied Successfully!</h3>
              <p className="text-gray-600 text-center">
                Your sync schedules have been optimized and updated.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter>
          {step === 'preview' && (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApplySchedule}
                disabled={isLoading || proposedSchedules.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  `Apply Schedule (${proposedSchedules.length} syncs)`
                )}
              </Button>
            </>
          )}
          
          {step === 'generating' && (
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}