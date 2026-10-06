// src/shared/utils/dateUtils.js

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