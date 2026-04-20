import { useState } from 'react';
import type { TouchEvent } from 'react';

interface SwipeInput {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
}

/**
 * A custom hook to detect horizontal swipe gestures on mobile devices.
 * 
 * @param onSwipeLeft - Triggered when swiping from right to left (Next)
 * @param onSwipeRight - Triggered when swiping from left to right (Prev)
 * @param minSwipeDistance - Threshold in pixels to trigger the swipe
 */
export const useSwipe = ({ onSwipeLeft, onSwipeRight, minSwipeDistance = 70 }: SwipeInput) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);

  const onTouchStart = (e: TouchEvent) => {
    // Reset states
    setTouchEnd(null);
    setTouchEndY(null);
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const onTouchEnd = (e: any) => {
    if (!touchStart || !touchEnd || !touchStartY || !touchEndY) return;
    
    // Check if the target is a scrollable element that should handle the touch itself
    const target = e.target as HTMLElement;
    if (target.closest('.no-scrollbar') || target.closest('input') || target.closest('select')) {
      return;
    }

    const distanceX = touchStart - touchEnd;
    const distanceY = touchStartY - touchEndY;
    
    // Swipe must be primarily horizontal and exceed the distance threshold
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY) * 1.5; // Stricter horizontal check
    
    if (isHorizontalSwipe && Math.abs(distanceX) > minSwipeDistance) {
      if (distanceX > 0) {
        // Swipe Left (Gesture towards left) -> Next
        onSwipeLeft?.();
      } else {
        // Swipe Right (Gesture towards right) -> Previous
        onSwipeRight?.();
      }
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};
