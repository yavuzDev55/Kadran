// src/features/task/task.service.js

import {
  findTaskById,
  findTasksByUser,
  createTask as createTaskRecord,
  updateTask as updateTaskRecord,
  deleteTask as deleteTaskRecord,
  toggleTask as toggleTaskRecord,
  replaceTaskSchedules,
  toggleCompletion,
  findCompletionsByTask,
  pruneCompletions,
} from './task.db.js';
import {
  findOrCreateTag,
  addTagToTask as linkTagToTask,
  removeTagFromTask as unlinkTagFromTask,
} from '../tag/tag.db.js';
import {
  NotFoundError,
  AuthorizationError,
  ForbiddenError,
  ValidationError,
} from '../../shared/utils/customErrors.js';
import { TYPE_DEFAULT_COLORS } from '../../config/colors.js';
import { generateOccurrenceDates, toDateStr } from '../recurring/recurring.service.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDefaultCompletable = (type) => type !== 'COURSE';

export const serializeTask = (task, completedDatesOverride = null) => {
  if (!task) return task;

  // Build completedDates from the included completions relation.
  // completedDatesOverride (a Set) is used after a toggle to avoid a re-fetch.
  let completedDates;
  if (completedDatesOverride !== null) {
    completedDates = [...completedDatesOverride];
  } else if (task.isRecurring && Array.isArray(task.completions)) {
    completedDates = task.completions.map((c) =>
      c.occurrenceDate instanceof Date
        ? c.occurrenceDate.toISOString().slice(0, 10)
        : String(c.occurrenceDate).slice(0, 10)
    );
  } else {
    completedDates = [];
  }

  return {
    ...task,
    tags: (task.tags || []).map((tt) => tt.tag.name),
    effectiveColor: task.color ?? TYPE_DEFAULT_COLORS[task.type] ?? '#94a3b8',
    completedDates,
  };
};

const assertOwnership = async (userId, taskId) => {
  const task = await findTaskById(taskId);
  if (!task) throw new NotFoundError('Task', taskId);
  if (task.userId !== userId) throw new AuthorizationError('You do not have access to this task');
  return task;
};

const resolveTagIds = async (userId, tagNames = []) => {
  const tags = await Promise.all(tagNames.map((name) => findOrCreateTag(userId, name)));
  return tags.map((t) => t.id);
};

const replaceTaskTags = async (taskId, currentTagIds, nextTagIds) => {
  const toRemove = currentTagIds.filter((id) => !nextTagIds.includes(id));
  const toAdd = nextTagIds.filter((id) => !currentTagIds.includes(id));
  await Promise.all([
    ...toRemove.map((tagId) => unlinkTagFromTask(taskId, tagId)),
    ...toAdd.map((tagId) => linkTagToTask(taskId, tagId)),
  ]);
};

// ─── Build data for CREATE (all fields required) ──────────────────────────────

const buildCreateData = (body) => {
  const base = {
    title: body.title,
    description: body.description ?? null,
    type: body.type,
    timeType: body.timeType,
    priority: body.priority ?? 'MEDIUM',
    isCompletable: body.isCompletable !== undefined
      ? Boolean(body.isCompletable)
      : getDefaultCompletable(body.type),
    color: body.color ?? null,
    isPinned: Boolean(body.isPinned ?? false),
    isFlexibleSchedule: Boolean(body.isFlexibleSchedule),
    schedulePattern: body.isFlexibleSchedule ? (body.schedulePattern ?? null) : null,
    isRecurring: Boolean(body.isRecurring),
    recurrencePattern: body.isRecurring ? body.recurrencePattern : null,
    recurrenceStart: body.isRecurring ? new Date(body.recurrenceStart) : null,
    recurrenceEnd: body.isRecurring && body.recurrenceEnd ? new Date(body.recurrenceEnd) : null,
    recurrenceDays:
      body.isRecurring && body.recurrencePattern === 'WEEKLY'
        ? (Array.isArray(body.recurrenceDays) ? body.recurrenceDays.join(',') : body.recurrenceDays)
        : null,
    recurrenceDay:
      body.isRecurring && body.recurrencePattern === 'MONTHLY' ? body.recurrenceDay : null,
  };

  if (body.timeType === 'TIMED') {
    return {
      ...base,
      date: new Date(body.date),
      startTime: body.isFlexibleSchedule ? null : body.startTime,
      endTime: body.isFlexibleSchedule ? null : body.endTime,
      rangeStartDate: null, rangeStartTime: null, rangeEndDate: null, rangeEndTime: null,
    };
  }
  if (body.timeType === 'TIMED_OPEN') {
    return {
      ...base,
      date: new Date(body.date),
      startTime: body.startTime,
      endTime: null,
      rangeStartDate: null, rangeStartTime: null, rangeEndDate: null, rangeEndTime: null,
    };
  }
  if (body.timeType === 'DEADLINE') {
    return {
      ...base,
      date: new Date(body.date),
      startTime: null, endTime: null,
      rangeStartDate: null, rangeStartTime: null, rangeEndDate: null, rangeEndTime: null,
    };
  }
  if (body.timeType === 'ANYTIME') {
    return {
      ...base,
      date: null, startTime: null, endTime: null,
      rangeStartDate: null, rangeStartTime: null, rangeEndDate: null, rangeEndTime: null,
    };
  }
  // DATE_RANGE
  return {
    ...base,
    date: null, startTime: null, endTime: null,
    rangeStartDate: new Date(body.rangeStartDate),
    rangeStartTime: body.rangeStartTime ?? null,
    rangeEndDate: new Date(body.rangeEndDate),
    rangeEndTime: body.rangeEndTime ?? null,
  };
};

