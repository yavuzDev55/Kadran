// src/features/recurring/recurring.service.js
// A recurring task is stored as a *series*: one TaskSeries row (the rule) plus one real
// Task row per occurrence. This module turns a rule into the list of occurrence dates.
// All calculations are string/UTC based and never depend on the server timezone.

import { addDaysStr, addYearsStr, getDayName, parseUTCDate, toDateStr } from '../../shared/utils/dateUtils.js';

// A series may not be longer than this many years (counted from its start date).
export const MAX_SERIES_YEARS = 1;

// Hard safety net: a daily series over the maximum span is 366 occurrences.
const MAX_OCCURRENCES = 400;

/** Last allowed end date for a series that starts on `startDate`. */
export const maxSeriesEnd = (startDate) => addYearsStr(startDate, MAX_SERIES_YEARS);

// Target date of a monthly rule inside one month.
//   monthDay 1..31 -> that day, clamped to the month's last day (31 -> 30 / 28 / 29)
//   monthDay -1    -> last day of the month
const getMonthlyDate = (year, month, monthDay) => {
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = monthDay === -1 ? lastDayOfMonth : Math.min(monthDay, lastDayOfMonth);
  return toDateStr(new Date(Date.UTC(year, month, day)));
};

/**
 * @param {object} rule
 * @param {'DAILY'|'WEEKLY'|'MONTHLY'} rule.pattern
 * @param {string} rule.startDate 'YYYY-MM-DD'
 * @param {string} rule.endDate   'YYYY-MM-DD' (inclusive)
 * @param {string[]} [rule.weekDays] WEEKLY only, e.g. ['MONDAY', 'WEDNESDAY']
 * @param {number} [rule.monthDay]   MONTHLY only, 1..31 or -1 (last day)
 * @returns {string[]} ascending 'YYYY-MM-DD' dates
 */
export const generateOccurrenceDates = ({ pattern, startDate, endDate, weekDays = [], monthDay }) => {
  if (endDate < startDate) return [];

  const dates = [];

  if (pattern === 'MONTHLY') {
    const start = parseUTCDate(startDate);
    let year = start.getUTCFullYear();
    let month = start.getUTCMonth();
    const end = parseUTCDate(endDate);
    const endYear = end.getUTCFullYear();
    const endMonth = end.getUTCMonth();

    while ((year < endYear || (year === endYear && month <= endMonth)) && dates.length < MAX_OCCURRENCES) {
      const candidate = getMonthlyDate(year, month, monthDay);
      if (candidate >= startDate && candidate <= endDate) dates.push(candidate);
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
    return dates;
  }

  const wanted = new Set(weekDays.map((d) => d.trim().toUpperCase()));
  let current = startDate;
  while (current <= endDate && dates.length < MAX_OCCURRENCES) {
    if (pattern === 'DAILY' || wanted.has(getDayName(current))) dates.push(current);
    current = addDaysStr(current, 1);
  }
  return dates;
};
