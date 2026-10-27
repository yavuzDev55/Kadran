// src/features/auth/auth.validator.js

import { ValidationError } from '../../shared/utils/customErrors.js';
import { isValidTimezone } from '../../shared/utils/dateUtils.js';

export const validateRegister = (req, res, next) => {
  try {
    const { email, password, timeZone } = req.body;
    const errors = [];

    // Email (non-strings are rejected before string methods run, so they never reach a 500)
    if (email === undefined || email === null || email === '') {
      errors.push('Email is required');
    } else if (typeof email !== 'string') {
      errors.push('Email must be a string');
    } else if (email.trim() === '') {
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

    if (timeZone !== undefined && timeZone !== null && !isValidTimezone(timeZone)) {
      errors.push('Invalid time zone');
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

    if (email === undefined || email === null || email === '') {
      errors.push('Email is required');
    } else if (typeof email !== 'string') {
      errors.push('Email must be a string');
    } else if (email.trim() === '') {
      errors.push('Email is required');
    }
    if (!password) errors.push('Password is required');

    if (errors.length > 0) throw new ValidationError('Login validation failed', { errors });

    next();
  } catch (error) {
    next(error);
  }
};