// ─── Build data for PATCH (only merge provided fields) ────────────────────────

const buildUpdateData = (existing, body) => {
  const data = {};

  if (body.title !== undefined)         data.title = body.title;
  if (body.description !== undefined)   data.description = body.description ?? null;
  if (body.type !== undefined)          data.type = body.type;
  if (body.priority !== undefined)      data.priority = body.priority;
  if (body.color !== undefined)         data.color = body.color ?? null;
  if (body.isCompletable !== undefined) data.isCompletable = Boolean(body.isCompletable);
  if (body.isPinned !== undefined)      data.isPinned = Boolean(body.isPinned);

  const newTimeType = body.timeType ?? existing.timeType;
  if (body.timeType !== undefined) data.timeType = body.timeType;

  const typeChanged = body.timeType !== undefined && body.timeType !== existing.timeType;

  if (newTimeType === 'TIMED') {
    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.startTime !== undefined) data.startTime = body.startTime ?? null;
    if (body.endTime !== undefined) data.endTime = body.endTime ?? null;
    if (typeChanged) {
      data.rangeStartDate = null; data.rangeStartTime = null;
      data.rangeEndDate = null; data.rangeEndTime = null;
    }
  } else if (newTimeType === 'TIMED_OPEN') {
    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.startTime !== undefined) data.startTime = body.startTime ?? null;
    data.endTime = null;
    if (typeChanged) {
      data.rangeStartDate = null; data.rangeStartTime = null;
      data.rangeEndDate = null; data.rangeEndTime = null;
    }
  } else if (newTimeType === 'DEADLINE') {
    if (body.date !== undefined) data.date = new Date(body.date);
    if (typeChanged) {
      data.startTime = null; data.endTime = null;
      data.rangeStartDate = null; data.rangeStartTime = null;
      data.rangeEndDate = null; data.rangeEndTime = null;
    }
  } else if (newTimeType === 'ANYTIME') {
    if (typeChanged) {
      data.date = null; data.startTime = null; data.endTime = null;
      data.rangeStartDate = null; data.rangeStartTime = null;
      data.rangeEndDate = null; data.rangeEndTime = null;
    }
  } else if (newTimeType === 'DATE_RANGE') {
    if (body.rangeStartDate !== undefined) data.rangeStartDate = new Date(body.rangeStartDate);
    if (body.rangeStartTime !== undefined) data.rangeStartTime = body.rangeStartTime ?? null;
    if (body.rangeEndDate !== undefined)   data.rangeEndDate = new Date(body.rangeEndDate);
    if (body.rangeEndTime !== undefined)   data.rangeEndTime = body.rangeEndTime ?? null;
    if (typeChanged) {
      data.date = null; data.startTime = null; data.endTime = null;
    }
  }

  if (body.isRecurring !== undefined) {
    data.isRecurring = Boolean(body.isRecurring);
    if (!body.isRecurring) {
      data.recurrencePattern = null; data.recurrenceStart = null;
      data.recurrenceEnd = null; data.recurrenceDays = null; data.recurrenceDay = null;
    }
  }
  if (body.recurrencePattern !== undefined) data.recurrencePattern = body.recurrencePattern;
  if (body.recurrenceStart !== undefined)   data.recurrenceStart = new Date(body.recurrenceStart);
  if (body.recurrenceEnd !== undefined)     data.recurrenceEnd = body.recurrenceEnd ? new Date(body.recurrenceEnd) : null;
  if (body.recurrenceDays !== undefined) {
    data.recurrenceDays = Array.isArray(body.recurrenceDays)
      ? body.recurrenceDays.join(',')
      : body.recurrenceDays;
  }
  if (body.recurrenceDay !== undefined) data.recurrenceDay = body.recurrenceDay;

  if (body.isFlexibleSchedule !== undefined) {
    data.isFlexibleSchedule = Boolean(body.isFlexibleSchedule);
    if (!body.isFlexibleSchedule) data.schedulePattern = null;
  }
  if (body.schedulePattern !== undefined) data.schedulePattern = body.schedulePattern ?? null;

  return data;
};

// ─── Public service functions ─────────────────────────────────────────────────

export const getTask = async (userId, taskId) => {
  const task = await assertOwnership(userId, taskId);

  // For recurring tasks, also load which occurrences are completed
  let completedDates = null;
  if (task.isRecurring) {
    completedDates = await findCompletionsByTask(taskId);
  }

  return serializeTask(task, completedDates);
};

