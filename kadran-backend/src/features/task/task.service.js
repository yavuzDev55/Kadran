// src/features/task/task.service.js

import { findTasksByUser, findTaskById, createTask, updateTask, deleteTask, toggleTask } from './task.db.js';
import { findOrCreateTag, addTagToTask, removeTagFromTask } from '../tag/tag.db.js';
import { AuthorizationError, NotFoundError } from '../../shared/utils/customErrors.js';
import prisma from '../../config/database.js';

export const getTasksService = (userId, query = {}) => {
  const filters = {
    from: query.from,
    to: query.to,
    tags: query.tags ? query.tags.split(',').map(t => t.trim()) : undefined,
    category: query.category,
    priority: query.priority,
    showCompleted: query.showCompleted === 'false' ? false : undefined,
    limit: Math.min(parseInt(query.limit) || 20, 100),
    offset: parseInt(query.offset) || 0,
  };

  return findTasksByUser(userId, filters);
};

export const createTaskService = async (userId, body) => {
  const {
    title, description, type, categoryId, timeType, date,
    startTime, endTime, reminderTime, priority,
    isRecurring, recurrencePattern, recurrenceDays,
    recurrenceStart, recurrenceEnd, recurrenceDay,
    tags = [],
  } = body;

  // Category bu kullanıcıya mı ait?
  const category = await prisma.category.findUnique({ where: { id: parseInt(categoryId) } });
  if (!category || category.userId !== userId) throw new NotFoundError('Category', categoryId);

  const task = await createTask(userId, {
    title,
    description,
    type,
    categoryId: parseInt(categoryId),
    timeType,
    date: new Date(date),
    startTime: timeType === 'HOURLY' ? startTime : null,
    endTime: timeType === 'HOURLY' ? endTime : null,
    reminderTime: timeType === 'REMINDER' ? reminderTime : null,
    priority: priority || 'MEDIUM',
    isRecurring: isRecurring || false,
    recurrencePattern: isRecurring ? recurrencePattern : null,
    recurrenceDays: isRecurring && recurrencePattern === 'WEEKLY' ? recurrenceDays : null,
    recurrenceStart: isRecurring ? new Date(recurrenceStart) : null,
    recurrenceEnd: isRecurring && recurrenceEnd ? new Date(recurrenceEnd) : null,
    recurrenceDay: isRecurring && recurrencePattern === 'MONTHLY' ? recurrenceDay : null,
  });

  // Etiketleri ekle
  if (tags.length > 0) {
    for (const name of tags) {
      const tag = await findOrCreateTag(userId, name.trim().toLowerCase());
      await addTagToTask(task.id, tag.id);
    }
  }

  return findTaskById(task.id);
};

export const updateTaskService = async (userId, taskId, body) => {
  const task = await findTaskById(taskId);
  if (!task) throw new NotFoundError('Task', taskId);
  if (task.userId !== userId) throw new AuthorizationError();

  // Sadece gönderilen alanları güncelle
  const allowed = [
    'title', 'description', 'type', 'categoryId', 'timeType', 'date',
    'startTime', 'endTime', 'reminderTime', 'priority',
    'isRecurring', 'recurrencePattern', 'recurrenceDays',
    'recurrenceStart', 'recurrenceEnd', 'recurrenceDay',
  ];

  const data = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      data[key] = body[key];
    }
  }

  // Date alanlarını parse et
  if (data.date) data.date = new Date(data.date);
  if (data.recurrenceStart) data.recurrenceStart = new Date(data.recurrenceStart);
  if (data.recurrenceEnd) data.recurrenceEnd = new Date(data.recurrenceEnd);
  if (data.categoryId) data.categoryId = parseInt(data.categoryId);

  return updateTask(taskId, data);
};

export const deleteTaskService = async (userId, taskId) => {
  const task = await findTaskById(taskId);
  if (!task) throw new NotFoundError('Task', taskId);
  if (task.userId !== userId) throw new AuthorizationError();

  return deleteTask(taskId);
};

export const toggleTaskService = async (userId, taskId) => {
  const task = await findTaskById(taskId);
  if (!task) throw new NotFoundError('Task', taskId);
  if (task.userId !== userId) throw new AuthorizationError();

  return toggleTask(taskId);
};

export const addTagsToTaskService = async (userId, taskId, tagNames) => {
  const task = await findTaskById(taskId);
  if (!task) throw new NotFoundError('Task', taskId);
  if (task.userId !== userId) throw new AuthorizationError();

  for (const name of tagNames) {
    const tag = await findOrCreateTag(userId, name.trim().toLowerCase());
    await addTagToTask(taskId, tag.id);
  }

  return findTaskById(taskId);
};

export const removeTagFromTaskService = async (userId, taskId, tagId) => {
  const task = await findTaskById(taskId);
  if (!task) throw new NotFoundError('Task', taskId);
  if (task.userId !== userId) throw new AuthorizationError();

  return removeTagFromTask(taskId, tagId);
};