// src/features/auth/auth.validator.js

import { ValidationError } from '../../shared/utils/customErrors.js';

export const validateRegister = (req, res, next) => {
  try {
    const { email, password, timeZone } = req.body;
    const errors = [];

    // Email
    if (!email || email.trim() === '') {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Invalid email format');
    }

    // Password
    if (!password) {
      errors.push('Password is required');
    } else {
      if (password.length < 8) errors.push('Password must be at least 8 characters');
      if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter');
      if (!/[0-9]/.test(password)) errors.push('Password must contain a number');
    }

    if (errors.length > 0) throw new ValidationError('Register validation failed', { errors });

    next();
  } catch (error) {
    next(error);
  }
};

export const validateLogin = (req, res, next) => {
  try {
    const { email, password } = req.body;
    const errors = [];

    if (!email || email.trim() === '') errors.push('Email is required');
    if (!password) errors.push('Password is required');

    if (errors.length > 0) throw new ValidationError('Login validation failed', { errors });

    next();
  } catch (error) {
    next(error);
  }
};