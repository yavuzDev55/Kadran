// src/features/task/task.validator.js

import { ValidationError } from '../../shared/utils/customErrors.js';
import {
  MAX_TIMED_HOURS_WARNING,
  MAX_RANGE_DAYS_WARNING,
  MAX_RANGE_DAYS_HARD,
} from '../../config/limits.js';
import { isValidColor } from '../../config/colors.js';

const TASK_TYPES = ['COURSE', 'EXAM', 'HOMEWORK', 'CUSTOM'];
const TIME_TYPES = ['TIMED', 'TIMED_OPEN', 'DEADLINE', 'DATE_RANGE', 'ANYTIME'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const RECURRENCE_PATTERNS = ['DAILY', 'WEEKLY', 'MONTHLY'];
const WEEK_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TAG_REGEX = /^[\p{L}0-9_\- ]{1,50}$/u;

const isValidDate = (value) => {
  if (typeof value !== 'string' || !DATE_REGEX.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime());
};

const isValidTime = (value) => typeof value === 'string' && TIME_REGEX.test(value);

const timeToMinutes = (value) => {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
};

const dateDiffInDays = (startDate, endDate) => {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

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

const validateRecurrence = (body, details) => {
  if (!body.isRecurring) return;

  if (!RECURRENCE_PATTERNS.includes(body.recurrencePattern)) {
    details.recurrencePattern = 'recurrencePattern is required when isRecurring is true';
    return;
  }

  if (!isValidDate(body.recurrenceStart)) {
    details.recurrenceStart = 'recurrenceStart is required';
  }

  if (body.recurrenceEnd !== undefined && body.recurrenceEnd !== null) {
    if (!isValidDate(body.recurrenceEnd)) {
      details.recurrenceEnd = 'recurrenceEnd must be a valid date';
    }
  }

  if (body.recurrencePattern === 'WEEKLY') {
    if (
      !Array.isArray(body.recurrenceDays) ||
      body.recurrenceDays.length === 0 ||
      body.recurrenceDays.some((day) => !WEEK_DAYS.includes(day))
    ) {
      details.recurrenceDays = 'recurrenceDays is required for WEEKLY recurrence';
    }
  }

  if (body.recurrencePattern === 'MONTHLY') {
    const day = body.recurrenceDay;
    if (typeof day !== 'number' || !((day >= 1 && day <= 31) || day === -1)) {
      details.recurrenceDay = 'recurrenceDay must be between 1-31 or -1 for MONTHLY recurrence';
    }
  }
};

// Out of scope in the official v3 doc (see §11.2), added at the user's
// request. Rule: only meaningful for TIMED + weekly-recurring tasks; each
// weekday gets its own slot instead of a single top-level startTime/endTime.
const validateFlexibleSchedule = (body, details) => {
  if (!body.isFlexibleSchedule) return;

  if (body.timeType !== 'TIMED') {
    details.isFlexibleSchedule = 'isFlexibleSchedule is only allowed when timeType is TIMED';
  }

  if (!body.isRecurring || body.recurrencePattern !== 'WEEKLY') {
    details.isFlexibleSchedule =
      'isFlexibleSchedule requires isRecurring=true and recurrencePattern=WEEKLY';
  }

  if (!Array.isArray(body.schedules) || body.schedules.length === 0) {
    details.schedules = 'schedules is required when isFlexibleSchedule is true';
    return;
  }

  const seenDays = new Set();

  body.schedules.forEach((schedule, index) => {
    if (!schedule || typeof schedule !== 'object') {
      details[`schedules[${index}]`] = 'Invalid schedule entry';
      return;
    }

    if (!WEEK_DAYS.includes(schedule.dayOfWeek)) {
      details[`schedules[${index}].dayOfWeek`] = 'Invalid dayOfWeek';
    } else if (seenDays.has(schedule.dayOfWeek)) {
      details[`schedules[${index}].dayOfWeek`] = 'Duplicate dayOfWeek in schedules';
    } else {
      seenDays.add(schedule.dayOfWeek);
    }

    if (!isValidTime(schedule.startTime)) {
      details[`schedules[${index}].startTime`] = 'startTime must be in HH:MM format';
    }
    if (!isValidTime(schedule.endTime)) {
      details[`schedules[${index}].endTime`] = 'endTime must be in HH:MM format';
    }
    if (
      isValidTime(schedule.startTime) &&
      isValidTime(schedule.endTime) &&
      timeToMinutes(schedule.startTime) >= timeToMinutes(schedule.endTime)
    ) {
      details[`schedules[${index}].startTime`] = 'startTime must be before endTime';
    }
  });
};

const validateTimedOpen = (body, details) => {
  if (!isValidDate(body.date)) {
    details.date = 'date is required for TIMED_OPEN tasks';
  }
  if (!isValidTime(body.startTime)) {
    details.startTime = 'startTime is required and must be in HH:MM format';
  }
  if (body.endTime !== undefined && body.endTime !== null) {
    details.endTime = 'endTime must not be provided for TIMED_OPEN tasks';
  }
  if (body.isFlexibleSchedule) {
    details.isFlexibleSchedule = 'isFlexibleSchedule is only allowed when timeType is TIMED';
  }
};

const validateAnytime = (body, details) => {
  if (body.date || body.startTime || body.endTime ||
      body.rangeStartDate || body.rangeEndDate) {
    details.timeType = 'ANYTIME tasks must not have date or time fields';
  }
  if (body.isRecurring) {
    details.isRecurring = 'ANYTIME tasks cannot be recurring';
  }
  if (body.isFlexibleSchedule) {
    details.isFlexibleSchedule = 'isFlexibleSchedule is only allowed when timeType is TIMED';
  }
};

const validateTimed = (body, details, warnings) => {
  if (!isValidDate(body.date)) {
    details.date = 'date is required';
  }

  // When isFlexibleSchedule is true, the top-level startTime/endTime are
  // not used; the actual slots are checked in validateFlexibleSchedule.
  if (body.isFlexibleSchedule) {
    if (body.startTime !== undefined || body.endTime !== undefined) {
      details.startTime =
        'startTime/endTime are not used when isFlexibleSchedule is true (use schedules)';
    }
    return;
  }

  if (!isValidTime(body.startTime)) {
    details.startTime = 'startTime is required and must be in HH:MM format';
  }
  if (!isValidTime(body.endTime)) {
    details.endTime = 'endTime is required and must be in HH:MM format';
  }
  if (isValidTime(body.startTime) && isValidTime(body.endTime)) {
    const start = timeToMinutes(body.startTime);
    const end = timeToMinutes(body.endTime);
    if (start >= end) {
      details.startTime = 'startTime must be before endTime';
    } else if (end - start >= MAX_TIMED_HOURS_WARNING * 60) {
      warnings.push(
        `This block is close to or equal to ${MAX_TIMED_HOURS_WARNING} hours, please confirm it is correct`
      );
    }
  }
  if (body.rangeStartDate || body.rangeEndDate || body.rangeStartTime || body.rangeEndTime) {
    details.timeType = 'range fields are not allowed for TIMED tasks';
  }
};

const validateDeadline = (body, details) => {
  if (!isValidDate(body.date)) {
    details.date = 'date is required';
  }
  if (body.startTime !== undefined || body.endTime !== undefined) {
    details.timeType = 'startTime/endTime are not allowed for DEADLINE tasks';
  }
  if (body.isFlexibleSchedule) {
    details.isFlexibleSchedule = 'isFlexibleSchedule is only allowed when timeType is TIMED';
  }
};

const validateDateRange = (body, details, warnings) => {
  if (!isValidDate(body.rangeStartDate)) {
    details.rangeStartDate = 'rangeStartDate is required';
  }
  if (!isValidDate(body.rangeEndDate)) {
    details.rangeEndDate = 'rangeEndDate is required';
  }

  if (
    body.rangeStartTime !== undefined &&
    body.rangeStartTime !== null &&
    !isValidTime(body.rangeStartTime)
  ) {
    details.rangeStartTime = 'rangeStartTime must be in HH:MM format';
  }
  if (
    body.rangeEndTime !== undefined &&
    body.rangeEndTime !== null &&
    !isValidTime(body.rangeEndTime)
  ) {
    details.rangeEndTime = 'rangeEndTime must be in HH:MM format';
  }

  if (isValidDate(body.rangeStartDate) && isValidDate(body.rangeEndDate)) {
    const diffDays = dateDiffInDays(body.rangeStartDate, body.rangeEndDate);

    if (diffDays < 0) {
      details.rangeStartDate = 'rangeStartDate must be before or equal to rangeEndDate';
    } else {
      if (
        diffDays === 0 &&
        isValidTime(body.rangeStartTime) &&
        isValidTime(body.rangeEndTime) &&
        timeToMinutes(body.rangeStartTime) >= timeToMinutes(body.rangeEndTime)
      ) {
        details.rangeStartTime = 'rangeStartTime must be before rangeEndTime on the same day';
      }

      if (diffDays > MAX_RANGE_DAYS_HARD) {
        details.rangeEndDate = `Date range exceeds ${MAX_RANGE_DAYS_HARD} days`;
      } else if (diffDays > MAX_RANGE_DAYS_WARNING) {
        warnings.push(
          `This process is longer than ${MAX_RANGE_DAYS_WARNING} days, please confirm it is correct`
        );
      }
    }
  }

  if (body.date !== undefined || body.startTime !== undefined || body.endTime !== undefined) {
    details.timeType = 'date/startTime/endTime are not allowed for DATE_RANGE tasks';
  }
  if (body.isFlexibleSchedule) {
    details.isFlexibleSchedule = 'isFlexibleSchedule is only allowed when timeType is TIMED';
  }
};

const validateTaskBody = (body) => {
  const details = {};
  const warnings = [];

  if (typeof body.title !== 'string' || body.title.trim().length < 1 || body.title.length > 255) {
    details.title = 'Title is required';
  }

  if (!TASK_TYPES.includes(body.type)) {
    details.type = 'Invalid task type';
  }

  if (!TIME_TYPES.includes(body.timeType)) {
    details.timeType = 'Invalid time type';
  } else if (body.timeType === 'TIMED') {
    validateTimed(body, details, warnings);
  } else if (body.timeType === 'TIMED_OPEN') {
    validateTimedOpen(body, details);
  } else if (body.timeType === 'DEADLINE') {
    validateDeadline(body, details);
  } else if (body.timeType === 'DATE_RANGE') {
    validateDateRange(body, details, warnings);
  } else if (body.timeType === 'ANYTIME') {
    validateAnytime(body, details);
  }

  if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) {
    details.priority = 'Invalid priority';
  }

  validateRecurrence(body, details);
  validateFlexibleSchedule(body, details);

    // color: must be from the preset palette if provided
  if (body.color !== undefined && body.color !== null) {
    if (!isValidColor(body.color)) {
      details.color = 'color must be one of the preset palette values';
    }
  }

  // isCompletable: boolean if provided
  if (body.isCompletable !== undefined && typeof body.isCompletable !== 'boolean') {
    details.isCompletable = 'isCompletable must be a boolean';
  }
  
  // isPinned: boolean if provided
  if (body.isPinned !== undefined && typeof body.isPinned !== 'boolean') {
    details.isPinned = 'isPinned must be a boolean';
  }

  validateTags(body.tags, details);

  return { details, warnings };
};

export const createTask = (req, res, next) => {
  const { details, warnings } = validateTaskBody(req.body);

  if (Object.keys(details).length > 0) {
    return next(new ValidationError('Validation failed', details));
  }

  req.taskWarnings = warnings;
  next();
};

// PATCH için: sadece gönderilen alanları validate et
// timeType gönderilmişse tam validate et, gönderilmemişse sadece gelen alanları kontrol et
export const updateTask = (req, res, next) => {
  const body = req.body;
  const details = {};
  const warnings = [];

  // Başlık gönderildiyse kontrol et
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length < 1 || body.title.length > 255) {
      details.title = 'Title is required and must be 1-255 characters';
    }
  }

  // Priority gönderildiyse kontrol et
  if (body.priority !== undefined && !['LOW', 'MEDIUM', 'HIGH'].includes(body.priority)) {
    details.priority = 'Invalid priority';
  }

  // timeType gönderildiyse tam zaman validasyonu yap
  if (body.timeType !== undefined) {
    const { details: timeDetails, warnings: timeWarnings } = validateTaskBody(body);
    Object.assign(details, timeDetails);
    warnings.push(...timeWarnings);
  } else {
    // timeType gönderilmemişse sadece gelen saat alanlarını format kontrol et
    if (body.startTime !== undefined && body.startTime !== null) {
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(body.startTime)) {
        details.startTime = 'startTime must be in HH:MM format';
      }
    }
    if (body.endTime !== undefined && body.endTime !== null) {
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(body.endTime)) {
        details.endTime = 'endTime must be in HH:MM format';
      }
    }
  }

  // isPinned gönderildiyse boolean olmalı
  if (body.isPinned !== undefined && typeof body.isPinned !== 'boolean') {
    details.isPinned = 'isPinned must be a boolean';
  }

  // Recurrence gönderildiyse kontrol et
  if (body.isRecurring !== undefined) {
    validateRecurrence(body, details);
  }

  if (Object.keys(details).length > 0) {
    return next(new ValidationError('Validation failed', details));
  }

  req.taskWarnings = warnings;
  next();
};

export { validateTaskBody };
