/**
 * Triggers subtle vibration feedback on supporting mobile devices.
 * Completely safe fallback if vibration API is not supported or permission denied.
 */
export function hapticFeedback(type: 'light' | 'medium' | 'success' = 'light') {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      if (type === 'light') {
        navigator.vibrate(8);
      } else if (type === 'medium') {
        navigator.vibrate(18);
      } else if (type === 'success') {
        navigator.vibrate([10, 40, 15]);
      }
    } catch {
      // Ignored if device does not permit vibration
    }
  }
}
