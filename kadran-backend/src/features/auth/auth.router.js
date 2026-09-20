// src/features/auth/auth.router.js

import { Router } from 'express';
import { validateRegister, validateLogin } from './auth.validator.js';
import { register, login } from './auth.controller.js';

const router = Router();

// POST /auth/register
router.post('/register', validateRegister, register);

// POST /auth/login
router.post('/login', validateLogin, login);

export default router;