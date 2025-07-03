import { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import {
  restrictToHorizontalAxis,
} from '@dnd-kit/modifiers';

export interface DragItem {
  id: string;
  title: string;
  emoji: string;
  color: string;
  position: number;
  enabled: boolean;
  hasConflict?: boolean;
}

export interface DragEndResult {
  itemId: string;
  oldPosition: number;
  newPosition: number;
  willQueue: boolean;
  queuedAfter?: string[];
}

interface DragAndDropConfig {
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: (result: DragEndResult) => void;
  snapToGrid?: boolean;
  gridSize?: number; // Width of one 15-minute block in pixels
}

export const useDragAndDrop = (config: DragAndDropConfig) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);

  // Configure sensors for different input methods
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      // Enable keyboard navigation for accessibility
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const draggedItem = active.data.current as DragItem;
    
    setActiveId(active.id as string);
    setActiveItem(draggedItem);
    
    config.onDragStart?.(draggedItem);
  }, [config]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    
    if (over) {
      // Extract position from droppable slot ID (format: "slot-{position}")
      const position = parseInt(over.id.toString().replace('slot-', ''), 10);
      setDragOverPosition(position);
    } else {
      setDragOverPosition(null);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && activeItem) {
      const newPosition = parseInt(over.id.toString().replace('slot-', ''), 10);
      const oldPosition = activeItem.position;
      
      if (newPosition !== oldPosition) {
        const result: DragEndResult = {
          itemId: active.id as string,
          oldPosition,
          newPosition,
          willQueue: false, // This will be calculated by the consumer
        };
        
        config.onDragEnd?.(result);
      }
    }
    
    // Reset drag state
    setActiveId(null);
    setActiveItem(null);
    setDragOverPosition(null);
  }, [activeItem, config]);

  const snapToGrid = useCallback((position: { x: number; y: number }) => {
    if (!config.snapToGrid || !config.gridSize) {
      return position;
    }
    
    const snappedX = Math.round(position.x / config.gridSize) * config.gridSize;
    return {
      x: snappedX,
      y: position.y, // Keep Y position unchanged
    };
  }, [config.snapToGrid, config.gridSize]);

  const isDragging = activeId !== null;
  
  const dndContextProps = {
    sensors,
    collisionDetection: closestCenter,
    modifiers: [restrictToHorizontalAxis],
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragEnd: handleDragEnd,
  };

  return {
    // State
    activeId,
    activeItem,
    isDragging,
    dragOverPosition,
    
    // Props for DndContext
    dndContextProps,
    
    // Helper functions
    snapToGrid,
    
    // Components (re-export for convenience)
    DndContext,
    DragOverlay,
  };
};