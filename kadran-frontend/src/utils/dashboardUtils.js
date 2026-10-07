// src/utils/dashboardUtils.js
// Pure helpers for the dashboard (home) page. All "today" / "now" values are
// computed in the user's IANA timezone, never the browser's.

const OPEN_ENDED_FALLBACK_MINUTES = 60;

export const timeToMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/** 'YYYY-MM-DD' for the given instant, in the given timezone. */
export const getTodayInTimezone = (timeZone, date = new Date()) => {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
};

/** Minutes since local midnight, in the given timezone. */
export const getNowMinutesInTimezone = (timeZone, date = new Date()) => {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const hour = Number(parts.find((p) => p.type === "hour").value) % 24;
    const minute = Number(parts.find((p) => p.type === "minute").value);
    return hour * 60 + minute;
  } catch {
    return date.getHours() * 60 + date.getMinutes();
  }
};

export const addDaysToDateStr = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const formatDateLabel = (dateStr, todayStr) => {
  if (!dateStr) return "";
  if (dateStr === todayStr) return "Today";
  if (dateStr === addDaysToDateStr(todayStr, 1)) return "Tomorrow";
  return dateStr;
};

/**
 * Wraps a raw backend task (no calendar occurrence) in the same shape that
 * normalizeTasksToEvents produces, so panels can render both with one component.
 * Used for ANYTIME and pinned tasks.
 */
export const taskToItem = (task) => ({
  id: `task-${task.id}`,
  taskId: task.id,
  title: task.title,
  type: task.type,
  timeType: task.timeType,
  priority: task.priority,
  isCompleted: task.isCompleted || false,
  isCompletable: task.isCompletable !== false,
  isPinned: task.isPinned || false,
  effectiveColor: task.effectiveColor || task.color || null,
  // DATE_RANGE tasks have no `date`; use the range start so they sort and label sensibly
  date: (task.date || task.rangeStartDate)?.slice(0, 10) ?? null,
  startTime: task.startTime || null,
  endTime: task.endTime || null,
  rangeEndDate: task.rangeEndDate ? task.rangeEndDate.slice(0, 10) : null,
  originalTask: task,
});

/** All-day / untimed items first, then by start time. */
export const sortByTime = (items) =>
  [...items].sort((a, b) => {
    if (!a.startTime && !b.startTime) return 0;
    if (!a.startTime) return -1;
    if (!b.startTime) return 1;
    return a.startTime.localeCompare(b.startTime);
  });

export const sortByDateThenTime = (items) =>
  [...items].sort((a, b) => {
    const dateA = a.date || "9999-99-99"; // undated items go last
    const dateB = b.date || "9999-99-99";
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return (a.startTime || "").localeCompare(b.startTime || "");
  });

/** Start/end of an event in minutes since midnight; end is null when open-ended. */
export const getEventWindow = (event) => {
  if (!event.startTime) return null;
  const start = timeToMinutes(event.startTime);
  if (event.timeType === "TIMED" && event.endTime) {
    let end = timeToMinutes(event.endTime);
    if (end <= start) end += 24 * 60; // crosses midnight
    return { start, end };
  }
  return { start, end: null };
};

export const isEventActive = (event, nowMinutes) => {
  if (event.isCompleted) return false;
  if (event.timeType !== "TIMED" && event.timeType !== "TIMED_OPEN") return false;

  const window = getEventWindow(event);
  if (!window || nowMinutes < window.start) return false;

  if (window.end !== null) return nowMinutes < window.end;

  // TIMED_OPEN: stays active until completed. If it cannot be completed,
  // fall back to a fixed window so it does not stay "active" all day.
  if (event.isCompletable !== false) return true;
  return nowMinutes < window.start + OPEN_ENDED_FALLBACK_MINUTES;
};

/**
 * DATE_RANGE tasks that started before `todayStr` and are still running.
 * normalizeTasksToEvents only places a range on its start date, so without this
 * a multi-day task disappears from the dashboard after its first day.
 * Returned items are dated today so they sort and group with today's items.
 */
export const getOngoingRangeItems = (tasks, todayStr) =>
  tasks
    .filter((t) => t.timeType === "DATE_RANGE" && !t.isRecurring && t.rangeStartDate && t.rangeEndDate)
    .filter((t) => t.rangeStartDate.slice(0, 10) < todayStr && t.rangeEndDate.slice(0, 10) >= todayStr)
    .map((t) => ({ ...taskToItem(t), date: todayStr }));

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
  const weekday = new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
  const prefix = dateStr === todayStr ? "Today · " : dateStr === addDaysToDateStr(todayStr, 1) ? "Tomorrow · " : "";
  return `${prefix}${weekday} ${dateStr}`;
};
