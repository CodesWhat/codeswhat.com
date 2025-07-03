# Visual Schedule Manager

A modern, drag-and-drop visual scheduler component for managing global sync schedules across multiple timezones. Built with React, TypeScript, and Tailwind CSS.

![Visual Schedule Manager Demo](./demo-screenshot.png)

## Features

### 🌍 Multi-Region Support
- Manage schedules for USA, Europe, and Asia regions
- Automatic timezone conversion and display
- Region-specific business hours overlay

### ✨ Intuitive Drag & Drop
- Drag to enable/disable sync jobs
- Drag to reschedule to different time slots
- Visual feedback during drag operations
- Collision detection for overlapping schedules

### 🤖 Smart Auto-Scheduling
- Intelligent optimization algorithm
- Avoids business hours automatically
- Maintains 1-hour spacing between syncs
- Prioritizes user syncs before project syncs

### 🎯 Additional Features
- Real-time timezone conversion
- Business hours visualization
- Stacking support for overlapping schedules
- Current time indicator
- Responsive design

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **date-fns** - Date utilities
- **Radix UI** - Accessible UI components

## Component Structure

```
visual-schedule-manager/
├── components/
│   ├── schedules/
│   │   ├── TimelineScheduler.tsx    # Main scheduler component
│   │   ├── TimelineGrid.tsx         # 24-hour grid with time slots
│   │   ├── TimelineTrack.tsx        # Container for draggable items
│   │   ├── DraggableJobBadge.tsx    # Draggable sync job badges
│   │   ├── TimezoneSelector.tsx     # Timezone picker
│   │   ├── AutoScheduleDialog.tsx   # Auto-scheduling interface
│   │   ├── BusinessHoursModal.tsx   # Business hours configuration
│   │   └── ...other components
│   └── ui/                          # Reusable UI components
├── utils/                           # Helper functions
├── stores/                          # State management
├── hooks/                           # Custom React hooks
└── assets/                          # Icons and images
```

## Integration

### Basic Usage

```tsx
import { TimelineScheduler } from './components/schedules/TimelineScheduler';
import { SchedulerErrorBoundary } from './components/schedules/SchedulerErrorBoundary';

function App() {
  return (
    <SchedulerErrorBoundary>
      <TimelineScheduler />
    </SchedulerErrorBoundary>
  );
}
```

### Required Assets

The component requires integration icons located in `/assets/integrations/`:
- `fyle_favicon.png` - Destination system icon
- `onelogin_favicon.png` - User sync source icon
- `sage_favicon.png` - Project sync source icon

### Styling Requirements

The component uses Tailwind CSS. Ensure your project includes:
1. Tailwind CSS configuration
2. The required color palette (especially gray scales)
3. Dark mode support (optional)

### State Management

The scheduler uses Zustand for state management. The store is self-contained and doesn't require external setup.

## API Integration

The portfolio version includes a mock API client that simulates backend responses. For production use, replace the mock API client with your actual implementation.

### Required API Endpoints

```typescript
interface API {
  getVisualSchedules(params: { timezone: string }): Promise<Schedule[]>
  updateVisualScheduleTime(id: number, data: { position: number; timezone: string }): Promise<Schedule>
  toggleVisualSchedule(id: number, enabled: boolean): Promise<Schedule>
  autoSchedule(params: { timezone: string }): Promise<Schedule[]>
}
```

## Schedule Data Structure

```typescript
interface Schedule {
  id: number;
  title: string;
  entity: 'usa' | 'europe' | 'asia';
  syncType: 'user_sync' | 'project_sync';
  position: number | null;  // Grid position (0-95 for 24 hours)
  enabled: boolean;
  startTimeUTC: string | null;
  duration: number;  // In minutes
}
```

## Customization

### Timeline Configuration
- Each hour = 4 grid blocks (15-minute intervals)
- Block width: 60px (configurable in `timeline-helpers.ts`)
- Track height adjusts based on stacked items

### Business Hours
- Default: 8 AM - 6 PM local time
- Configurable per region
- Visual overlay on timeline

### Styling
- Uses Tailwind utility classes
- Customizable through CSS variables
- Dark mode support included

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Considerations

- Efficient drag-and-drop with minimal re-renders
- Memoized timezone calculations
- Optimized for up to 50 schedules per region

## License

MIT License - feel free to use in your projects!

## Demo

View the live demo at: [your-portfolio-url.com/visual-schedule-manager](#)

---

Built with ❤️ for managing complex scheduling requirements across global teams. 