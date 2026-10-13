// src/features/task/task.db.js

import prisma from '../../config/database.js';
import { parseUTCDate, toDateStr } from '../../shared/utils/dateUtils.js';

export const taskInclude = {
  tags: { include: { tag: true } },
  series: true,
};

// Used for the occurrences listed inside a series (the series itself is already known).
export const occurrenceInclude = {
  tags: { include: { tag: true } },
};

const DEFAULT_ORDER = [{ date: 'asc' }, { rangeStartDate: 'asc' }, { id: 'asc' }];

// ─── Filters ──────────────────────────────────────────────────────────────────

/**
 * from / to ('YYYY-MM-DD') select every task that touches that window:
 *   - single-day tasks whose `date` is inside it
 *   - MULTI_DAY tasks whose range overlaps it (so a task that started earlier but is still
 *     running is included)
 * ANY_TIME tasks have no date and are therefore never returned by a from/to query.
 */
const buildWhere = (userId, filters) => {
  const { from, to, type, priority, timeType, isPinned, q, tags, showCompleted, seriesId } = filters;
  const where = { userId };

  if (from || to) {
    const fromDate = from ? parseUTCDate(from) : null;
    const toDate = to ? parseUTCDate(to) : null;

    where.OR = [
      { date: { ...(fromDate && { gte: fromDate }), ...(toDate && { lte: toDate }) } },
      {
        ...(toDate && { rangeStartDate: { lte: toDate } }),
        ...(fromDate && { rangeEndDate: { gte: fromDate } }),
      },
    ];
  }

  if (type) where.type = type;
  if (priority) where.priority = priority;
  if (timeType) where.timeType = timeType;
  if (isPinned !== undefined) where.isPinned = isPinned;
  if (seriesId) where.seriesId = seriesId;
  if (q) where.title = { contains: q, mode: 'insensitive' };
  if (showCompleted === false) where.isCompleted = false;
  if (tags && tags.length > 0) where.tags = { some: { tag: { name: { in: tags } } } };

  return where;
};

// ─── Collapsed list (one row per series) ──────────────────────────────────────

const sortKey = (row) => {
  const value = row.date ?? row.rangeStartDate;
  return value ? toDateStr(value) : '9999-99-99'; // ANY_TIME goes last
};

/**
 * Picks the occurrence that stands for its series: the next unfinished one on or after
 * `today`, otherwise the next one, otherwise the last one.
 */
const pickRepresentative = (rows, today) => {
  const upcoming = rows.filter((r) => toDateStr(r.date) >= today);
  return upcoming.find((r) => !r.isCompleted) ?? upcoming[0] ?? rows[rows.length - 1];
};

const loadSeriesStats = async (seriesIds) => {
  if (seriesIds.length === 0) return new Map();

  const groups = await prisma.task.groupBy({
    by: ['seriesId', 'isCompleted'],
    where: { seriesId: { in: seriesIds } },
    _count: { _all: true },
    _min: { date: true },
    _max: { date: true },
  });

  const stats = new Map();
  for (const g of groups) {
    const entry = stats.get(g.seriesId) ?? { total: 0, completed: 0, firstDate: null, lastDate: null };
    entry.total += g._count._all;
    if (g.isCompleted) entry.completed += g._count._all;
    const min = g._min.date ? toDateStr(g._min.date) : null;
    const max = g._max.date ? toDateStr(g._max.date) : null;
    if (min && (!entry.firstDate || min < entry.firstDate)) entry.firstDate = min;
    if (max && (!entry.lastDate || max > entry.lastDate)) entry.lastDate = max;
    stats.set(g.seriesId, entry);
  }
  return stats;
};

const findCollapsed = async (userId, filters) => {
  const { today, limit, offset } = filters;
  const where = buildWhere(userId, filters);

  const rows = await prisma.task.findMany({
    where,
    select: { id: true, seriesId: true, date: true, rangeStartDate: true, isCompleted: true },
    orderBy: DEFAULT_ORDER,
  });

  const entries = [];
  const bySeries = new Map();
  for (const row of rows) {
    if (row.seriesId === null) {
      entries.push(row);
    } else {
      if (!bySeries.has(row.seriesId)) bySeries.set(row.seriesId, []);
      bySeries.get(row.seriesId).push(row);
    }
  }
  for (const seriesRows of bySeries.values()) entries.push(pickRepresentative(seriesRows, today));

  entries.sort((a, b) => sortKey(a).localeCompare(sortKey(b)) || a.id - b.id);

  const total = entries.length;
  const page = entries.slice(offset, offset + limit);
  const ids = page.map((e) => e.id);

  const [full, stats] = await Promise.all([
    prisma.task.findMany({ where: { id: { in: ids } }, include: taskInclude }),
    loadSeriesStats(page.filter((e) => e.seriesId !== null).map((e) => e.seriesId)),
  ]);

  const byId = new Map(full.map((t) => [t.id, t]));
  const tasks = ids.map((id) => {
    const task = byId.get(id);
    return task.seriesId !== null ? { ...task, seriesInfo: stats.get(task.seriesId) ?? null } : task;
  });

  return { tasks, total, hasMore: offset + limit < total };
};

// ─── Task queries ─────────────────────────────────────────────────────────────

export const findTasksByUser = async (userId, filters) => {
  if (filters.collapseSeries) return findCollapsed(userId, filters);

  const where = buildWhere(userId, filters);
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: DEFAULT_ORDER,
      take: filters.limit,
      skip: filters.offset,
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total, hasMore: filters.offset + tasks.length < total };
};

export const findTaskById = (id) =>
  prisma.task.findUnique({ where: { id }, include: taskInclude });

export const createTask = (userId, data) =>
  prisma.task.create({ data: { ...data, userId }, include: taskInclude });

export const updateTask = (id, data) =>
  prisma.task.update({ where: { id }, data, include: taskInclude });

export const deleteTask = (id) => prisma.task.delete({ where: { id } });

export const setCompleted = (id, isCompleted) =>
  prisma.task.update({ where: { id }, data: { isCompleted }, include: taskInclude });

/** Removes a series row that has lost all of its occurrences. */
export const deleteSeriesIfEmpty = async (seriesId) => {
  if (seriesId === null || seriesId === undefined) return;
  const remaining = await prisma.task.count({ where: { seriesId } });
  if (remaining === 0) await prisma.taskSeries.deleteMany({ where: { id: seriesId } });
};

/** Keeps the pin flag identical on every occurrence of a series. */
export const updateSeriesTasks = (seriesId, data) =>
  prisma.task.updateMany({ where: { seriesId }, data });
