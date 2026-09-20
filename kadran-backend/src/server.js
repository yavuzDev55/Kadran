// src/server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { authMiddleware } from './shared/middlewares/auth.middleware.js';
import { errorHandler } from './shared/middlewares/errorHandler.middleware.js';

import authRouter from './features/auth/auth.router.js';
import categoryRouter from './features/category/category.router.js';
import tagRouter from './features/tag/tag.router.js';
import taskRouter from './features/task/task.router.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============ GLOBAL MIDDLEWARES ============

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// ============ PUBLIC ROUTES ============

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/auth', authRouter);

// ============ PROTECTED ROUTES ============
// authMiddleware: Token olmadan giremez

app.use('/categories', authMiddleware, categoryRouter);
app.use('/tags', authMiddleware, tagRouter);
app.use('/tasks', authMiddleware, taskRouter);

// ============ 404 ============

app.use((req, res) => {
  res.status(404).json({ success: false, error: { message: 'Route not found' } });
});

// ============ ERROR HANDLER (en sonda olmalı) ============

app.use(errorHandler);

// ============ START ============

app.listen(PORT, () => {
  console.log(`✅ KADRAN running on http://localhost:${PORT}`);
});