// src/features/recurring/recurring.db.js
// Database access for task series (the rule row behind a recurring task).

import prisma from '../../config/database.js';
import { occurrenceInclude } from '../task/task.db.js';

/**
 * Creates the series row, all of its occurrence tasks and their tag links in one transaction,
 * so a failure can never leave a half-created series behind.
 */
export const createSeriesWithTasks = ({ userId, series, tasks, tagIds }) =>
  prisma.$transaction(
    async (tx) => {
      const created = await tx.taskSeries.create({ data: { ...series, userId } });

      await tx.task.createMany({
        data: tasks.map((task) => ({ ...task, userId, seriesId: created.id })),
      });

      const rows = await tx.task.findMany({
        where: { seriesId: created.id },
        select: { id: true },
        orderBy: [{ date: 'asc' }, { id: 'asc' }],
      });

      if (tagIds.length > 0) {
        await tx.taskTag.createMany({
          data: rows.flatMap((row) => tagIds.map((tagId) => ({ taskId: row.id, tagId }))),
          skipDuplicates: true,
        });
      }

      return { series: created, firstTaskId: rows[0]?.id ?? null, count: rows.length };
    },
    { timeout: 30000 }
  );

export const findSeriesById = (id) =>
  prisma.taskSeries.findUnique({
    where: { id },
    include: {
      tasks: { include: occurrenceInclude, orderBy: [{ date: 'asc' }, { id: 'asc' }] },
    },
  });

export const updateSeries = (id, data) =>
  prisma.taskSeries.update({ where: { id }, data });

export const deleteSeries = (id) => prisma.taskSeries.delete({ where: { id } });

export const addTagToSeries = async (seriesId, tagId) => {
  const rows = await prisma.task.findMany({ where: { seriesId }, select: { id: true } });
  return prisma.taskTag.createMany({
    data: rows.map((row) => ({ taskId: row.id, tagId })),
    skipDuplicates: true,
  });
};
