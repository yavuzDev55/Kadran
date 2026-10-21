// Minimal in-memory stand-in for the parts of PrismaClient the app uses.
// It understands only the `where` shapes the code under test produces.

const db = { users: [], tags: [], taskTags: [], tasks: [], series: [], seq: {} };

const nextId = (table) => {
  db.seq[table] = (db.seq[table] ?? 0) + 1;
  return db.seq[table];
};

export const resetDb = () => {
  Object.assign(db, { users: [], tags: [], taskTags: [], tasks: [], series: [], seq: {} });
};
export const dbState = db;

const matches = (row, where = {}) =>
  Object.entries(where).every(([key, cond]) => {
    if (key === 'OR' || key === 'AND') return true; // not evaluated by the fake
    if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
      if ('in' in cond) return cond.in.includes(row[key]);
      return true;
    }
    return row[key] === cond;
  });

const byDate = (a, b) => {
  const da = a.date ? a.date.getTime() : Infinity;
  const dbb = b.date ? b.date.getTime() : Infinity;
  return da - dbb || a.id - b.id;
};

const withRelations = (task, include) => {
  if (!task) return task;
  const copy = { ...task };
  if (include?.tags) {
    copy.tags = db.taskTags
      .filter((tt) => tt.taskId === task.id)
      .map((tt) => ({ ...tt, tag: db.tags.find((t) => t.id === tt.tagId) }));
  }
  if (include?.series) copy.series = db.series.find((s) => s.id === task.seriesId) ?? null;
  return copy;
};

const taskDefaults = {
  description: null, date: null, startTime: null, endTime: null, rangeStartDate: null,
  rangeEndDate: null, priority: 'MEDIUM', isCompletable: true, color: null, isPinned: false,
  isCompleted: false, seriesId: null,
};

const prisma = {
  task: {
    create: async ({ data, include }) => {
      const row = { ...taskDefaults, ...data, id: nextId('task') };
      db.tasks.push(row);
      return withRelations(row, include);
    },
    createMany: async ({ data }) => {
      data.forEach((d) => db.tasks.push({ ...taskDefaults, ...d, id: nextId('task') }));
      return { count: data.length };
    },
    findUnique: async ({ where, include }) =>
      withRelations(db.tasks.find((t) => t.id === where.id), include),
    findMany: async ({ where, include } = {}) => {
      db.lastTaskWhere = where;
      return db.tasks.filter((t) => matches(t, where)).sort(byDate).map((t) => withRelations(t, include));
    },
    count: async ({ where } = {}) => db.tasks.filter((t) => matches(t, where)).length,
    update: async ({ where, data, include }) => {
      const row = db.tasks.find((t) => t.id === where.id);
      Object.assign(row, data);
      return withRelations(row, include);
    },
    updateMany: async ({ where, data }) => {
      const rows = db.tasks.filter((t) => matches(t, where));
      rows.forEach((r) => Object.assign(r, data));
      return { count: rows.length };
    },
    delete: async ({ where }) => {
      const i = db.tasks.findIndex((t) => t.id === where.id);
      const [row] = db.tasks.splice(i, 1);
      db.taskTags = db.taskTags.filter((tt) => tt.taskId !== row.id);
      return row;
    },
    groupBy: async ({ where }) => {
      const groups = new Map();
      db.tasks.filter((t) => matches(t, where)).forEach((t) => {
        const key = `${t.seriesId}|${t.isCompleted}`;
        const g = groups.get(key) ?? {
          seriesId: t.seriesId, isCompleted: t.isCompleted, _count: { _all: 0 }, _min: { date: null }, _max: { date: null },
        };
        g._count._all += 1;
        if (!g._min.date || t.date < g._min.date) g._min.date = t.date;
        if (!g._max.date || t.date > g._max.date) g._max.date = t.date;
        groups.set(key, g);
      });
      return [...groups.values()];
    },
  },
  taskSeries: {
    create: async ({ data }) => {
      const row = { ...data, id: nextId('series'), createdAt: new Date() };
      db.series.push(row);
      return row;
    },
    findUnique: async ({ where, include }) => {
      const row = db.series.find((s) => s.id === where.id);
      if (!row) return null;
      return include?.tasks
        ? { ...row, tasks: db.tasks.filter((t) => t.seriesId === row.id).sort(byDate).map((t) => withRelations(t, include.tasks.include)) }
        : { ...row };
    },
    update: async ({ where, data }) => {
      const row = db.series.find((s) => s.id === where.id);
      Object.assign(row, data);
      return row;
    },
    delete: async ({ where }) => {
      db.series = db.series.filter((s) => s.id !== where.id);
      db.tasks = db.tasks.filter((t) => t.seriesId !== where.id); // ON DELETE CASCADE
    },
    deleteMany: async ({ where }) => {
      db.series = db.series.filter((s) => s.id !== where.id);
    },
  },
  tag: {
    findFirst: async ({ where }) => db.tags.find((t) => t.name === where.name && t.userId === where.userId) ?? null,
    create: async ({ data }) => {
      const row = { ...data, id: nextId('tag') };
      db.tags.push(row);
      return row;
    },
    findUnique: async ({ where }) => db.tags.find((t) => t.id === where.id) ?? null,
    findMany: async () => [...db.tags],
    delete: async ({ where }) => {
      db.tags = db.tags.filter((t) => t.id !== where.id);
    },
  },
  taskTag: {
    upsert: async ({ create }) => {
      if (!db.taskTags.some((tt) => tt.taskId === create.taskId && tt.tagId === create.tagId)) {
        db.taskTags.push({ ...create, id: nextId('taskTag') });
      }
    },
    createMany: async ({ data, skipDuplicates }) => {
      data.forEach((d) => {
        const exists = db.taskTags.some((tt) => tt.taskId === d.taskId && tt.tagId === d.tagId);
        if (!exists || !skipDuplicates) db.taskTags.push({ ...d, id: nextId('taskTag') });
      });
    },
    delete: async ({ where }) => {
      const { taskId, tagId } = where.taskId_tagId;
      db.taskTags = db.taskTags.filter((tt) => !(tt.taskId === taskId && tt.tagId === tagId));
    },
  },
  $transaction: async (arg) => (typeof arg === 'function' ? arg(prisma) : Promise.all(arg)),
};

export default prisma;
