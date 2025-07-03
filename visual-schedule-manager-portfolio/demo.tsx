'use client';

import React from 'react';
import { TimelineScheduler } from './components/schedules/TimelineScheduler';
import { SchedulerErrorBoundary } from './components/schedules/SchedulerErrorBoundary';

export default function VisualScheduleManagerDemo() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Visual Schedule Manager
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Drag-and-drop interface for managing global sync schedules across timezones
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🌍</span>
              <h3 className="font-semibold">Multi-Region Support</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage schedules for USA, Europe, and Asia with automatic timezone conversion
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">✨</span>
              <h3 className="font-semibold">Drag & Drop</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Intuitive interface to enable, disable, and reschedule sync jobs
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🤖</span>
              <h3 className="font-semibold">Auto-Schedule</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Intelligent optimization to avoid business hours and prevent conflicts
            </p>
          </div>
        </div>

        {/* Main scheduler component */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <SchedulerErrorBoundary>
            <TimelineScheduler />
          </SchedulerErrorBoundary>
        </div>

        {/* Demo instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Demo Instructions
          </h2>
          <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
            <li>• Drag sync jobs from the disabled area onto the timeline to schedule them</li>
            <li>• Drag scheduled jobs back to the disabled area to disable them</li>
            <li>• Drag scheduled jobs to different time slots to reschedule</li>
            <li>• Use the timezone selector to view schedules in different timezones</li>
            <li>• Click "Auto-Schedule" to optimize all sync timings automatically</li>
            <li>• Toggle "Business Hours" to see work hours overlay for each region</li>
          </ul>
        </div>

        {/* Technical details */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Built with React, TypeScript, Tailwind CSS, and Framer Motion</p>
          <p className="mt-1">Features: Drag & Drop, Timezone Management, Collision Detection, Auto-scheduling</p>
        </div>
      </div>
    </div>
  );
} 