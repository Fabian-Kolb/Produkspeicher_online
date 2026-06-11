/**
 * Triggers a short vibration (haptic feedback) on supported mobile devices.
 * @param ms Duration of the vibration in milliseconds.
 */
export const triggerHaptic = (ms = 15) => {
  if (
    typeof window !== 'undefined' &&
    window.navigator &&
    typeof window.navigator.vibrate === 'function'
  ) {
    try {
      window.navigator.vibrate(ms);
    } catch (e) {
      // Silence errors (e.g. security policy blocks in some browsers)
    }
  }
};
