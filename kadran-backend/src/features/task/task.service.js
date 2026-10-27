// src/features/task/task.service.js

import {
  findTaskById,
  findTasksByUser,
  createTask as createTaskRecord,
  updateTask as updateTaskRecord,
  deleteTask as deleteTaskRecord,
  setCompleted,
  deleteSeriesIfEmpty,
  updateSeriesTasks,
} from './task.db.js';
import { createSeriesWithTasks } from '../recurring/recurring.db.js';
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
import { getDayName, parseUTCDate, toDateStr } from '../../shared/utils/dateUtils.js';
import { TYPE_DEFAULT_COLORS, normalizeColor } from '../../config/colors.js';
import { generateOccurrenceDates } from '../recurring/recurring.service.js';
import { TASK_RULES } from './task.rules.js';
import { buildTimeFields, has } from './task.time.js';
import { validateTaskBody, validateTimeModel } from './task.validator.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const serializeTask = (task) => {
  if (!task) return task;
  const { tags, ...rest } = task;
  return {
    ...rest,
    tags: (tags || []).map((tt) => tt.tag.name),
    effectiveColor: task.color ?? TYPE_DEFAULT_COLORS[task.type] ?? '#94a3b8',
  };
};

const assertOwnership = async (userId, taskId) => {
  const task = await findTaskById(taskId);
  if (!task) throw new NotFoundError('Task', taskId);
  if (task.userId !== userId) throw new AuthorizationError('You do not have access to this task');
  return task;
};

/** Normalized, de-duplicated tag names -> tag ids. Sequential so a repeated name cannot race. */
export const resolveTagIds = async (userId, tagNames = []) => {
  const names = [...new Set(tagNames.map((name) => name.trim().toLowerCase()))];
  const ids = [];
  for (const name of names) {
    const tag = await findOrCreateTag(userId, name);
    ids.push(tag.id);
  }
  return ids;
};

const replaceTaskTags = async (taskId, currentTagIds, nextTagIds) => {
  const toRemove = currentTagIds.filter((id) => !nextTagIds.includes(id));
  const toAdd = nextTagIds.filter((id) => !currentTagIds.includes(id));
  for (const tagId of toRemove) await unlinkTagFromTask(taskId, tagId);
  for (const tagId of toAdd) await linkTagToTask(taskId, tagId);
};

const throwIfInvalid = (details) => {
  if (Object.keys(details).length > 0) throw new ValidationError('Validation failed', details);
};

const dateOnly = (value) => (value ? toDateStr(value) : null);

// ─── Create ───────────────────────────────────────────────────────────────────

/** Fields every new task gets, with the type's defaults applied. */
const buildCommonData = (body) => {
  const rule = TASK_RULES[body.type];
  return {
    title: body.title.trim(),
    description: has(body.description) ? body.description : null,
    type: body.type,
    timeType: body.timeType,
    priority: body.priority ?? rule.priority,
    isCompletable: body.isCompletable ?? rule.completable.default,
    color: normalizeColor(body.color) ?? null,
    isPinned: Boolean(body.isPinned),
  };
};

/**
 * Recurring task: one TaskSeries row (the rule) + one real task per occurrence date.
 * WEEKLY rules may override the clock times per weekday through `recurrence.slots`.
 */
const createSeries = async (userId, body, warnings) => {
  const { pattern, startDate, endDate, weekDays = [], monthDay, slots = {} } = body.recurrence;

  const dates = generateOccurrenceDates({ pattern, startDate, endDate, weekDays, monthDay });
  if (dates.length === 0) {
    throw new ValidationError('Validation failed', {
      recurrence: 'The recurrence rule produces no occurrences in the selected range',
    });
  }

  const common = buildCommonData(body);
  const seriesDescription = has(body.description) ? body.description : null;

  const tasks = dates.map((date) => {
    const slot = pattern === 'WEEKLY' ? slots[getDayName(date)] : undefined;
    const times = slot ?? { startTime: body.startTime, endTime: body.endTime };
    return {
      ...common,
      description: null,
      ...buildTimeFields(body.timeType, { date, ...times }),
    };
  });

  const tagIds = await resolveTagIds(userId, Array.isArray(body.tags) ? body.tags : []);

  const { series, firstTaskId, count } = await createSeriesWithTasks({
    userId,
    series: {
      pattern,
      description: seriesDescription,
      startDate: parseUTCDate(startDate),
      endDate: parseUTCDate(endDate),
      weekDays: pattern === 'WEEKLY' ? weekDays.join(',') : null,
      monthDay: pattern === 'MONTHLY' ? monthDay : null,
    },
    tasks,
    tagIds,
  });

  const first = await findTaskById(firstTaskId);
  return { task: serializeTask(first), warnings, series: { id: series.id, occurrences: count } };
};

export const createTask = async (userId, body, warnings = []) => {
  if (body.recurrence) return createSeries(userId, body, warnings);

  const data = { ...buildCommonData(body), ...buildTimeFields(body.timeType, body) };
  const task = await createTaskRecord(userId, data);

  if (Array.isArray(body.tags) && body.tags.length > 0) {
    const tagIds = await resolveTagIds(userId, body.tags);
    for (const tagId of tagIds) await linkTagToTask(task.id, tagId);
  }

  const fullTask = await findTaskById(task.id);
  return { task: serializeTask(fullTask), warnings, series: null };
};

// ─── Update ───────────────────────────────────────────────────────────────────

const OCCURRENCE_EDITABLE = ['date', 'startTime', 'endTime', 'isPinned', 'description'];
const MODEL_FIELDS = ['type', 'timeType', 'date', 'startTime', 'endTime', 'rangeStartDate', 'rangeEndDate'];

