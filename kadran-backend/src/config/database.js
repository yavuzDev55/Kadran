// src/config/database.js

import { PrismaClient } from '@prisma/client';

// Tek bir Prisma instance oluştur (singleton pattern)
// Her db dosyasında new PrismaClient() yerine bunu import et
const prisma = new PrismaClient();

export default prisma;