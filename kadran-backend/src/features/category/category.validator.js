// src/features/category/category.validator.js

import { ValidationError } from '../../shared/utils/customErrors.js';

export const validateCreateCategory = (req, res, next) => {
  try {
    const { name, color } = req.body;
    const errors = [];

    // Name
    if (!name || name.trim() === '') {
      errors.push('Name is required');
    } else if (name.length > 50) {
      errors.push('Name must be 50 characters or less');
    }

    // Color (hex format: #FFF veya #FFFFFF)
    if (!color) {
      errors.push('Color is required');
    } else if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      errors.push('Color must be a valid hex code (e.g. #FF5733)');
    }

    if (errors.length > 0) throw new ValidationError('Category validation failed', { errors });

    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateCategory = (req, res, next) => {
  try {
    const { name, color } = req.body;
    const errors = [];

    if (name !== undefined) {
      if (name.trim() === '') errors.push('Name cannot be empty');
      if (name.length > 50) errors.push('Name must be 50 characters or less');
    }

    if (color !== undefined) {
      if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
        errors.push('Color must be a valid hex code (e.g. #FF5733)');
      }
    }

    if (errors.length > 0) throw new ValidationError('Category update validation failed', { errors });

    next();
  } catch (error) {
    next(error);
  }
};

export const validateCategoryId = (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) throw new ValidationError('Invalid category ID');
    req.params.id = id;
    next();
  } catch (error) {
    next(error);
  }
};