// src/utils/dashboardUtils.js
// Pure helpers for the dashboard (home) page. All "today" / "now" values come from the user's
// IANA timezone (see dateUtils), never from the browser's.

import { addDays, diffDays, sliceDate, timeToMinutes } from './dateUtils.js';

/**
 * A task shaped for the dashboard lists. `date` is the day the item is listed under: the task's
 * own date, or for a multi-day task the day it starts (or today, when listing running ones).
 */
export const taskToItem = (task, date) => ({
  id: `task-${task.id}`,
  taskId: task.id,
  seriesId: task.seriesId ?? null,
  title: task.title,
  type: task.type,
  timeType: task.timeType,
  priority: task.priority,
  isCompleted: Boolean(task.isCompleted),
  isCompletable: task.isCompletable !== false,
  isPinned: Boolean(task.isPinned),
  effectiveColor: task.effectiveColor || task.color || null,
  date: date !== undefined ? date : sliceDate(task.date) ?? sliceDate(task.rangeStartDate),
  startTime: task.startTime || null,
  endTime: task.endTime || null,
  rangeStartDate: sliceDate(task.rangeStartDate),
  rangeEndDate: sliceDate(task.rangeEndDate),
  originalTask: task,
});

/**
 * Items for the agenda: every dated task that falls in [todayStr, endStr]. A multi-day task is
 * listed once — on today when it is already running, otherwise on the day it starts.
 */
export const buildAgendaItems = (tasks, todayStr, endStr) => {
  const items = [];
  tasks.forEach((task) => {
    if (task.timeType === 'ANY_TIME') return;

    if (task.timeType === 'MULTI_DAY') {
      const start = sliceDate(task.rangeStartDate);
      const end = sliceDate(task.rangeEndDate);
      if (!start || !end || end < todayStr || start > endStr) return;
      items.push(taskToItem(task, start < todayStr ? todayStr : start));
      return;
    }

    const date = sliceDate(task.date);
    if (date && date >= todayStr && date <= endStr) items.push(taskToItem(task, date));
  });
  return items;
};

/** Minute of the day an item is anchored to: start time, or the due time of a deadline. */
export const getItemMinutes = (item) => {
  if (item.timeType === 'TIMED' || item.timeType === 'OPEN_ENDED') {
    return item.startTime ? timeToMinutes(item.startTime) : null;
  }
  if (item.timeType === 'DEADLINE') return item.endTime ? timeToMinutes(item.endTime) : null;
  return null;
};

/** Items without a clock time first (multi-day), then by time. */
export const sortByTime = (items) =>
  [...items].sort((a, b) => {
    const ma = getItemMinutes(a);
    const mb = getItemMinutes(b);
    if (ma === null && mb === null) return 0;
    if (ma === null) return -1;
    if (mb === null) return 1;
    return ma - mb;
  });

export const sortByDateThenTime = (items) =>
  [...items].sort((a, b) => {
    const dateA = a.date || '9999-99-99'; // undated items go last
    const dateB = b.date || '9999-99-99';
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return sortByTime([a, b])[0] === a ? (a === b ? 0 : -1) : 1;
  });

/**
 * Only TIMED and MULTI_DAY tasks count as "active":
 *   TIMED      today, between its start and end time
 *   MULTI_DAY  today lies inside its day range
 * Completed tasks are never active.
 */
export const isItemActive = (item, todayStr, nowMinutes) => {
  if (item.isCompleted) return false;

  if (item.timeType === 'MULTI_DAY') {
    return Boolean(item.rangeStartDate && item.rangeEndDate) &&
      item.rangeStartDate <= todayStr && todayStr <= item.rangeEndDate;
  }

  if (item.timeType === 'TIMED') {
    if (item.date !== todayStr || !item.startTime || !item.endTime) return false;
    const start = timeToMinutes(item.startTime);
    const end = timeToMinutes(item.endTime);
    return nowMinutes >= start && (end > start ? nowMinutes < end : true); // an end before the start runs to midnight
  }

  return false;
};

/** "Day 2 of 5" for a running multi-day task. */
export const getMultiDayProgress = (item, todayStr) => {
  const total = diffDays(item.rangeStartDate, item.rangeEndDate) + 1;
  const day = Math.min(total, Math.max(1, diffDays(item.rangeStartDate, todayStr) + 1));
  return { day, total, daysLeft: total - day };
};

/** The next not-yet-started item of today (timed start or deadline due time). */
export const findNextToday = (todayItems, nowMinutes) =>
  sortByTime(
    todayItems.filter((item) => {
      if (item.isCompleted) return false;
      const minutes = getItemMinutes(item);
      return minutes !== null && minutes > nowMinutes;
    })
  )[0];

export const formatDateLabel = (dateStr, todayStr) => {
  if (!dateStr) return '';
  if (dateStr === todayStr) return 'Today';
  if (dateStr === addDays(todayStr, 1)) return 'Tomorrow';
  return dateStr;
};

/** Groups dated items by day: [{ date, items }], ascending. Undated items are skipped. */
export const groupItemsByDate = (items) => {
  const groups = new Map();
  items.forEach((item) => {
    if (!item.date) return;
    if (!groups.has(item.date)) groups.set(item.date, []);
    groups.get(item.date).push(item);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, groupItems]) => ({ date, items: sortByTime(groupItems) }));
};

/** "Today · Tuesday 2026-10-06", "Wednesday 2026-10-07" */
export const formatDayHeading = (dateStr, todayStr) => {
  const weekday = new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    timeZone: 'UTC',
  });
  const prefix =
    dateStr === todayStr ? 'Today · ' : dateStr === addDays(todayStr, 1) ? 'Tomorrow · ' : '';
  return `${prefix}${weekday} ${dateStr}`;
};