export const createTask = async (userId, body, warnings = []) => {
  const data = buildCreateData(body);
  const task = await createTaskRecord(userId, data);

  if (Array.isArray(body.tags) && body.tags.length > 0) {
    const tagIds = await resolveTagIds(userId, body.tags);
    await Promise.all(tagIds.map((tagId) => linkTagToTask(task.id, tagId)));
  }

  if (body.isFlexibleSchedule && Array.isArray(body.schedules)) {
    await replaceTaskSchedules(task.id, body.schedules);
  }

  const fullTask = await findTaskById(task.id);
  return { task: serializeTask(fullTask), warnings };
};

export const updateTask = async (userId, taskId, body, warnings = []) => {
  const existing = await assertOwnership(userId, taskId);
  const data = buildUpdateData(existing, body);
  await updateTaskRecord(taskId, data);

  if (Array.isArray(body.tags)) {
    const currentTagIds = (existing.tags || []).map((tt) => tt.tagId);
    const nextTagIds = await resolveTagIds(userId, body.tags);
    await replaceTaskTags(taskId, currentTagIds, nextTagIds);
  }

  const newIsFlexible = body.isFlexibleSchedule !== undefined
    ? Boolean(body.isFlexibleSchedule)
    : existing.isFlexibleSchedule;

  if (newIsFlexible && Array.isArray(body.schedules)) {
    await replaceTaskSchedules(taskId, body.schedules);
  } else if (!newIsFlexible && existing.isFlexibleSchedule) {
    await replaceTaskSchedules(taskId, []);
  }

  // If recurrence rule changed, remove completion records for dates that no longer exist.
  // Generate valid dates for the next 2 years as the pruning window.
  const updatedTask = await findTaskById(taskId);
  if (updatedTask.isRecurring) {
    const today = toDateStr(new Date());
    const twoYearsOut = toDateStr(new Date(Date.now() + 730 * 86400000));
    const validDateStrs = generateOccurrenceDates(updatedTask, today, twoYearsOut);
    const validDates = validDateStrs.map((s) => new Date(s));
    await pruneCompletions(taskId, validDates);
  }

  return { task: serializeTask(updatedTask), warnings };
};

export const deleteTask = async (userId, taskId) => {
  await assertOwnership(userId, taskId);
  // TaskCompletion rows are cascade-deleted by the DB relation
  await deleteTaskRecord(taskId);
};

export const toggleTask = async (userId, taskId, date) => {
  const task = await assertOwnership(userId, taskId);

  if (!task.isCompletable) {
    throw new ForbiddenError('This task is not completable');
  }

  // Recurring: toggle specific occurrence
  if (task.isRecurring) {
    if (!date) {
      throw new ValidationError('Validation failed', {
        date: 'date is required when toggling a recurring task',
      });
    }

    // Verify the date is a valid occurrence
    const occurrenceDateStr = typeof date === 'string' ? date : toDateStr(date);
    const validDates = generateOccurrenceDates(task, occurrenceDateStr, occurrenceDateStr);
    if (!validDates.includes(occurrenceDateStr)) {
      throw new ValidationError('Validation failed', {
        date: `${occurrenceDateStr} is not a valid occurrence date for this task`,
      });
    }

    const occurrenceDate = new Date(occurrenceDateStr);
    const { completed } = await toggleCompletion(taskId, occurrenceDate);

    const completedDates = await findCompletionsByTask(taskId);
    return { task: serializeTask(task, completedDates), toggledDate: occurrenceDateStr, completed };
  }

  // Non-recurring: simple boolean flip
  const updated = await toggleTaskRecord(taskId);
  return { task: serializeTask(updated), completed: updated.isCompleted };
};

export const listTasks = async (userId, query) => {
  const filters = {
    from: query.from,
    to: query.to,
    type: query.type,
    category: query.category,
    priority: query.priority,
    q: typeof query.q === 'string' && query.q.trim() ? query.q.trim() : undefined,
    tags: query.tags ? query.tags.split(',').map((t) => t.trim().toLowerCase()) : undefined,
    showCompleted: query.showCompleted !== 'false',
    limit: query.limit ? Number(query.limit) : 50,
    offset: query.offset ? Number(query.offset) : 0,
  };

  const { tasks, total, hasMore } = await findTasksByUser(userId, filters);
  return { tasks: tasks.map((t) => serializeTask(t)), total, hasMore };
};

export const addTagToTask = async (userId, taskId, tagName) => {
  await assertOwnership(userId, taskId);
  const tag = await findOrCreateTag(userId, tagName);
  await linkTagToTask(taskId, tag.id);
  const fullTask = await findTaskById(taskId);
  return serializeTask(fullTask);
};

export const removeTagFromTask = async (userId, taskId, tagId) => {
  await assertOwnership(userId, taskId);
  await unlinkTagFromTask(taskId, tagId);
  const fullTask = await findTaskById(taskId);
  return serializeTask(fullTask);
};