// src/shared/middlewares/errorHandler.middleware.js

import { AppError } from '../utils/customErrors.js';

export const errorHandler = (err, req, res, next) => {

  // AppError'dan türeyen bilinen hatalar (ValidationError, NotFoundError vb.)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        name: err.name,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // Prisma: Unique constraint (duplicate email, duplicate category name vb.)
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({
      success: false,
      error: {
        name: 'ConflictError',
        message: `${field} already exists`,
      },
    });
  }

  // Prisma: Kayıt bulunamadı
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: {
        name: 'NotFoundError',
        message: 'Record not found',
      },
    });
  }

  // Beklenmeyen hatalar (bug, database bağlantı kopması vb.)
  console.error('Unhandled error:', err);

  return res.status(500).json({
    success: false,
    error: {
      name: 'InternalServerError',
      message: 'Something went wrong',
      // Sadece development'ta detay göster
      ...(process.env.NODE_ENV === 'development' && { detail: err.message }),
    },
  });
};