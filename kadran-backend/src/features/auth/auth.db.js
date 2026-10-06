// src/features/auth/auth.db.js

import prisma from '../../config/database.js';

const USER_PUBLIC_FIELDS = {
  id: true,
  email: true,
  timeZone: true,
  weekStartsOn: true,
  dayStartHour: true,
  dayEndHour: true,
  timeFormat: true,
  defaultView: true,
  hideCompleted: true,
  createdAt: true,
};

export const findUserByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });

export const findUserById = (id) =>
  prisma.user.findUnique({
    where: { id },
    select: USER_PUBLIC_FIELDS,
  });

// Returns the full user row including password (used only for auth checks)
export const findUserByIdWithPassword = (id) =>
  prisma.user.findUnique({ where: { id } });

export const createUser = (email, hashedPassword, timeZone) =>
  prisma.user.create({
    data: { email, password: hashedPassword, timeZone },
    select: USER_PUBLIC_FIELDS,
  });

export const updateUserSettings = (id, data) =>
  prisma.user.update({
    where: { id },
    data,
    select: USER_PUBLIC_FIELDS,
  });

export const updateUserPassword = (id, hashedPassword) =>
  prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
    select: { id: true },
  });

export const deleteUserById = (id) =>
  prisma.user.delete({ where: { id } });