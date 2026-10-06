// src/utils/formatTime.js
// Centralized time display formatting, driven by the user's timeFormat preference.

/**
 * Formats a "HH:MM" string according to the given format.
 * H24 (default): returns as-is ("14:30").
 * H12: converts to 12-hour clock with AM/PM ("2:30 PM").
 */
export const formatTime = (time, format = 'H24') => {
  if (!time) return '';
  if (format !== 'H12') return time;

  const [hStr, m] = time.split(':');
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${period}`;
};

/**
 * Formats an integer hour (0-23) for grid row labels.
 * H24: "14:00". H12: "2 PM".
 */
export const formatHourLabel = (hour, format = 'H24') => {
  if (format !== 'H12') return `${hour}:00`;

  const period = hour >= 12 ? 'PM' : 'AM';
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${h} ${period}`;
};