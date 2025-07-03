# Drag & Drop System for Visual Scheduler

This directory contains the drag-and-drop functionality for the visual scheduler, built by Agent B. The system provides horizontal-only dragging with grid snapping, collision detection, and queue warnings.

## Components

### `DraggableJobBadge.tsx`
The main draggable component representing sync jobs.

```typescript
interface DraggableJobBadgeProps {
  id: string;
  title: string;
  emoji: string;
  color: string; // Tailwind color class (e.g., 'bg-blue-500')
  enabled: boolean;
  position: number; // 0-95 (15-minute blocks)
  hasConflict?: boolean;
}
```

**Usage:**
```tsx
<DraggableJobBadge
  id="usa-projects"
  title="USA Projects"
  emoji="🇺🇸"
  color="bg-blue-500"
  enabled={true}
  position={8} // 02:00 AM
  hasConflict={false}
/>
```

**Visual States:**
- **Normal**: Full opacity with move cursor
- **Dragging**: 50% opacity with scale transformation
- **Disabled**: Gray background, no cursor interaction
- **Conflict**: Orange border with warning indicator

### `DroppableTimeSlot.tsx`
Individual drop zones for 15-minute time blocks.

```typescript
interface DroppableTimeSlotProps {
  slotId: string;
  position: number; // 0-95
  isOccupied: boolean;
}
```

**TimelineDropZones Component:**
Renders all 96 drop zones for a complete timeline.

```tsx
<TimelineDropZones
  occupiedPositions={new Set([8, 16, 24])}
  className="absolute inset-0"
/>
```

**Visual Feedback:**
- **Available slot**: Green background on drag over
- **Occupied slot**: Orange background on drag over (queue warning)

### `DragPreview.tsx`
Custom drag preview components for enhanced UX.

**SimpleDragPreview**: Basic preview for DragOverlay
```tsx
<DragOverlay>
  {activeItem ? <SimpleDragPreview item={activeItem} /> : null}
</DragOverlay>
```

**EnhancedDragPreview**: Advanced preview with queue information
```tsx
<EnhancedDragPreview
  item={activeItem}
  showTimePreview={true}
  previewPosition={dragOverPosition}
  willQueue={hasConflict}
  queuedAfter={conflictingJobs}
  estimatedStartTime={actualStartTime}
/>
```

## Hook: `useDragAndDrop`

The main hook that provides drag-and-drop functionality using @dnd-kit.

```typescript
const {
  dndContextProps,
  activeItem,
  activeId,
  isDragging,
  dragOverPosition,
  DndContext,
  DragOverlay,
} = useDragAndDrop({
  onDragStart: (item) => console.log('Started dragging:', item),
  onDragEnd: (result) => handleDragEnd(result),
  snapToGrid: true,
  gridSize: 20, // pixels
});
```

**DragEndResult Interface:**
```typescript
interface DragEndResult {
  itemId: string;
  oldPosition: number;
  newPosition: number;
  willQueue: boolean;
  queuedAfter?: string[];
}
```

## Collision Detection Utilities

### `checkCollision()`
```typescript
checkCollision(
  newPosition: number,
  duration: number,
  existingSlots: TimeSlot[],
  excludeId?: string
): boolean
```

### `getQueueInfo()`
```typescript
getQueueInfo(
  position: number,
  existingSlots: TimeSlot[]
): { willQueue: boolean; queuedAfter?: string[] }
```

### `findNextAvailableSlot()`
```typescript
findNextAvailableSlot(
  startPosition: number,
  duration: number,
  existingSlots: TimeSlot[]
): number
```

### `calculateEstimatedStartTime()`
```typescript
calculateEstimatedStartTime(
  position: number,
  duration: number,
  existingSlots: TimeSlot[]
): number
```

## Integration Example

```tsx
'use client';
import React, { useState } from 'react';
import {
  useDragAndDrop,
  DraggableJobBadge,
  TimelineDropZones,
  SimpleDragPreview,
  checkCollision,
  getQueueInfo,
  type DragEndResult,
  type TimeSlot,
} from '@/components/settings/schedules';

export default function ScheduleTimeline() {
  const [jobs, setJobs] = useState([
    { id: '1', title: 'USA Projects', emoji: '🇺🇸', position: 8, enabled: true },
    { id: '2', title: 'ADGM Users', emoji: '🇦🇪', position: 16, enabled: true },
  ]);

  const handleDragEnd = (result: DragEndResult) => {
    setJobs(prev => prev.map(job => 
      job.id === result.itemId 
        ? { ...job, position: result.newPosition }
        : job
    ));
  };

  const { dndContextProps, activeItem, DndContext, DragOverlay } = useDragAndDrop({
    onDragEnd: handleDragEnd,
    snapToGrid: true,
    gridSize: 20,
  });

  const occupiedPositions = new Set(jobs.map(job => job.position));

  return (
    <DndContext {...dndContextProps}>
      <div className="relative h-32 bg-gray-50">
        <TimelineDropZones
          occupiedPositions={occupiedPositions}
        />
        
        {jobs.map(job => (
          <DraggableJobBadge
            key={job.id}
            id={job.id}
            title={job.title}
            emoji={job.emoji}
            color="bg-blue-500"
            enabled={job.enabled}
            position={job.position}
          />
        ))}
      </div>
      
      <DragOverlay>
        {activeItem ? <SimpleDragPreview item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

## Position System

The system uses a 96-block timeline representing 24 hours:
- **Position 0**: 00:00 (midnight)
- **Position 4**: 01:00
- **Position 8**: 02:00
- **Position 95**: 23:45

Each position represents a 15-minute block.

## Dependencies

- `@dnd-kit/core`: Core drag-and-drop functionality
- `@dnd-kit/modifiers`: Horizontal axis restriction
- `@dnd-kit/utilities`: Additional utilities

## Test Page

Access the test harness at: `/settings/schedules/test-dnd`

The test page includes:
- Sample draggable job badges
- Visual timeline with grid lines
- Drop zone feedback
- Collision detection logging
- Real-time position updates

## Integration Points

This system is designed to integrate with:
- **Agent A**: Timeline grid components
- **Agent C**: Timezone state management  
- **Agent D**: Backend API for persistence
- **Agent E**: Main scheduler container

The drag-and-drop system is framework-agnostic and can be easily integrated into any timeline layout provided by Agent A.