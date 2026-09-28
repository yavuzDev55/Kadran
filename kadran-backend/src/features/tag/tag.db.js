// src/features/tag/tag.db.js
// v3: findOrCreateTag and findTagsByUser now compare names in their
// lowercase-normalized form (see v3 doc §3.2).

import prisma from '../../config/database.js';

const normalizeTagName = (name) => name.trim().toLowerCase();

export const findTagsByUser = (userId, filter = null) => {
  const where = { userId };

  if (filter) {
    where.name = { contains: normalizeTagName(filter) };
  }

  return prisma.tag.findMany({
    where,
    orderBy: { name: 'asc' },
  });
};

export const findTagById = (id) => {
  return prisma.tag.findUnique({ where: { id } });
};

// Return the tag if it exists, otherwise create it
export const findOrCreateTag = async (userId, name) => {
  const normalized = normalizeTagName(name);
  const existing = await prisma.tag.findFirst({ where: { name: normalized, userId } });
  if (existing) return existing;
  return prisma.tag.create({ data: { name: normalized, userId } });
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
