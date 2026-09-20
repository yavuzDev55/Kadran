// src/features/auth/auth.controller.js

import { registerService, loginService } from './auth.service.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, timeZone } = req.body;
    const result = await registerService(email, password, timeZone);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginService(email, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};