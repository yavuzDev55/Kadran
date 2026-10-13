// src/utils/taskRules.js
// Mirror of kadran-backend/src/features/task/task.rules.js — keep both in sync.
// The backend is the authority; this file only lets the form offer the right choices.

export const TASK_TYPES = [
  { id: 'COURSE', label: 'Course', hint: 'Timed lecture, can repeat' },
  { id: 'EXAM', label: 'Exam', hint: 'Single timed exam' },
  { id: 'HOMEWORK', label: 'Homework', hint: 'Deadline task' },
  { id: 'CUSTOM', label: 'Custom', hint: 'Any time model' },
];

export const TIME_TYPE_LABELS = {
  TIMED: 'Timed (start & end time)',
  OPEN_ENDED: 'Open-ended (start time only)',
  MULTI_DAY: 'Multi-day (whole days)',
  ANY_TIME: 'Any time (no date, not on calendar)',
  DEADLINE: 'Deadline (due date & time)',
};

// Short names for filters and badges
export const TIME_TYPE_SHORT_LABELS = {
  TIMED: 'Timed',
  OPEN_ENDED: 'Open-ended',
  MULTI_DAY: 'Multi-day',
  ANY_TIME: 'Any time',
  DEADLINE: 'Deadline',
};

export const ALL_TIME_TYPES =['TIMED', 'OPEN_ENDED', 'MULTI_DAY', 'ANY_TIME', 'DEADLINE'];

// Only these time types can repeat
export const RECURRING_TIME_TYPES = ['TIMED', 'OPEN_ENDED'];

// A recurring series may be at most this many years long, and needs an end date
export const MAX_SERIES_YEARS = 1;

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
    timeTypes: ALL_TIME_TYPES,
    recurrence: true,
    priority: 'MEDIUM',
    completable: { default: true, editable: true },
  },
};

export const TYPE_COLORS = {
  COURSE: '#3b82f6',
  EXAM: '#ef4444',
  HOMEWORK: '#22c55e',
  CUSTOM: '#94a3b8',
};

export const canRecur = (type, timeType) =>
  Boolean(TASK_RULES[type]?.recurrence) && RECURRING_TIME_TYPES.includes(timeType);
