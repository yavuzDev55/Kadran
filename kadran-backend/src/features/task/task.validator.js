// src/features/task/task.validator.js

import { ValidationError } from '../../shared/utils/customErrors.js';

const VALID_TYPES = ['DERS', 'SINAV', 'ODEV', 'KISISEL'];
const VALID_TIME_TYPES = ['HOURLY', 'ALLDAY', 'REMINDER'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const VALID_PATTERNS = ['DAILY', 'WEEKLY', 'MONTHLY'];
const VALID_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const TIME_REGEX = /^([0-1]\d|2[0-3]):[0-5]\d$/; // HH:MM

const isValidTime = (t) => TIME_REGEX.test(t);

const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const validateCreateTask = (req, res, next) => {
  try {
    const {
      title, type, categoryId, timeType, date,
      startTime, endTime, reminderTime,
      priority, isRecurring, recurrencePattern,
      recurrenceDays, recurrenceStart, recurrenceEnd, recurrenceDay,
    } = req.body;

    const errors = [];

    // Title
    if (!title || title.trim() === '') {
      errors.push('Title is required');
    } else if (title.length > 255) {
      errors.push('Title must be 255 characters or less');
    }

    // Type
    if (!type) {
      errors.push('Type is required');
    } else if (!VALID_TYPES.includes(type)) {
      errors.push(`Type must be one of: ${VALID_TYPES.join(', ')}`);
    }

    // CategoryId
    if (!categoryId) {
      errors.push('CategoryId is required');
    } else if (isNaN(parseInt(categoryId))) {
      errors.push('CategoryId must be a number');
    }

    // TimeType
    if (!timeType) {
      errors.push('TimeType is required');
    } else if (!VALID_TIME_TYPES.includes(timeType)) {
      errors.push(`TimeType must be one of: ${VALID_TIME_TYPES.join(', ')}`);
    }

    // Date
    if (!date) {
      errors.push('Date is required');
    } else if (isNaN(new Date(date).getTime())) {
      errors.push('Invalid date format');
    }

    // TimeType'a göre alan kontrolleri
    if (timeType === 'HOURLY') {
      if (!startTime) {
        errors.push('startTime is required for HOURLY tasks');
      } else if (!isValidTime(startTime)) {
        errors.push('startTime must be in HH:MM format (e.g. 09:00)');
      }

      if (!endTime) {
        errors.push('endTime is required for HOURLY tasks');
      } else if (!isValidTime(endTime)) {
        errors.push('endTime must be in HH:MM format (e.g. 11:00)');
      }

      if (startTime && endTime && isValidTime(startTime) && isValidTime(endTime)) {
        if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
          errors.push('startTime must be before endTime');
        }
      }
    }

    if (timeType === 'REMINDER') {
      if (!reminderTime) {
        errors.push('reminderTime is required for REMINDER tasks');
      } else if (!isValidTime(reminderTime)) {
        errors.push('reminderTime must be in HH:MM format (e.g. 08:00)');
      }
    }

    // Priority (opsiyonel, default MEDIUM)
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    // Recurrence
    if (isRecurring) {
      if (!recurrencePattern) {
        errors.push('recurrencePattern is required when isRecurring is true');
      } else if (!VALID_PATTERNS.includes(recurrencePattern)) {
        errors.push(`recurrencePattern must be one of: ${VALID_PATTERNS.join(', ')}`);
      }

      if (!recurrenceStart) {
        errors.push('recurrenceStart is required when isRecurring is true');
      }

      if (recurrencePattern === 'WEEKLY') {
        if (!recurrenceDays) {
          errors.push('recurrenceDays is required for WEEKLY pattern (e.g. MON,WED,FRI)');
        } else {
          const days = recurrenceDays.split(',').map(d => d.trim());
          const invalidDays = days.filter(d => !VALID_DAYS.includes(d));
          if (invalidDays.length > 0) {
            errors.push(`Invalid days: ${invalidDays.join(', ')}. Use: ${VALID_DAYS.join(', ')}`);
          }
        }
      }

      if (recurrencePattern === 'MONTHLY' && recurrenceDay !== undefined) {
        const day = parseInt(recurrenceDay);
        if (isNaN(day) || (day < 1 || day > 31) && day !== -1) {
          errors.push('recurrenceDay must be 1-31 or -1 (last day of month)');
        }
      }

      if (recurrenceStart && recurrenceEnd) {
        if (new Date(recurrenceEnd) <= new Date(recurrenceStart)) {
          errors.push('recurrenceEnd must be after recurrenceStart');
        }
      }
    }

    if (errors.length > 0) throw new ValidationError('Task validation failed', { errors });

    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateTask = (req, res, next) => {
  try {
    const { title, type, timeType, startTime, endTime, reminderTime, priority } = req.body;
    const errors = [];

    if (title !== undefined) {
      if (title.trim() === '') errors.push('Title cannot be empty');
      if (title.length > 255) errors.push('Title must be 255 characters or less');
    }

    if (type !== undefined && !VALID_TYPES.includes(type)) {
      errors.push(`Type must be one of: ${VALID_TYPES.join(', ')}`);
    }

    if (timeType !== undefined && !VALID_TIME_TYPES.includes(timeType)) {
      errors.push(`TimeType must be one of: ${VALID_TIME_TYPES.join(', ')}`);
    }

    if (startTime !== undefined && !isValidTime(startTime)) {
      errors.push('startTime must be in HH:MM format');
    }

    if (endTime !== undefined && !isValidTime(endTime)) {
      errors.push('endTime must be in HH:MM format');
    }

    if (startTime && endTime && isValidTime(startTime) && isValidTime(endTime)) {
      if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
        errors.push('startTime must be before endTime');
      }
    }

    if (reminderTime !== undefined && !isValidTime(reminderTime)) {
      errors.push('reminderTime must be in HH:MM format');
    }

    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    if (errors.length > 0) throw new ValidationError('Task update validation failed', { errors });

    next();
  } catch (error) {
    next(error);
  }
};

export const validateTaskId = (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) throw new ValidationError('Invalid task ID');
    req.params.id = id;
    next();
  } catch (error) {
    next(error);
  }
};

export const validateTaskTagParams = (req, res, next) => {
  try {
    const errors = [];
    const taskId = parseInt(req.params.id);
    const tagId = parseInt(req.params.tagId);

    if (isNaN(taskId) || taskId <= 0) errors.push('Invalid task ID');
    if (isNaN(tagId) || tagId <= 0) errors.push('Invalid tag ID');

    if (errors.length > 0) throw new ValidationError('Invalid parameters', { errors });

    req.params.id = taskId;
    req.params.tagId = tagId;
    next();
  } catch (error) {
    next(error);
  }
};