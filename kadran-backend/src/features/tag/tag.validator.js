// src/features/tag/tag.validator.js

import { ValidationError } from '../../shared/utils/customErrors.js';

export const validateTagId = (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) throw new ValidationError('Invalid tag ID');
    req.params.id = id;
    next();
  } catch (error) {
    next(error);
  }
};

export const validateTagNames = (req, res, next) => {
  try {
    const { tagNames } = req.body;
    const errors = [];

    if (!tagNames || !Array.isArray(tagNames)) {
      errors.push('tagNames must be an array');
    } else if (tagNames.length === 0) {
      errors.push('tagNames cannot be empty');
    } else {
      tagNames.forEach((tag, i) => {
        if (typeof tag !== 'string' || tag.trim() === '') {
          errors.push(`Tag at index ${i} is invalid`);
        }
      });
    }

    if (errors.length > 0) throw new ValidationError('Tag validation failed', { errors });

    next();
  } catch (error) {
    next(error);
  }
};