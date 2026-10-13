// src/features/task/task.time.js
// Time-field rules shared by the task validator, the recurrence validator and the service.

import { isValidTimeStr, timeToMinutes, parseUTCDate } from '../../shared/utils/dateUtils.js';
import { MAX_TIMED_HOURS_WARNING } from '../../config/limits.js';
import { DEFAULT_DEADLINE_TIME } from './task.rules.js';

/** A value counts as "provided" unless it is undefined, null or an empty string. */
export const has = (value) => value !== undefined && value !== null && value !== '';

/**
 * Validates the clock fields of a single slot (startTime / endTime) for one time type.
 * Dates are checked elsewhere. `prefix` namespaces the keys written into `details`.
 *
 *   TIMED       startTime + endTime, start before end
 *   OPEN_ENDED  startTime only
 *   DEADLINE    endTime only (optional, defaults to 23:59)
 */
export const validateTimeFields = (timeType, fields, details, warnings = [], prefix = '') => {
  const key = (name) => `${prefix}${name}`;

  if (timeType === 'TIMED') {
    if (!isValidTimeStr(fields.startTime)) {
      details[key('startTime')] = 'startTime is required and must be in HH:MM format';
    }
    if (!isValidTimeStr(fields.endTime)) {
      details[key('endTime')] = 'endTime is required and must be in HH:MM format';
    }
    if (isValidTimeStr(fields.startTime) && isValidTimeStr(fields.endTime)) {
      const start = timeToMinutes(fields.startTime);
      const end = timeToMinutes(fields.endTime);
      if (start >= end) {
        details[key('startTime')] = 'startTime must be before endTime';
      } else if (end - start >= MAX_TIMED_HOURS_WARNING * 60) {
        warnings.push(
          `This block is close to or equal to ${MAX_TIMED_HOURS_WARNING} hours, please confirm it is correct`
        );
      }
    }
  } else if (timeType === 'OPEN_ENDED') {
    if (!isValidTimeStr(fields.startTime)) {
      details[key('startTime')] = 'startTime is required and must be in HH:MM format';
    }
    if (has(fields.endTime)) {
      details[key('endTime')] = 'endTime must not be provided for OPEN_ENDED tasks';
    }
  } else if (timeType === 'DEADLINE') {
    if (has(fields.startTime)) {
      details[key('startTime')] = 'startTime is not allowed for DEADLINE tasks (use endTime)';
    }
    if (has(fields.endTime) && !isValidTimeStr(fields.endTime)) {
      details[key('endTime')] = 'endTime must be in HH:MM format';
    }
  }
};

const EMPTY_TIME_FIELDS = {
  date: null,
  startTime: null,
  endTime: null,
  rangeStartDate: null,
  rangeEndDate: null,
};

/**
 * Turns already-validated input into the exact time columns for a time type.
 * Every column that does not belong to the type is explicitly nulled, so changing
 * a task's time type can never leave stale values behind.
 */
export const buildTimeFields = (timeType, input) => {
  switch (timeType) {
    case 'TIMED':
      return {
        ...EMPTY_TIME_FIELDS,
        date: parseUTCDate(input.date),
        startTime: input.startTime,
        endTime: input.endTime,
      };
    case 'OPEN_ENDED':
      return { ...EMPTY_TIME_FIELDS, date: parseUTCDate(input.date), startTime: input.startTime };
    case 'DEADLINE':
      return {
        ...EMPTY_TIME_FIELDS,
        date: parseUTCDate(input.date),
        endTime: has(input.endTime) ? input.endTime : DEFAULT_DEADLINE_TIME,
      };
    case 'MULTI_DAY':
      return {
        ...EMPTY_TIME_FIELDS,
        rangeStartDate: parseUTCDate(input.rangeStartDate),
        rangeEndDate: parseUTCDate(input.rangeEndDate),
      };
    default: // ANY_TIME
      return { ...EMPTY_TIME_FIELDS };
  }
};
