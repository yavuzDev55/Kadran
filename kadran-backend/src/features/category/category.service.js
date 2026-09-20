// src/features/category/category.service.js

import {
  findCategoriesByUser,
  findCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from './category.db.js';
import { AuthorizationError, NotFoundError } from '../../shared/utils/customErrors.js';

export const getCategoriesService = (userId) => {
  return findCategoriesByUser(userId);
};

export const createCategoryService = (userId, name, color) => {
  return createCategory(userId, name, color);
};

export const updateCategoryService = async (userId, categoryId, data) => {
  const category = await findCategoryById(categoryId);

  if (!category) throw new NotFoundError('Category', categoryId);
  if (category.userId !== userId) throw new AuthorizationError();

  return updateCategory(categoryId, data);
};

export const deleteCategoryService = async (userId, categoryId) => {
  const category = await findCategoryById(categoryId);

  if (!category) throw new NotFoundError('Category', categoryId);
  if (category.userId !== userId) throw new AuthorizationError();

  return deleteCategory(categoryId);
};