const pick = (body, key, fallback) => (key in body ? body[key] : fallback);

/**
 * One occurrence of a recurring series: only its day and clock time may change.
 * Pinning is the exception — it is kept identical across the whole series.
 */
const updateOccurrence = async (existing, body) => {
  const forbidden = Object.keys(body).filter((key) => !OCCURRENCE_EDITABLE.includes(key));
  if (forbidden.length > 0) {
    const details = {};
    forbidden.forEach((key) => {
      details[key] = 'Only the day and time of a recurring occurrence can be edited';
    });
    throw new ValidationError('Validation failed', details);
  }

  const data = {};
  const warnings = [];
  if (body.description !== undefined) data.description = body.description === '' ? null : body.description;

  const touchesTime = ['date', 'startTime', 'endTime'].some((key) => key in body);
  if (touchesTime) {
    const merged = {
      type: existing.type,
      timeType: existing.timeType,
      date: pick(body, 'date', dateOnly(existing.date)),
      startTime: pick(body, 'startTime', existing.startTime),
      endTime: pick(body, 'endTime', existing.endTime),
    };
    const details = {};
    validateTimeModel(merged, details, warnings);
    throwIfInvalid(details);
    Object.assign(data, buildTimeFields(existing.timeType, merged));
  }

  if (body.isPinned !== undefined) {
    await updateSeriesTasks(existing.seriesId, { isPinned: Boolean(body.isPinned) });
  }

  const updated = Object.keys(data).length > 0
    ? await updateTaskRecord(existing.id, data)
    : await findTaskById(existing.id);
  return { task: serializeTask(updated), warnings };
};

export const updateTask = async (userId, taskId, body) => {
  const existing = await assertOwnership(userId, taskId);

  if (existing.seriesId !== null) return updateOccurrence(existing, body);

  const warnings = [];
  const data = {};

  ['title', 'description', 'priority', 'color', 'isCompletable', 'isPinned'].forEach((key) => {
    if (body[key] !== undefined) data[key] = body[key];
  });
  if (body.color !== undefined) data.color = normalizeColor(body.color);
  if (body.title !== undefined) data.title = body.title.trim();
  if (body.description === '') data.description = null;

  // Type / time changes are validated on the merged result. Old rows are left alone when a
  // request only touches simple fields (e.g. pinning), so they can never get "stuck".
  const touchesModel = MODEL_FIELDS.some((key) => key in body);
  if (touchesModel) {
    const timeTypeChanged = body.timeType !== undefined && body.timeType !== existing.timeType;
    const timeKeys = ['date', 'startTime', 'endTime', 'rangeStartDate', 'rangeEndDate'];

    // A different time type starts from a clean slate; otherwise the stored values are kept
    const stored = timeTypeChanged
      ? {}
      : {
          date: dateOnly(existing.date),
          startTime: existing.startTime,
          endTime: existing.endTime,
          rangeStartDate: dateOnly(existing.rangeStartDate),
          rangeEndDate: dateOnly(existing.rangeEndDate),
        };

    const merged = {
      title: data.title ?? existing.title,
      type: pick(body, 'type', existing.type),
      timeType: pick(body, 'timeType', existing.timeType),
      isCompletable: body.isCompletable,
    };
    timeKeys.forEach((key) => {
      merged[key] = pick(body, key, stored[key]);
    });

    const { details, warnings: modelWarnings } = validateTaskBody(merged, { allowRecurrence: false });
    throwIfInvalid(details);
    warnings.push(...modelWarnings);

    data.type = merged.type;
    data.timeType = merged.timeType;
    Object.assign(data, buildTimeFields(merged.timeType, merged));

    // Switching to a type that fixes the flag (homework) resets it to that type's default
    const completable = TASK_RULES[merged.type].completable;
    if (!completable.editable) data.isCompletable = completable.default;
  }

  await updateTaskRecord(taskId, data);

  if (Array.isArray(body.tags)) {
    const currentTagIds = (existing.tags || []).map((tt) => tt.tagId);
    const nextTagIds = await resolveTagIds(userId, body.tags);
    await replaceTaskTags(taskId, currentTagIds, nextTagIds);
  }

  return { task: serializeTask(await findTaskById(taskId)), warnings };
};

// ─── Delete / complete ────────────────────────────────────────────────────────

/** Deletes a single task. For a series this removes just that occurrence. */
export const deleteTask = async (userId, taskId) => {
  const task = await assertOwnership(userId, taskId);
  await deleteTaskRecord(taskId);
  await deleteSeriesIfEmpty(task.seriesId);
};

export const toggleTask = async (userId, taskId) => {
  const task = await assertOwnership(userId, taskId);
  if (!task.isCompletable) throw new ForbiddenError('This task is not completable');

  const updated = await setCompleted(taskId, !task.isCompleted);
  return { task: serializeTask(updated), completed: updated.isCompleted };
};

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getTask = async (userId, taskId) => serializeTask(await assertOwnership(userId, taskId));

export const listTasks = async (userId, filters) => {
  const { tasks, total, hasMore } = await findTasksByUser(userId, filters);
  return { tasks: tasks.map(serializeTask), total, hasMore };
};

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const addTagToTask = async (userId, taskId, tagName) => {
  await assertOwnership(userId, taskId);
  const tag = await findOrCreateTag(userId, tagName);
  await linkTagToTask(taskId, tag.id);
  return serializeTask(await findTaskById(taskId));
};

export const removeTagFromTask = async (userId, taskId, tagId) => {
  await assertOwnership(userId, taskId);
  await unlinkTagFromTask(taskId, tagId);
  return serializeTask(await findTaskById(taskId));
};
