// src/features/task/task.validator.js

import { ValidationError } from '../../shared/utils/customErrors.js';
import { dateDiffInDays, isValidDateStr, todayInTimezone } from '../../shared/utils/dateUtils.js';
import {
  DEFAULT_LIST_LIMIT,
  MAX_LIST_LIMIT,
  MAX_RANGE_DAYS_HARD,
  MAX_RANGE_DAYS_WARNING,
} from '../../config/limits.js';
import { isValidColor } from '../../config/colors.js';
import { validateRecurrenceInput } from '../recurring/recurring.validator.js';
import { PRIORITIES, TASK_RULES, TASK_TYPES, TIME_TYPES } from './task.rules.js';
import { has, validateTimeFields } from './task.time.js';

const TAG_REGEX = /^[\p{L}0-9_\- ]{1,50}$/u;

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

// ─── Fields shared by every task, whatever its time model ─────────────────────

const validateTags = (tags, details) => {
  if (tags === undefined) return;
  if (!Array.isArray(tags)) {
    details.tags = 'tags must be an array of strings';
    return;
  }
  tags.forEach((tag, index) => {
    if (typeof tag !== 'string' || !TAG_REGEX.test(tag.trim())) {
      details[`tags[${index}]`] = `Tag at index ${index} is invalid`;
    }
  });
};

/**
 * Type/format checks for the fields that are independent of the time model.
 * With `partial` only the fields that are present are checked (PATCH requests).
 */
export const validateCommonFields = (body, details, { partial = false } = {}) => {
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length < 1 || body.title.length > 255) {
      details.title = 'Title is required and must be 1-255 characters';
    }
  }

  if (!partial || body.type !== undefined) {
    if (!TASK_TYPES.includes(body.type)) details.type = 'Invalid task type';
  }

  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    details.description = 'description must be a string';
  }

  if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) {
    details.priority = 'Invalid priority';
  }

  if (body.color !== undefined && body.color !== null && !isValidColor(body.color)) {
    details.color = 'color must be one of the preset palette values';
  }

  if (body.isCompletable !== undefined && typeof body.isCompletable !== 'boolean') {
    details.isCompletable = 'isCompletable must be a boolean';
  }

  if (body.isPinned !== undefined && typeof body.isPinned !== 'boolean') {
    details.isPinned = 'isPinned must be a boolean';
  }

  validateTags(body.tags, details);
};

// ─── Time model ───────────────────────────────────────────────────────────────

const validateSingleDay = (body, details, warnings) => {
  if (!isValidDateStr(body.date)) details.date = 'date is required (YYYY-MM-DD)';
  validateTimeFields(body.timeType, body, details, warnings);
  if (has(body.rangeStartDate) || has(body.rangeEndDate)) {
    details.timeType = `range fields are not allowed for ${body.timeType} tasks`;
  }
};

// MULTI_DAY: whole days only. The same start and end day is a valid one-day task.
const validateMultiDay = (body, details, warnings) => {
  const startOk = isValidDateStr(body.rangeStartDate);
  const endOk = isValidDateStr(body.rangeEndDate);
  if (!startOk) details.rangeStartDate = 'rangeStartDate is required (YYYY-MM-DD)';
  if (!endOk) details.rangeEndDate = 'rangeEndDate is required (YYYY-MM-DD)';

  if (startOk && endOk) {
    const diffDays = dateDiffInDays(body.rangeStartDate, body.rangeEndDate);
    if (diffDays < 0) {
      details.rangeEndDate = 'rangeEndDate must not be before rangeStartDate';
    } else if (diffDays > MAX_RANGE_DAYS_HARD) {
      details.rangeEndDate = `Date range exceeds ${MAX_RANGE_DAYS_HARD} days`;
    } else if (diffDays > MAX_RANGE_DAYS_WARNING) {
      warnings.push(`This task is longer than ${MAX_RANGE_DAYS_WARNING} days, please confirm it is correct`);
    }
  }

  if (has(body.date) || has(body.startTime) || has(body.endTime)) {
    details.timeType = 'date/startTime/endTime are not allowed for MULTI_DAY tasks';
  }
};

