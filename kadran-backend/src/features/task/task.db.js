// src/features/task/task.db.js

import prisma from '../../config/database.js';

// Task'ı ilişkileriyle birlikte getiren yardımcı include bloğu
const taskInclude = {
  category: true,
  tags: { include: { tag: true } },
};

export const findTasksByUser = async (userId, filters = {}) => {
  const { from, to, tags, category, priority, showCompleted, limit = 20, offset = 0 } = filters;

  const where = { userId };

  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

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
      orderBy: { date: 'asc' },
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