// src/features/task/task.db.js

import prisma from '../../config/database.js';

const taskInclude = {
  tags: { include: { tag: true } },
  schedules: true,
  completions: true, // TaskCompletion rows — used to resolve per-occurrence isCompleted
};

// ─── Task queries ─────────────────────────────────────────────────────────────

export const findTasksByUser = async (userId, filters = {}) => {
  const { from, to, tags, type, category, priority, showCompleted, q, limit = 50, offset = 0 } = filters;

  const where = { userId };

  if (from || to) {
    where.OR = [
      {
        date: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      },
      {
        rangeStartDate: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      },
    ];
  }

  // Support both ?type= and legacy ?category= parameter
  const typeFilter = type || category;
  if (typeFilter) where.type = typeFilter;
  if (priority) where.priority = priority;

  // Case-insensitive title search (dashboard search panel)
  if (q) where.title = { contains: q, mode: 'insensitive' };

  // showCompleted=false hides completed tasks; default is to show all
  if (showCompleted === false) where.isCompleted = false;

  if (tags && tags.length > 0) {
    where.tags = { some: { tag: { name: { in: tags } } } };
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ date: 'asc' }, { rangeStartDate: 'asc' }],
      take: limit,
      skip: offset,
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total, hasMore: offset + limit < total };
};

export const findTaskById = (id) =>
  prisma.task.findUnique({ where: { id }, include: taskInclude });

export const createTask = (userId, data) =>
  prisma.task.create({ data: { ...data, userId }, include: taskInclude });

export const updateTask = (id, data) =>
  prisma.task.update({ where: { id }, data, include: taskInclude });

export const deleteTask = (id) =>
  prisma.task.delete({ where: { id } });

// Used only for non-recurring tasks (simple boolean flip)
export const toggleTask = async (id) => {
  const task = await findTaskById(id);
  return prisma.task.update({
    where: { id },
    data: { isCompleted: !task.isCompleted },
    include: taskInclude,
  });
};

export const replaceTaskSchedules = (taskId, schedules) =>
  prisma.$transaction([
    prisma.taskSchedule.deleteMany({ where: { taskId } }),
    prisma.taskSchedule.createMany({
      data: schedules.map((s) => ({
        taskId,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
    }),
  ]);

// ─── TaskCompletion queries ───────────────────────────────────────────────────

// Returns a Set of 'YYYY-MM-DD' strings for completed occurrences of a task
export const findCompletionsByTask = async (taskId) => {
  const rows = await prisma.taskCompletion.findMany({ where: { taskId } });
  return new Set(rows.map((r) => r.occurrenceDate.toISOString().slice(0, 10)));
};

// Returns a Map<taskId, Set<'YYYY-MM-DD'>> for a list of task ids — single query, no N+1
export const findCompletionsByTaskIds = async (taskIds) => {
  if (!taskIds.length) return new Map();

  const rows = await prisma.taskCompletion.findMany({
    where: { taskId: { in: taskIds } },
  });

  const map = new Map();
  for (const row of rows) {
    const dateStr = row.occurrenceDate.toISOString().slice(0, 10);
    if (!map.has(row.taskId)) map.set(row.taskId, new Set());
    map.get(row.taskId).add(dateStr);
  }
  return map;
};

// Toggle: insert if absent, delete if present. Returns { completed: boolean }
export const toggleCompletion = async (taskId, occurrenceDate) => {
  const existing = await prisma.taskCompletion.findUnique({
    where: { taskId_occurrenceDate: { taskId, occurrenceDate } },
  });

  if (existing) {
    await prisma.taskCompletion.delete({ where: { id: existing.id } });
    return { completed: false };
  }

  await prisma.taskCompletion.create({ data: { taskId, occurrenceDate } });
  return { completed: true };
};

// Removes completion records that no longer match valid occurrence dates
export const pruneCompletions = async (taskId, validDates) => {
  if (!validDates || validDates.length === 0) {
    await prisma.taskCompletion.deleteMany({ where: { taskId } });
    return;
  }
  await prisma.taskCompletion.deleteMany({
    where: {
      taskId,
      occurrenceDate: { notIn: validDates },
    },
  });
};