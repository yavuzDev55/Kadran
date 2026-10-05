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

// ─── Serialize ────────────────────────────────────────────────────────────────

export const serializeTask = (task) => {
  if (!task) return task;
  return {
    ...task,
    tags: (task.tags || []).map((taskTag) => taskTag.tag.name),
  };
};

// ─── Ownership ────────────────────────────────────────────────────────────────

const assertOwnership = async (userId, taskId) => {
  const task = await findTaskById(taskId);
  if (!task) throw new NotFoundError('Task', taskId);
  if (task.userId !== userId) throw new AuthorizationError('You do not have access to this task');
  return task;
};

// ─── Tags ─────────────────────────────────────────────────────────────────────

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

// ─── buildTaskData: CREATE (tüm alanlar zorunlu) ─────────────────────────────

const buildCreateData = (body) => {
  const base = {
    title: body.title,
    description: body.description ?? null,
    type: body.type,
    timeType: body.timeType,
    priority: body.priority ?? 'MEDIUM',
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
  if (body.timeType === 'DEADLINE') {
    return {
      ...base,
      date: new Date(body.date),
      startTime: null, endTime: null,
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

// ─── buildUpdateData: PATCH (sadece gelen alanları güncelle) ─────────────────
// existing: DB'den gelen mevcut kayıt
// body: frontend'den gelen kısmi veri

const buildUpdateData = (existing, body) => {
  // Temel alanlar: gönderilmişse üzerine yaz, gönderilmemişse eskisini koru
  const data = {};

  if (body.title !== undefined)       data.title = body.title;
  if (body.description !== undefined) data.description = body.description ?? null;
  if (body.type !== undefined)        data.type = body.type;
  if (body.priority !== undefined)    data.priority = body.priority;

  // timeType değiştiyse veya gönderildiyse zaman alanlarını yeniden hesapla
  const newTimeType = body.timeType ?? existing.timeType;
  if (body.timeType !== undefined) data.timeType = body.timeType;

  if (newTimeType === 'TIMED') {
    if (body.date !== undefined)      data.date = new Date(body.date);
    if (body.startTime !== undefined) data.startTime = body.startTime ?? null;
    if (body.endTime !== undefined)   data.endTime = body.endTime ?? null;
    // timeType değiştiyse eski range alanlarını temizle
    if (body.timeType !== undefined && existing.timeType !== 'TIMED') {
      data.rangeStartDate = null; data.rangeStartTime = null;
      data.rangeEndDate = null;   data.rangeEndTime = null;
    }
  } else if (newTimeType === 'DEADLINE') {
    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.timeType !== undefined && existing.timeType !== 'DEADLINE') {
      data.startTime = null; data.endTime = null;
      data.rangeStartDate = null; data.rangeStartTime = null;
      data.rangeEndDate = null;   data.rangeEndTime = null;
    }
  } else if (newTimeType === 'DATE_RANGE') {
    if (body.rangeStartDate !== undefined) data.rangeStartDate = new Date(body.rangeStartDate);
    if (body.rangeStartTime !== undefined) data.rangeStartTime = body.rangeStartTime ?? null;
    if (body.rangeEndDate !== undefined)   data.rangeEndDate = new Date(body.rangeEndDate);
    if (body.rangeEndTime !== undefined)   data.rangeEndTime = body.rangeEndTime ?? null;
    if (body.timeType !== undefined && existing.timeType !== 'DATE_RANGE') {
      data.date = null; data.startTime = null; data.endTime = null;
    }
  }

  // Recurrence: gönderildiyse güncelle
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

  // FlexibleSchedule
  if (body.isFlexibleSchedule !== undefined) {
    data.isFlexibleSchedule = Boolean(body.isFlexibleSchedule);
    if (!body.isFlexibleSchedule) data.schedulePattern = null;
  }
  if (body.schedulePattern !== undefined) data.schedulePattern = body.schedulePattern ?? null;

  return data;
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const getTask = async (userId, taskId) => {
  const task = await assertOwnership(userId, taskId);
  return serializeTask(task);
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

  // Kısmi güncelleme: mevcut kayıt + gelen alanlar
  const data = buildUpdateData(existing, body);
  await updateTaskRecord(taskId, data);

  if (Array.isArray(body.tags)) {
    const currentTagIds = (existing.tags || []).map((taskTag) => taskTag.tagId);
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
    type: query.type || query.category, // her iki parametre de çalışsın
    priority: query.priority,
    tags: query.tags ? query.tags.split(',').map((t) => t.trim().toLowerCase()) : undefined,
    // DÜZELTİLDİ: varsayılan olarak tamamlananları da göster
    showCompleted: query.showCompleted !== 'false',
    limit: query.limit ? Number(query.limit) : 50,
    offset: query.offset ? Number(query.offset) : 0,
  };

  const { tasks, total, hasMore } = await findTasksByUser(userId, filters);
  return { tasks: tasks.map(serializeTask), total, hasMore };
};