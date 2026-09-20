// src/shared/middlewares/auth.middleware.js

import jwt from 'jsonwebtoken';
import { AuthenticationError } from '../utils/customErrors.js';

export const authMiddleware = (req, res, next) => {
  try {
    // Header'dan token al: "Bearer eyJhbGc..."
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Token required');
    }

    const token = authHeader.split(' ')[1];

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kullanıcı bilgisini request'e ekle
    // Artık her controller'da req.user.id ile userId'ye ulaşabilirsin
    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };

    next();
  } catch (error) {
    // jwt.verify başarısız olursa (süresi dolmuş, geçersiz vb.)
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AuthenticationError('Invalid or expired token'));
    }
    next(error);
  }
};