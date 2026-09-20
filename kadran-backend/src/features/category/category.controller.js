// src/features/category/category.controller.js

import {
  getCategoriesService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
} from './category.service.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await getCategoriesService(req.user.id);
    res.json({ categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, color } = req.body;
    const category = await createCategoryService(req.user.id, name, color);
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, color } = req.body;
    // Sadece gönderilen alanları güncelle
    const data = {};
    if (name !== undefined) data.name = name;
    if (color !== undefined) data.color = color;

    const category = await updateCategoryService(req.user.id, req.params.id, data);
    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    await deleteCategoryService(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};