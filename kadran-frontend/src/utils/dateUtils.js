// src/utils/dateUtils.js
// Calendar dates are 'YYYY-MM-DD' strings and are computed in UTC, so nothing here depends on
// the browser's timezone. "Today" is always derived from the user's own IANA timezone setting.

export const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const parseDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export const formatDate = (date) => date.toISOString().slice(0, 10);

/** The 'YYYY-MM-DD' part of an ISO timestamp (or null). */
export const sliceDate = (value) => (value ? String(value).slice(0, 10) : null);

export const addDays = (dateStr, days) => {
  const date = parseDate(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
};

/** Adds whole years; Feb 29 clamps to the last day of February. */
export const addYears = (dateStr, years) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y + years, m, 0)).getUTCDate();
  return formatDate(new Date(Date.UTC(y + years, m - 1, Math.min(d, lastDay))));
};

/** Moves to the same day in another month (clamped to that month's last day). */
export const shiftMonth = (dateStr, delta) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + delta, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return formatDate(target);
};

export const diffDays = (startStr, endStr) =>
  Math.round((parseDate(endStr).getTime() - parseDate(startStr).getTime()) / 86400000);

export const getDayName = (dateStr) => DAY_NAMES[parseDate(dateStr).getUTCDay()];

export const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** 'YYYY-MM-DD' for the given instant, in the given timezone. */
export const getTodayInTimezone = (timeZone, date = new Date()) => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
};

/** Minutes since local midnight, in the given timezone. */
export const getNowMinutesInTimezone = (timeZone, date = new Date()) => {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const hour = Number(parts.find((p) => p.type === 'hour').value) % 24;
    const minute = Number(parts.find((p) => p.type === 'minute').value);
    return hour * 60 + minute;
  } catch {
    return date.getHours() * 60 + date.getMinutes();
  }
};

/** First day of the week containing `dateStr`, honouring the weekStartsOn preference. */
export const startOfWeek = (dateStr, weekStartsOn = 'MONDAY') => {
  const dow = parseDate(dateStr).getUTCDay(); // 0 = Sunday
  const offset = weekStartsOn === 'SUNDAY' ? dow : dow === 0 ? 6 : dow - 1;
  return addDays(dateStr, -offset);
};

/** 7 consecutive dates starting at `startStr`. */
export const getWeekDaysArray = (startStr) => Array.from({ length: 7 }, (_, i) => addDays(startStr, i));

/** 42 dates (6 weeks) for a month grid whose first row starts on weekStartsOn. */
export const getMonthDaysArray = (year, monthIndex, weekStartsOn = 'MONDAY') => {
  const first = formatDate(new Date(Date.UTC(year, monthIndex, 1)));
  const gridStart = startOfWeek(first, weekStartsOn);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
};

/** 3-letter day labels in the order matching weekStartsOn. */
export const getWeekDayLabels = (weekStartsOn = 'MONDAY') => {
  const mondayFirst = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return weekStartsOn === 'SUNDAY' ? ['Sun', ...mondayFirst.slice(0, 6)] : mondayFirst;
};
