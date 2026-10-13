// src/utils/formatTime.js
// Centralized time display formatting, driven by the user's timeFormat preference.

import { sliceDate } from './dateUtils.js';

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

/**
 * "2026-10-12" or "2026-10-12 → 2026-10-15" for a multi-day task (one day long = one date).
 * Accepts a raw task (ISO timestamps) or a dashboard/calendar item.
 */
export const formatDateRange = (task) => {
  const start = sliceDate(task.rangeStartDate);
  const end = sliceDate(task.rangeEndDate);
  if (!start && !end) return '';
  if (!end || start === end) return start || end;
  return `${start} → ${end}`;
};

/**
 * The time part of a task as one short string, per time type:
 *   TIMED       "14:00 – 15:30"
 *   OPEN_ENDED  "From 14:00"
 *   DEADLINE    "Due 23:59"
 *   MULTI_DAY   "2026-10-12 → 2026-10-15" (or a single date)
 *   ANY_TIME    "Any time"
 * Dates of single-day tasks are not included; callers show them separately.
 */
export const formatTaskTime = (task, timeFormat = 'H24') => {
  switch (task.timeType) {
    case 'TIMED':
      return task.startTime && task.endTime
        ? `${formatTime(task.startTime, timeFormat)} – ${formatTime(task.endTime, timeFormat)}`
        : '';
    case 'OPEN_ENDED':
      return task.startTime ? `From ${formatTime(task.startTime, timeFormat)}` : '';
    case 'DEADLINE':
      return task.endTime ? `Due ${formatTime(task.endTime, timeFormat)}` : 'Deadline';
    case 'MULTI_DAY':
      return formatDateRange(task);
    case 'ANY_TIME':
      return 'Any time';
    default:
      return '';
  }
};

/** The clock part of a calendar label: "09:00", "09:00 →" (open-ended), "⚑ 23:59" (deadline). */
export const formatEventTimeLabel = (event, timeFormat = 'H24') => {
  if (event.timeType === 'DEADLINE') return event.endTime ? `⚑ ${formatTime(event.endTime, timeFormat)}` : '⚑';
  if (event.timeType === 'OPEN_ENDED') return event.startTime ? `${formatTime(event.startTime, timeFormat)} →` : '';
  return event.startTime ? formatTime(event.startTime, timeFormat) : '';
};
