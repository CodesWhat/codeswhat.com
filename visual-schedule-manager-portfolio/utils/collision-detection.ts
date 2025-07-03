export interface TimeSlot {
  id: string;
  position: number;
  duration: number; // in 15-minute blocks (usually 1)
}

export const checkCollision = (
  newPosition: number,
  duration: number,
  existingSlots: TimeSlot[],
  excludeId?: string
): boolean => {
  // Check if the new position overlaps with existing slots
  const newEndPosition = newPosition + duration - 1;
  
  return existingSlots.some(slot => {
    if (excludeId && slot.id === excludeId) {
      return false; // Exclude the item being dragged
    }
    
    const slotEndPosition = slot.position + slot.duration - 1;
    
    // Check for overlap: new slot starts before existing slot ends
    // and existing slot starts before new slot ends
    return (
      newPosition <= slotEndPosition && 
      slot.position <= newEndPosition
    );
  });
};

export const findNextAvailableSlot = (
  startPosition: number,
  duration: number,
  existingSlots: TimeSlot[]
): number => {
  // Find the next available position after startPosition
  let currentPosition = startPosition;
  const maxPosition = 96 - duration; // 96 total blocks minus duration
  
  while (currentPosition <= maxPosition) {
    if (!checkCollision(currentPosition, duration, existingSlots)) {
      return currentPosition;
    }
    currentPosition++;
  }
  
  // If no slot available after start position, try from beginning
  currentPosition = 0;
  while (currentPosition < startPosition) {
    if (!checkCollision(currentPosition, duration, existingSlots)) {
      return currentPosition;
    }
    currentPosition++;
  }
  
  // Return the original position if no available slot found
  return startPosition;
};

export const getQueueInfo = (
  position: number,
  existingSlots: TimeSlot[]
): { willQueue: boolean; queuedAfter?: string[] } => {
  // Determine if this position will cause queuing
  const conflictingSlots = existingSlots.filter(slot => {
    const slotEndPosition = slot.position + slot.duration - 1;
    return position >= slot.position && position <= slotEndPosition;
  });
  
  if (conflictingSlots.length === 0) {
    return { willQueue: false };
  }
  
  // Sort conflicting slots by position to determine queue order
  const sortedConflicts = conflictingSlots.sort((a, b) => a.position - b.position);
  
  return {
    willQueue: true,
    queuedAfter: sortedConflicts.map(slot => slot.id)
  };
};

export const calculateEstimatedStartTime = (
  position: number,
  duration: number,
  existingSlots: TimeSlot[]
): number => {
  // Calculate when the job will actually start considering queue
  const queueInfo = getQueueInfo(position, existingSlots);
  
  if (!queueInfo.willQueue) {
    return position;
  }
  
  // Find the latest end time of conflicting slots
  const conflictingSlots = existingSlots.filter(slot => 
    queueInfo.queuedAfter?.includes(slot.id)
  );
  
  if (conflictingSlots.length === 0) {
    return position;
  }
  
  const latestEndTime = Math.max(
    ...conflictingSlots.map(slot => slot.position + slot.duration)
  );
  
  return latestEndTime;
};