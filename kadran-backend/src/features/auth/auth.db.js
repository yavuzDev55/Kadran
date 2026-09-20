// src/features/auth/auth.db.js

import prisma from '../../config/database.js';

export const findUserByEmail = (email) => {
  return prisma.user.findUnique({ where: { email } });
};

export const createUser = (email, hashedPassword, timeZone) => {
  return prisma.user.create({
    data: { email, password: hashedPassword, timeZone },
  });
};