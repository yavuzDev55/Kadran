// src/features/auth/auth.service.js

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  findUserByEmail,
  findUserById,
  findUserByIdWithPassword,
  createUser,
  updateUserSettings,
  updateUserPassword,
  deleteUserById,
} from './auth.db.js';
import {
  AuthenticationError,
  ConflictError,
  ValidationError,
  NotFoundError,
} from '../../shared/utils/customErrors.js';
import { isValidTimezone } from '../../shared/utils/dateUtils.js';

const VALID_WEEK_STARTS = ['MONDAY', 'SUNDAY'];
const VALID_TIME_FORMATS = ['H24', 'H12'];
const VALID_VIEWS = ['WEEK', 'MONTH'];

const generateToken = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  timeZone: user.timeZone,
  weekStartsOn: user.weekStartsOn,
  dayStartHour: user.dayStartHour,
  dayEndHour: user.dayEndHour,
  timeFormat: user.timeFormat,
  defaultView: user.defaultView,
  hideCompleted: user.hideCompleted,
});

export const registerService = async (email, password, timeZone = 'Europe/Istanbul') => {
  const existing = await findUserByEmail(email);
  if (existing) throw new ConflictError('Email already registered');

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await createUser(email, hashedPassword, timeZone);
  const token = generateToken(user);

  return {
    success: true,
    data: { user: serializeUser(user), token },
  };
};

export const loginService = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) throw new AuthenticationError('Invalid email or password');

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new AuthenticationError('Invalid email or password');

  const token = generateToken(user);

  return {
    success: true,
    data: { user: serializeUser(user), token },
  };
};

export const getMeService = async (userId) => {
  const user = await findUserById(userId);
  if (!user) throw new NotFoundError('User', userId);
  return { success: true, data: serializeUser(user) };
};

export const updateSettingsService = async (userId, body) => {
  const details = {};
  const data = {};

  if (body.timeZone !== undefined) {
    if (!isValidTimezone(body.timeZone)) {
      details.timeZone = 'Must be a valid IANA timezone (e.g. Europe/Istanbul)';
    } else {
      data.timeZone = body.timeZone;
    }
  }

  if (body.weekStartsOn !== undefined) {
    if (!VALID_WEEK_STARTS.includes(body.weekStartsOn)) {
      details.weekStartsOn = 'Must be MONDAY or SUNDAY';
    } else {
      data.weekStartsOn = body.weekStartsOn;
    }
  }

  if (body.dayStartHour !== undefined) {
    const h = Number(body.dayStartHour);
    if (!Number.isInteger(h) || h < 0 || h > 23) {
      details.dayStartHour = 'Must be an integer between 0 and 23';
    } else {
      data.dayStartHour = h;
    }
  }

  if (body.dayEndHour !== undefined) {
    const h = Number(body.dayEndHour);
    if (!Number.isInteger(h) || h < 1 || h > 24) {
      details.dayEndHour = 'Must be an integer between 1 and 24';
    } else {
      data.dayEndHour = h;
    }
  }

  // Validate start < end after collecting both
  const startHour = data.dayStartHour;
  const endHour = data.dayEndHour;
  if (startHour !== undefined && endHour !== undefined && startHour >= endHour) {
    details.dayStartHour = 'dayStartHour must be less than dayEndHour';
  }

  if (body.timeFormat !== undefined) {
    if (!VALID_TIME_FORMATS.includes(body.timeFormat)) {
      details.timeFormat = 'Must be H24 or H12';
    } else {
      data.timeFormat = body.timeFormat;
    }
  }

  if (body.defaultView !== undefined) {
    if (!VALID_VIEWS.includes(body.defaultView)) {
      details.defaultView = 'Must be WEEK or MONTH';
    } else {
      data.defaultView = body.defaultView;
    }
  }

  if (body.hideCompleted !== undefined) {
    data.hideCompleted = Boolean(body.hideCompleted);
  }

  if (Object.keys(details).length > 0) {
    throw new ValidationError('Validation failed', details);
  }

  if (Object.keys(data).length === 0) {
    // Nothing to update — just return current settings
    return getMeService(userId);
  }

  const updated = await updateUserSettings(userId, data);
  return { success: true, data: serializeUser(updated) };
};

export const changePasswordService = async (userId, currentPassword, newPassword) => {
  const details = {};

  if (!currentPassword) details.currentPassword = 'Current password is required';
  if (!newPassword) details.newPassword = 'New password is required';

  if (Object.keys(details).length > 0) throw new ValidationError('Validation failed', details);

  // Validate new password strength (same rules as register)
  if (newPassword.length < 8)         details.newPassword = 'Must be at least 8 characters';
  if (!/[A-Z]/.test(newPassword))     details.newPassword = 'Must contain an uppercase letter';
  if (!/[0-9]/.test(newPassword))     details.newPassword = 'Must contain a number';

  if (Object.keys(details).length > 0) throw new ValidationError('Validation failed', details);

  const user = await findUserByIdWithPassword(userId);
  if (!user) throw new NotFoundError('User', userId);

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) throw new ValidationError('Validation failed', { currentPassword: 'Incorrect password' });

  const hashed = await bcrypt.hash(newPassword, 10);
  await updateUserPassword(userId, hashed);

  return { success: true, data: { message: 'Password updated successfully' } };
};

export const deleteAccountService = async (userId, password) => {
  if (!password) {
    throw new ValidationError('Validation failed', { password: 'Password is required to delete account' });
  }

  const user = await findUserByIdWithPassword(userId);
  if (!user) throw new NotFoundError('User', userId);

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new ValidationError('Validation failed', { password: 'Incorrect password' });
  }

  // Cascade deletes tasks, tags, completions via DB relations
  await deleteUserById(userId);

  return { success: true, data: { message: 'Account deleted successfully' } };
};