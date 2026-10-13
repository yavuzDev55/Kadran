// src/shared/utils/dateUtils.js
// Date helpers. Calendar dates are handled as 'YYYY-MM-DD' strings and computed
// in UTC, so results never depend on the server's local timezone.

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

/**
 * Returns today's date as 'YYYY-MM-DD' in the given IANA timezone.
 * Falls back to UTC if the timezone is invalid.
 */
export const todayInTimezone = (tz = 'UTC') => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

/**
 * Validates an IANA timezone string.
 */
export const isValidTimezone = (tz) => {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

/** True for a real calendar date written as 'YYYY-MM-DD' (rejects 2026-02-31). */
export const isValidDateStr = (value) => {
  if (typeof value !== 'string' || !DATE_REGEX.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

/** True for 'HH:MM' (24-hour). */
export const isValidTimeStr = (value) => typeof value === 'string' && TIME_REGEX.test(value);

export const timeToMinutes = (value) => {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
};

/** 'YYYY-MM-DD' -> Date at UTC midnight (no timezone shift). */
export const parseUTCDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

/** Date -> 'YYYY-MM-DD' (UTC). */
export const toDateStr = (date) => date.toISOString().slice(0, 10);

export const addDaysStr = (dateStr, days) => {
  const date = parseUTCDate(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateStr(date);
};

/** Adds whole years; Feb 29 clamps to the last day of February in non-leap years. */
export const addYearsStr = (dateStr, years) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y + years, m, 0)).getUTCDate();
  return toDateStr(new Date(Date.UTC(y + years, m - 1, Math.min(d, lastDay))));
};

export const dateDiffInDays = (startStr, endStr) =>
  Math.round((parseUTCDate(endStr).getTime() - parseUTCDate(startStr).getTime()) / 86400000);

/** 'MONDAY'..'SUNDAY' for a 'YYYY-MM-DD' string. */
export const getDayName = (dateStr) => DAY_NAMES[parseUTCDate(dateStr).getUTCDay()];
