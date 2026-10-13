// src/features/task/task.rules.js
// Single source of truth for what each task type may do.
// The frontend keeps a mirror of this file in src/utils/taskRules.js — keep both in sync.

export const TASK_TYPES = ['COURSE', 'EXAM', 'HOMEWORK', 'CUSTOM'];
export const TIME_TYPES = ['TIMED', 'OPEN_ENDED', 'MULTI_DAY', 'ANY_TIME', 'DEADLINE'];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
export const RECURRENCE_PATTERNS = ['DAILY', 'WEEKLY', 'MONTHLY'];
export const WEEK_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

// Only these time types can repeat (a repeating "deadline" or "any time" makes no sense).
export const RECURRING_TIME_TYPES = ['TIMED', 'OPEN_ENDED'];

// A deadline without an explicit time ends at the end of the day.
export const DEFAULT_DEADLINE_TIME = '23:59';

/**
 * timeTypes   – allowed time models
 * recurrence  – may the task repeat (still limited to RECURRING_TIME_TYPES)
 * priority    – default priority
 * completable – default value, and whether the user may change it
 */
export const TASK_RULES = {
  COURSE: {
    timeTypes: ['TIMED'],
    recurrence: true,
    priority: 'MEDIUM',
    completable: { default: true, editable: true },
  },
  HOMEWORK: {
    timeTypes: ['DEADLINE'],
    recurrence: false,
    priority: 'MEDIUM',
    completable: { default: true, editable: false },
  },
  EXAM: {
    timeTypes: ['TIMED'],
    recurrence: false,
    priority: 'HIGH',
    completable: { default: false, editable: true },
  },
  CUSTOM: {
    timeTypes: TIME_TYPES,
    recurrence: true,
    priority: 'MEDIUM',
    completable: { default: true, editable: true },
  },
};

export const canRecur = (type, timeType) =>
  Boolean(TASK_RULES[type]?.recurrence) && RECURRING_TIME_TYPES.includes(timeType);
