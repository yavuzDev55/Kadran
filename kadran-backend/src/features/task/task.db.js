// src/features/task/task.db.js
// v3: removed `category: true` from the include block (the Category model
// is being removed). The from/to filter now covers both TIMED/DEADLINE
// (`date`) and DATE_RANGE (`rangeStartDate`/`rangeEndDate`) fields.
// `schedules` is included and replaceTaskSchedules was added to support
// isFlexibleSchedule / TaskSchedule.

import prisma from '../../config/database.js';

const taskInclude = {
  tags: { include: { tag: true } },
  schedules: true,
};

export const findTasksByUser = async (userId, filters = {}) => {
  const { from, to, tags, category, priority, showCompleted, limit = 20, offset = 0 } = filters;

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

  // v3: the 'category' filter now matches the TaskType enum (Task.type),
  // not a Category relation.
  if (category) where.type = category;
  if (priority) where.priority = priority;
  if (showCompleted === false) where.isCompleted = false;

  if (tags && tags.length > 0) {
    where.tags = {
      some: { tag: { name: { in: tags } } },
    };
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

export const findTaskById = (id) => {
  return prisma.task.findUnique({ where: { id }, include: taskInclude });
};

export const createTask = (userId, data) => {
  return prisma.task.create({
    data: { ...data, userId },
    include: taskInclude,
  });
};

export const updateTask = (id, data) => {
  return prisma.task.update({
    where: { id },
    data,
    include: taskInclude,
  });
};

export const deleteTask = (id) => {
  return prisma.task.delete({ where: { id } });
};

export const toggleTask = async (id) => {
  const task = await findTaskById(id);
  return prisma.task.update({
    where: { id },
    data: { isCompleted: !task.isCompleted },
    include: taskInclude,
  });
};

// v3: fully replaces the weekly slot list for isFlexibleSchedule=true
// tasks (deletes existing rows, inserts the new ones). Passing an empty
// array clears all slots (used when a task leaves flexible-schedule mode).
export const replaceTaskSchedules = (taskId, schedules) => {
  return prisma.$transaction([
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
};
