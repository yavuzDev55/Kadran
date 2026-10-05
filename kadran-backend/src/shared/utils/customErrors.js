// src/shared/utils/customErrors.js

// ============ BASE CLASS ============

export class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============ HTTP ERROR CLASSES ============

// 400 - Gelen veri hatalı (boş alan, yanlış format vb.)
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}

// 401 - Token yok veya geçersiz
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, message);
    this.name = 'AuthenticationError';
  }
}

// 403 - Token geçerli ama yetkisi yok (başkasının verisi)
export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(403, message);
    this.name = 'AuthorizationError';
  }
}

// 404 - Kayıt bulunamadı
export class NotFoundError extends AppError {
  constructor(resource, id = null) {
    const message = id ? `${resource} not found: ${id}` : `${resource} not found`;
    super(404, message);
    this.name = 'NotFoundError';
  }
}

// 409 - Zaten var (duplicate email, duplicate category name vb.)
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(409, message);
    this.name = 'ConflictError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}