// src/features/task/task.service.js

import {
  findTaskById,
  findTasksByUser,
  createTask as createTaskRecord,
  updateTask as updateTaskRecord,
  deleteTask as deleteTaskRecord,
  toggleTask as toggleTaskRecord,
  replaceTaskSchedules,
} from './task.db.js';
import {
  findOrCreateTag,
  addTagToTask as linkTagToTask,
  removeTagFromTask as unlinkTagFromTask,
} from '../tag/tag.db.js';
import { NotFoundError, AuthorizationError } from '../../shared/utils/customErrors.js';

const serializeTask = (task) => {
  if (!task) return task;
  return {
    ...task,
    tags: (task.tags || []).map((taskTag) => taskTag.tag.name),
  };
};

const resolveTagIds = async (userId, tagNames = []) => {
  const tags = await Promise.all(tagNames.map((name) => findOrCreateTag(userId, name)));
  return tags.map((tag) => tag.id);
};

const replaceTaskTags = async (taskId, currentTagIds, nextTagIds) => {
  const toRemove = currentTagIds.filter((id) => !nextTagIds.includes(id));
  const toAdd = nextTagIds.filter((id) => !currentTagIds.includes(id));

  await Promise.all([
    ...toRemove.map((tagId) => unlinkTagFromTask(taskId, tagId)),
    ...toAdd.map((tagId) => linkTagToTask(taskId, tagId)),
  ]);
};

const buildTaskData = (body) => {
  const base = {
    title: body.title,
    description: body.description ?? null,
    type: body.type,
    timeType: body.timeType,
    priority: body.priority ?? 'MEDIUM',
    isFlexibleSchedule: Boolean(body.isFlexibleSchedule),
    schedulePattern: body.isFlexibleSchedule ? body.schedulePattern ?? null : null,
    isRecurring: Boolean(body.isRecurring),
    recurrencePattern: body.isRecurring ? body.recurrencePattern : null,
    recurrenceStart: body.isRecurring ? new Date(body.recurrenceStart) : null,
    recurrenceEnd: body.isRecurring && body.recurrenceEnd ? new Date(body.recurrenceEnd) : null,
    recurrenceDays:
      body.isRecurring && body.recurrencePattern === 'WEEKLY'
        ? body.recurrenceDays.join(',')
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
      rangeStartDate: null,
      rangeStartTime: null,
      rangeEndDate: null,
      rangeEndTime: null,
    };
  }

  if (body.timeType === 'DEADLINE') {
    return {
      ...base,
      date: new Date(body.date),
      startTime: null,
      endTime: null,
      rangeStartDate: null,
      rangeStartTime: null,
      rangeEndDate: null,
      rangeEndTime: null,
    };
  }

  // DATE_RANGE
  return {
    ...base,
    date: null,
    startTime: null,
    endTime: null,
    rangeStartDate: new Date(body.rangeStartDate),
    rangeStartTime: body.rangeStartTime ?? null,
    rangeEndDate: new Date(body.rangeEndDate),
    rangeEndTime: body.rangeEndTime ?? null,
  };
};

const assertOwnership = async (userId, taskId) => {
  const task = await findTaskById(taskId);
  if (!task) {
    throw new NotFoundError('Task', taskId);
  }
  if (task.userId !== userId) {
    throw new AuthorizationError('You do not have access to this task');
  }
  return task;
};

export const createTask = async (userId, body, warnings = []) => {
  const data = buildTaskData(body);
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

  const data = buildTaskData(body);
  await updateTaskRecord(taskId, data);

  if (Array.isArray(body.tags)) {
    const currentTagIds = (existing.tags || []).map((taskTag) => taskTag.tagId);
    const nextTagIds = await resolveTagIds(userId, body.tags);
    await replaceTaskTags(taskId, currentTagIds, nextTagIds);
  }

  if (body.isFlexibleSchedule) {
    await replaceTaskSchedules(taskId, body.schedules || []);
  } else if (existing.isFlexibleSchedule) {
    // Task was flexible before but no longer is -> clear old slots
    await replaceTaskSchedules(taskId, []);
  }

  const fullTask = await findTaskById(taskId);
  return { task: serializeTask(fullTask), warnings };
};

export const deleteTask = async (userId, taskId) => {
  await assertOwnership(userId, taskId);
  await deleteTaskRecord(taskId);
};

export const toggleTask = async (userId, taskId) => {
  await assertOwnership(userId, taskId);
  const updated = await toggleTaskRecord(taskId);
  return serializeTask(updated);
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

export const listTasks = async (userId, query) => {
  const filters = {
    from: query.from,
    to: query.to,
    category: query.category,
    priority: query.priority,
    tags: query.tags ? query.tags.split(',').map((tag) => tag.trim().toLowerCase()) : undefined,
    showCompleted: query.showCompleted === 'true',
    limit: query.limit ? Number(query.limit) : undefined,
    offset: query.offset ? Number(query.offset) : undefined,
  };

  const { tasks, total, hasMore } = await findTasksByUser(userId, filters);
  return { tasks: tasks.map(serializeTask), total, hasMore };
};
