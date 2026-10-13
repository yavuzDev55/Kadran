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