const validateAnyTime = (body, details) => {
  if (
    has(body.date) ||
    has(body.startTime) ||
    has(body.endTime) ||
    has(body.rangeStartDate) ||
    has(body.rangeEndDate)
  ) {
    details.timeType = 'ANY_TIME tasks must not have date or time fields';
  }
};

export const validateTimeModel = (body, details, warnings = []) => {
  if (!TIME_TYPES.includes(body.timeType)) {
    details.timeType = 'Invalid time type';
    return;
  }

  const rule = TASK_RULES[body.type];
  if (rule && !rule.timeTypes.includes(body.timeType)) {
    details.timeType = `${body.type} tasks only allow: ${rule.timeTypes.join(', ')}`;
    return;
  }

  if (body.timeType === 'MULTI_DAY') validateMultiDay(body, details, warnings);
  else if (body.timeType === 'ANY_TIME') validateAnyTime(body, details);
  else validateSingleDay(body, details, warnings); // TIMED, OPEN_ENDED, DEADLINE
};

/**
 * Full validation of a task body.
 * With a `recurrence` object the task becomes a series: the per-occurrence dates are
 * generated by the server, so no top-level `date` is needed.
 */
export const validateTaskBody = (body, { allowRecurrence = true } = {}) => {
  const details = {};
  const warnings = [];

  validateCommonFields(body, details);

  // Some types fix the "completable" flag (e.g. homework is always completable)
  const completable = TASK_RULES[body.type]?.completable;
  if (
    completable &&
    !completable.editable &&
    body.isCompletable !== undefined &&
    body.isCompletable !== completable.default
  ) {
    details.isCompletable = `isCompletable cannot be changed for ${body.type} tasks`;
  }

  const isRecurring = body.recurrence !== undefined && body.recurrence !== null;

  if (isRecurring && !allowRecurrence) {
    details.recurrence = 'Recurrence can only be set when the task is created';
  } else if (isRecurring) {
    if (!TIME_TYPES.includes(body.timeType)) {
      details.timeType = 'Invalid time type';
    } else if (TASK_RULES[body.type] && !TASK_RULES[body.type].timeTypes.includes(body.timeType)) {
      details.timeType = `${body.type} tasks only allow: ${TASK_RULES[body.type].timeTypes.join(', ')}`;
    }
    validateRecurrenceInput(body, details, warnings);
  } else {
    validateTimeModel(body, details, warnings);
  }

  return { details, warnings };
};

// ─── Express middleware ───────────────────────────────────────────────────────

export const createTask = (req, res, next) => {
  if (!isPlainObject(req.body)) {
    return next(new ValidationError('Validation failed', { body: 'Request body must be a JSON object' }));
  }

  const { details, warnings } = validateTaskBody(req.body);

  if (Object.keys(details).length > 0) {
    return next(new ValidationError('Validation failed', details));
  }

  req.taskWarnings = warnings;
  next();
};

// PATCH: cheap shape checks here. Everything that depends on the stored task
// (type/time-type combinations, series rules) is validated in the service on the merged data.
export const updateTask = (req, res, next) => {
  if (!isPlainObject(req.body)) {
    return next(new ValidationError('Validation failed', { body: 'Request body must be a JSON object' }));
  }

  const details = {};
  if (req.body.recurrence !== undefined) {
    details.recurrence = 'Recurrence can only be set when the task is created';
  }
  validateCommonFields(req.body, details, { partial: true });

  if (Object.keys(details).length > 0) {
    return next(new ValidationError('Validation failed', details));
  }
  next();
};

