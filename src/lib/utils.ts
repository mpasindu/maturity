/**
 * Utility functions for common formatting operations
 */

/**
 * Format a date consistently across client and server
 * Uses UTC to avoid timezone discrepancies during SSR hydration
 */
export function formatDate(date: string | Date): string {
  try {
    const d = new Date(date);
    // Use UTC methods to ensure consistency between server and client
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format a date with time consistently
 */
export function formatDateTime(date: string | Date): string {
  try {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Check if a value is a valid number
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Round a number to specified decimal places
 */
export function roundToDecimal(num: number, places: number = 2): number {
  const factor = Math.pow(10, places);
  return Math.round(num * factor) / factor;
}

/**
 * Clamp a number between min and max values
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}