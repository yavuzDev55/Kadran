// src/features/category/category.db.js

import prisma from '../../config/database.js';

export const findCategoriesByUser = (userId) => {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });
};

export const findCategoryById = (id) => {
  return prisma.category.findUnique({ where: { id } });
};

export const createCategory = (userId, name, color) => {
  return prisma.category.create({
    data: { name, color, userId },
  });
};

export const updateCategory = (id, data) => {
  return prisma.category.update({
    where: { id },
    data,
  });
};

export const deleteCategory = (id) => {
  return prisma.category.delete({ where: { id } });
};