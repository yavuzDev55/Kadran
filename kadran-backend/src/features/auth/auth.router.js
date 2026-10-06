// src/features/auth/auth.router.js

import { Router } from 'express';
import { validateRegister, validateLogin } from './auth.validator.js';
import {
  register,
  login,
  getMe,
  updateSettings,
  changePassword,
  deleteAccount,
} from './auth.controller.js';
import { authMiddleware } from '../../shared/middlewares/auth.middleware.js';

const router = Router();

// Public
router.post('/register', validateRegister, register);

router.post('/login', validateLogin, login);

// Protected — auth middleware applied per-route here since /auth is mounted without it
router.get('/me',              authMiddleware, getMe);

router.patch('/me',            authMiddleware, updateSettings);

router.patch('/me/password',   authMiddleware, changePassword);

router.delete('/me',           authMiddleware, deleteAccount);


export default router;