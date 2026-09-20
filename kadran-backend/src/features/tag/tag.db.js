// src/features/tag/tag.db.js

import prisma from '../../config/database.js';

export const findTagsByUser = (userId) => {
  return prisma.tag.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });
};

export const findTagById = (id) => {
  return prisma.tag.findUnique({ where: { id } });
};

// Tag varsa getir, yoksa oluştur
export const findOrCreateTag = async (userId, name) => {
  const existing = await prisma.tag.findFirst({ where: { name, userId } });
  if (existing) return existing;
  return prisma.tag.create({ data: { name, userId } });
};

export const addTagToTask = (taskId, tagId) => {
  return prisma.taskTag.upsert({
    where: { taskId_tagId: { taskId, tagId } },
    create: { taskId, tagId },
    update: {},
  });
};

export const removeTagFromTask = (taskId, tagId) => {
  return prisma.taskTag.delete({
    where: { taskId_tagId: { taskId, tagId } },
  });
};

export const deleteTag = (id) => {
  return prisma.tag.delete({ where: { id } });
};