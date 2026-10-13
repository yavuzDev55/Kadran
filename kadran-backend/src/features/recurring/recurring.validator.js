// src/features/recurring/recurring.validator.js
// Validates the `recurrence` object sent when creating a task:
//
//   recurrence: {
//     pattern:   'DAILY' | 'WEEKLY' | 'MONTHLY',
//     startDate: 'YYYY-MM-DD',
//     endDate:   'YYYY-MM-DD'          // required, at most 1 year after startDate
//     weekDays:  ['MONDAY', ...]       // WEEKLY
//     slots:     { MONDAY: { startTime, endTime } }   // WEEKLY, optional per-day times
//     monthDay:  1..31 | -1            // MONTHLY (-1 = last day of the month)
//   }
//
// The default clock times live at the top level of the task body (startTime / endTime);
// a WEEKLY slot overrides them for its weekday.

import { isValidDateStr } from '../../shared/utils/dateUtils.js';
import { RECURRENCE_PATTERNS, RECURRING_TIME_TYPES, TASK_RULES, WEEK_DAYS } from '../task/task.rules.js';
import { validateTimeFields } from '../task/task.time.js';
import { maxSeriesEnd } from './recurring.service.js';

export const validateRecurrenceInput = (body, details, warnings = []) => {
  const rule = body.recurrence;

  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
    details.recurrence = 'recurrence must be an object';
    return;
  }

  if (!TASK_RULES[body.type]?.recurrence) {
    details.recurrence = `${body.type} tasks cannot be recurring`;
    return;
  }
  if (!RECURRING_TIME_TYPES.includes(body.timeType)) {
    details.recurrence = 'Only TIMED and OPEN_ENDED tasks can be recurring';
    return;
  }

  if (!RECURRENCE_PATTERNS.includes(rule.pattern)) {
    details['recurrence.pattern'] = 'pattern must be DAILY, WEEKLY or MONTHLY';
    return;
  }

  // ── Range: both ends required, end not before start, at most 1 year ──
  const startOk = isValidDateStr(rule.startDate);
  const endOk = isValidDateStr(rule.endDate);
  if (!startOk) details['recurrence.startDate'] = 'startDate is required (YYYY-MM-DD)';
  if (!endOk) details['recurrence.endDate'] = 'endDate is required (YYYY-MM-DD)';
  if (startOk && endOk) {
    if (rule.endDate < rule.startDate) {
      details['recurrence.endDate'] = 'endDate must not be before startDate';
    } else if (rule.endDate > maxSeriesEnd(rule.startDate)) {
      details['recurrence.endDate'] = 'A recurring series cannot be longer than 1 year';
    }
  }

  // ── Pattern specific ──
  if (rule.pattern === 'WEEKLY') {
    const days = rule.weekDays;
    if (
      !Array.isArray(days) ||
      days.length === 0 ||
      days.some((d) => !WEEK_DAYS.includes(d)) ||
      new Set(days).size !== days.length
    ) {
      details['recurrence.weekDays'] = 'weekDays must be a non-empty list of unique weekday names';
      return;
    }

    const slots = rule.slots && typeof rule.slots === 'object' ? rule.slots : {};
    days.forEach((day) => {
      const slot = slots[day] ?? { startTime: body.startTime, endTime: body.endTime };
      validateTimeFields(body.timeType, slot, details, warnings, `recurrence.slots.${day}.`);
    });
    return;
  }

  if (rule.pattern === 'MONTHLY') {
    const day = rule.monthDay;
    if (!Number.isInteger(day) || !((day >= 1 && day <= 31) || day === -1)) {
      details['recurrence.monthDay'] = 'monthDay must be between 1-31, or -1 for the last day';
    }
  }

  // DAILY / MONTHLY: one shared clock time at the top level
  validateTimeFields(body.timeType, body, details, warnings);
};
