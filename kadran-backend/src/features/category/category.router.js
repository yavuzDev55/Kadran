// src/features/category/category.router.js

import { Router } from 'express';
import { validateCreateCategory, validateUpdateCategory, validateCategoryId } from './category.validator.js';
import { getCategories, createCategory, updateCategory, deleteCategory } from './category.controller.js';

const router = Router();

// GET /categories
router.get('/', getCategories);

// POST /categories
router.post('/', validateCreateCategory, createCategory);

// PATCH /categories/:id
router.patch('/:id', validateCategoryId, validateUpdateCategory, updateCategory);

// DELETE /categories/:id
router.delete('/:id', validateCategoryId, deleteCategory);

export default router;