// src/features/auth/auth.controller.js

import {
  registerService,
  loginService,
  getMeService,
  updateSettingsService,
  changePasswordService,
  deleteAccountService,
} from './auth.service.js';

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

export const getMe = async (req, res, next) => {
  try {
    const result = await getMeService(req.user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const result = await updateSettingsService(req.user.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await changePasswordService(req.user.id, currentPassword, newPassword);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const result = await deleteAccountService(req.user.id, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};