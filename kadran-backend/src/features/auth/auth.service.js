// src/features/auth/auth.service.js

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from './auth.db.js';
import { AuthenticationError, ConflictError } from '../../shared/utils/customErrors.js';

export const registerService = async (email, password, timeZone = 'Europe/Istanbul') => {
  // Email daha önce kullanılmış mı?
  const existing = await findUserByEmail(email);
  if (existing) throw new ConflictError('Email already registered');

  // Şifreyi hashle
  const hashedPassword = await bcrypt.hash(password, 10);

  // Kullanıcıyı oluştur
  const user = await createUser(email, hashedPassword, timeZone);

  // Token üret
  const token = generateToken(user);

  return {
    user: { id: user.id, email: user.email, timeZone: user.timeZone },
    token,
  };
};

export const loginService = async (email, password) => {
  // Kullanıcı var mı?
  const user = await findUserByEmail(email);
  if (!user) throw new AuthenticationError('Invalid email or password');

  // Şifre doğru mu?
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new AuthenticationError('Invalid email or password');

  const token = generateToken(user);

  return {
    user: { id: user.id, email: user.email, timeZone: user.timeZone },
    token,
  };
};

const generateToken = (user) => {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};