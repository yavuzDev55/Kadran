// src/server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { authMiddleware } from './shared/middlewares/auth.middleware.js';
import { errorHandler } from './shared/middlewares/errorHandler.middleware.js';

import authRouter from './features/auth/auth.router.js';
import tagRouter from './features/tag/tag.router.js';
import taskRouter from './features/task/task.router.js';

dotenv.config();

// JWT_SECRET zorunlu kontrol
if (!process.env.JWT_SECRET) {
  console.error('HATA: JWT_SECRET tanımlı değil. .env dosyasını kontrol et.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Public routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.use('/auth', authRouter);

// Protected routes — authMiddleware SADECE burada, router'larda tekrar yok
app.use('/tags',  authMiddleware, tagRouter);
app.use('/tasks', authMiddleware, taskRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, error: { message: 'Route not found' } });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ KADRAN running on http://localhost:${PORT}`);
});