// PATCH /series/:id — fields shared by all occurrences
export const updateSeries = (req, res, next) => {
  if (!isPlainObject(req.body)) {
    return next(new ValidationError('Validation failed', { body: 'Request body must be a JSON object' }));
  }
  const details = {};
  validateCommonFields(req.body, details, { partial: true });

  const editable = ['title', 'description', 'priority', 'color', 'isCompletable', 'isPinned'];
  if (!editable.some((key) => req.body[key] !== undefined)) {
    details.body = `Provide at least one of: ${editable.join(', ')}`;
  }

  if (Object.keys(details).length > 0) {
    return next(new ValidationError('Validation failed', details));
  }
  next();
};

// GET /tasks — parses and validates the query string into req.taskFilters
export const listTasks = (req, res, next) => {
  const q = req.query;
  const details = {};
  const filters = {};

  const oneOf = (key, allowed) => {
    if (q[key] === undefined || q[key] === '') return;
    if (typeof q[key] !== 'string' || !allowed.includes(q[key])) {
      details[key] = `${key} must be one of: ${allowed.join(', ')}`;
    } else {
      filters[key] = q[key];
    }
  };
  oneOf('type', TASK_TYPES);
  oneOf('priority', PRIORITIES);
  oneOf('timeType', TIME_TYPES);

  ['from', 'to', 'today'].forEach((key) => {
    if (q[key] === undefined || q[key] === '') return;
    if (!isValidDateStr(q[key])) details[key] = `${key} must be a date (YYYY-MM-DD)`;
    else filters[key] = q[key];
  });
  if (filters.from && filters.to && filters.from > filters.to) {
    details.from = 'from must not be after to';
  }

  const bool = (key) => {
    if (q[key] === undefined || q[key] === '') return undefined;
    if (q[key] !== 'true' && q[key] !== 'false') {
      details[key] = `${key} must be true or false`;
      return undefined;
    }
    return q[key] === 'true';
  };
  filters.isPinned = bool('isPinned');
  filters.collapseSeries = bool('collapseSeries') === true;
  filters.showCompleted = q.showCompleted !== 'false';

  if (q.q !== undefined) {
    if (typeof q.q !== 'string') details.q = 'q must be a string';
    else if (q.q.trim()) filters.q = q.q.trim().slice(0, 100);
  }

  if (q.tags !== undefined) {
    if (typeof q.tags !== 'string') details.tags = 'tags must be a comma-separated string';
    else {
      const tags = q.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      if (tags.length > 0) filters.tags = tags;
    }
  }

  const int = (key, fallback, min, max) => {
    if (q[key] === undefined || q[key] === '') return fallback;
    const value = Number(q[key]);
    if (!Number.isInteger(value) || value < min || value > max) {
      details[key] = `${key} must be an integer between ${min} and ${max}`;
      return fallback;
    }
    return value;
  };
  filters.limit = int('limit', DEFAULT_LIST_LIMIT, 1, MAX_LIST_LIMIT);
  filters.offset = int('offset', 0, 0, 1_000_000);

  if (Object.keys(details).length > 0) {
    return next(new ValidationError('Validation failed', details));
  }

  // The "next occurrence" of a series is relative to today (the client sends its own date)
  filters.today = filters.today ?? todayInTimezone('UTC');
  req.taskFilters = filters;
  next();
};

// POST /tasks/:id/tags
export const addTag = (req, res, next) => {
  const name = req.body?.name;
  if (typeof name !== 'string' || !TAG_REGEX.test(name.trim())) {
    return next(new ValidationError('Validation failed', { name: 'name is required (letters, numbers, space, - and _; max 50)' }));
  }
  next();
};

/**
 * router.param() handler: turns a numeric path parameter (:id, :tagId, :seriesId) into a
 * positive integer. Without it `/tasks/abc` reaches Prisma as NaN and ends up as a 500.
 */
export const validateIdParam = (req, res, next, value, name) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return next(new ValidationError(`Invalid ${name}`));
  }
  req.params[name] = id;
  next();
};
