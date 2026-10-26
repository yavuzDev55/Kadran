import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { dbState, resetDb } from './helpers/fakePrisma.js';
import * as taskService from '../src/features/task/task.service.js';
import * as seriesService from '../src/features/recurring/series.service.js';
import { ValidationError, ForbiddenError, AuthorizationError } from '../src/shared/utils/customErrors.js';

const USER = 1;
beforeEach(resetDb);

const course = { title: 'Algorithms', type: 'COURSE', timeType: 'TIMED', startTime: '09:00', endTime: '11:00' };
const weekly = (extra = {}) => ({
  ...course,
  recurrence: { pattern: 'WEEKLY', startDate: '2026-10-12', endDate: '2026-11-08', weekDays: ['MONDAY', 'WEDNESDAY'], ...extra },
});

// ─── creating ───
test('single task: type defaults are applied (exam is HIGH priority and not completable)', async () => {
  const { task } = await taskService.createTask(USER, { title: 'Final', type: 'EXAM', timeType: 'TIMED', date: '2026-12-20', startTime: '10:00', endTime: '12:00' });
  assert.equal(task.priority, 'HIGH');
  assert.equal(task.isCompletable, false);
  assert.equal(task.seriesId, null);

  const hw = (await taskService.createTask(USER, { title: 'HW', type: 'HOMEWORK', timeType: 'DEADLINE', date: '2026-12-01' })).task;
  assert.equal(hw.isCompletable, true);
  assert.equal(hw.endTime, '23:59');
  assert.equal(hw.startTime, null);

  const c = (await taskService.createTask(USER, { ...course, date: '2026-10-12' })).task;
  assert.equal(c.isCompletable, true);
  assert.equal(c.priority, 'MEDIUM');
});

test('recurring task becomes one real task per occurrence, linked to one series', async () => {
  const { series, task } = await taskService.createTask(USER, { ...weekly(), tags: ['Uni', ' uni ', 'math'] });
  // Mondays + Wednesdays from 2026-10-12 to 2026-11-08 -> 4 weeks
  assert.equal(series.occurrences, 8);
  assert.equal(dbState.tasks.length, 8);
  assert.equal(dbState.series.length, 1);
  assert.ok(dbState.tasks.every((t) => t.seriesId === series.id));
  assert.deepEqual(dbState.tasks.map((t) => t.date.toISOString().slice(0, 10)).slice(0, 3), ['2026-10-12', '2026-10-14', '2026-10-19']);
  assert.equal(task.date.toISOString().slice(0, 10), '2026-10-12'); // first occurrence is returned
  // tags are normalized, de-duplicated and linked to every occurrence
  assert.equal(dbState.tags.length, 2);
  assert.equal(dbState.taskTags.length, 16);
  assert.deepEqual(task.tags.sort(), ['math', 'uni']);
  assert.equal(dbState.series[0].weekDays, 'MONDAY,WEDNESDAY');
});

test('recurring description belongs to the series, while occurrence notes belong to individual tasks', async () => {
  const { series } = await taskService.createTask(USER, { ...weekly(), description: 'Weekly lecture' });
  assert.equal(dbState.series[0].description, 'Weekly lecture');
  assert.ok(dbState.tasks.every((task) => task.description === null));

  const [first, second] = dbState.tasks;
  await taskService.updateTask(USER, first.id, { description: 'Classroom equipment issue' });
  assert.equal(dbState.tasks.find((task) => task.id === first.id).description, 'Classroom equipment issue');
  assert.equal(dbState.tasks.find((task) => task.id === second.id).description, null);
  assert.equal(dbState.series[0].description, 'Weekly lecture');

  const updated = await seriesService.updateSeriesService(USER, series.id, { description: 'Updated lecture details' });
  assert.equal(updated.description, 'Updated lecture details');
  assert.equal(dbState.tasks.find((task) => task.id === first.id).description, 'Classroom equipment issue');
});

test('weekly series with a different time on each weekday', async () => {
  await taskService.createTask(USER, {
    ...weekly({ slots: { MONDAY: { startTime: '09:00', endTime: '10:00' }, WEDNESDAY: { startTime: '13:00', endTime: '15:30' } } }),
    startTime: undefined, endTime: undefined,
  });
  const mon = dbState.tasks.find((t) => t.date.toISOString().startsWith('2026-10-12'));
  const wed = dbState.tasks.find((t) => t.date.toISOString().startsWith('2026-10-14'));
  assert.deepEqual([mon.startTime, mon.endTime, wed.startTime, wed.endTime], ['09:00', '10:00', '13:00', '15:30']);
});

test('a rule with no matching day is rejected and nothing is stored', async () => {
  await assert.rejects(
    taskService.createTask(USER, weekly({ startDate: '2026-10-12', endDate: '2026-10-13', weekDays: ['FRIDAY'] })),
    ValidationError
  );
  assert.equal(dbState.tasks.length, 0);
  assert.equal(dbState.series.length, 0);
});

// ─── editing one occurrence ───
test('an occurrence can change its day, time and note without changing its siblings', async () => {
  await taskService.createTask(USER, weekly());
  const [first, second] = dbState.tasks;

  const { task } = await taskService.updateTask(USER, first.id, { date: '2026-10-13', startTime: '10:00', endTime: '12:00' });
  assert.equal(task.date.toISOString().slice(0, 10), '2026-10-13');
  assert.equal(task.startTime, '10:00');
  assert.equal(dbState.tasks.find((t) => t.id === second.id).startTime, '09:00'); // siblings untouched

  await assert.rejects(taskService.updateTask(USER, first.id, { title: 'Renamed' }), ValidationError);
  await assert.rejects(taskService.updateTask(USER, first.id, { startTime: '12:00', endTime: '11:00' }), ValidationError);
  await assert.rejects(taskService.updateTask(USER, first.id, { priority: 'HIGH' }), ValidationError);
});

test('pinning one occurrence pins the whole series', async () => {
  await taskService.createTask(USER, weekly());
  await taskService.updateTask(USER, dbState.tasks[3].id, { isPinned: true });
  assert.ok(dbState.tasks.every((t) => t.isPinned));
  await taskService.updateTask(USER, dbState.tasks[0].id, { isPinned: false });
  assert.ok(dbState.tasks.every((t) => !t.isPinned));
});

test('completion is per occurrence', async () => {
  await taskService.createTask(USER, weekly());
  await taskService.toggleTask(USER, dbState.tasks[1].id);
  assert.deepEqual(dbState.tasks.map((t) => t.isCompleted), [false, true, false, false, false, false, false, false]);
  await taskService.toggleTask(USER, dbState.tasks[1].id);
  assert.ok(dbState.tasks.every((t) => !t.isCompleted));
});

test('non-completable tasks cannot be toggled', async () => {
  const { task } = await taskService.createTask(USER, { title: 'Final', type: 'EXAM', timeType: 'TIMED', date: '2026-12-20', startTime: '10:00', endTime: '12:00' });
  await assert.rejects(taskService.toggleTask(USER, task.id), ForbiddenError);
});

// ─── deleting ───
test('deleting an occurrence removes only it; the last one also removes the series', async () => {
  await taskService.createTask(USER, weekly({ endDate: '2026-10-14' })); // Mon + Wed = 2 occurrences
  const [a, b] = dbState.tasks;
  await taskService.deleteTask(USER, a.id);
  assert.equal(dbState.tasks.length, 1);
  assert.equal(dbState.series.length, 1);
  await taskService.deleteTask(USER, b.id);
  assert.equal(dbState.tasks.length, 0);
  assert.equal(dbState.series.length, 0);
});

test('deleting a series removes every occurrence', async () => {
  const { series } = await taskService.createTask(USER, weekly());
  await seriesService.deleteSeriesService(USER, series.id);
  assert.equal(dbState.tasks.length, 0);
  assert.equal(dbState.series.length, 0);
});

test('other users cannot touch a series or its occurrences', async () => {
  const { series } = await taskService.createTask(USER, weekly());
  await assert.rejects(seriesService.deleteSeriesService(2, series.id), AuthorizationError);
  await assert.rejects(taskService.updateTask(2, dbState.tasks[0].id, { date: '2026-10-13' }), AuthorizationError);
});

test('series-wide edit and tag', async () => {
  const { series } = await taskService.createTask(USER, weekly());
  const updated = await seriesService.updateSeriesService(USER, series.id, { title: 'Algo II', priority: 'HIGH' });
  assert.ok(updated.tasks.every((t) => t.title === 'Algo II' && t.priority === 'HIGH'));
  const tagged = await seriesService.addTagToSeriesService(USER, series.id, 'Finals');
  assert.ok(tagged.tasks.every((t) => t.tags.includes('finals')));
});

// ─── editing a normal task ───
test('changing the time type of a normal task clears the old time columns', async () => {
  const { task } = await taskService.createTask(USER, { title: 'Misc', type: 'CUSTOM', timeType: 'TIMED', date: '2026-10-12', startTime: '09:00', endTime: '10:00' });

  const toRange = (await taskService.updateTask(USER, task.id, { timeType: 'MULTI_DAY', rangeStartDate: '2026-10-12', rangeEndDate: '2026-10-14' })).task;
  assert.deepEqual([toRange.date, toRange.startTime, toRange.endTime], [null, null, null]);
  assert.equal(toRange.rangeEndDate.toISOString().slice(0, 10), '2026-10-14');

  const toAny = (await taskService.updateTask(USER, task.id, { timeType: 'ANY_TIME' })).task;
  assert.deepEqual([toAny.rangeStartDate, toAny.rangeEndDate, toAny.date], [null, null, null]);

  await assert.rejects(taskService.updateTask(USER, task.id, { timeType: 'TIMED', date: '2026-10-12' }), ValidationError); // no times
});

test('the type rules are enforced on update too', async () => {
  const { task } = await taskService.createTask(USER, { title: 'Misc', type: 'CUSTOM', timeType: 'ANY_TIME' });
  await assert.rejects(taskService.updateTask(USER, task.id, { type: 'HOMEWORK' }), ValidationError); // homework needs DEADLINE
  const hw = (await taskService.updateTask(USER, task.id, { type: 'HOMEWORK', timeType: 'DEADLINE', date: '2026-12-01' })).task;
  assert.equal(hw.isCompletable, true);
});

test('pinning never re-validates the stored time model', async () => {
  // a legacy row that would not pass today's rules must still be pinnable
  dbState.tasks.push({ id: 99, userId: USER, title: 'old', type: 'HOMEWORK', timeType: 'TIMED', date: new Date('2026-10-12'),
    startTime: '10:00', endTime: '09:00', priority: 'LOW', isCompletable: true, isPinned: false, isCompleted: false, seriesId: null, color: null, description: null, rangeStartDate: null, rangeEndDate: null });
  const { task } = await taskService.updateTask(USER, 99, { isPinned: true });
  assert.equal(task.isPinned, true);
});

// ─── listing ───
test('list: from/to select single-day tasks inside the window and multi-day tasks overlapping it', async () => {
  await taskService.listTasks(USER, { from: '2026-10-12', to: '2026-10-18', limit: 50, offset: 0, showCompleted: true, today: '2026-10-10' });
  const [dateCond, rangeCond] = dbState.lastTaskWhere.OR;
  assert.equal(dateCond.date.gte.toISOString(), '2026-10-12T00:00:00.000Z');
  assert.equal(dateCond.date.lte.toISOString(), '2026-10-18T00:00:00.000Z');
  assert.equal(rangeCond.rangeStartDate.lte.toISOString(), '2026-10-18T00:00:00.000Z'); // started before the window ends
  assert.equal(rangeCond.rangeEndDate.gte.toISOString(), '2026-10-12T00:00:00.000Z'); //  and ends after it begins
});

test('list: collapseSeries shows one row per series with the next unfinished occurrence', async () => {
  await taskService.createTask(USER, weekly()); // 8 occurrences from 2026-10-12
  await taskService.createTask(USER, { title: 'Read', type: 'CUSTOM', timeType: 'ANY_TIME' });
  await taskService.createTask(USER, { title: 'HW', type: 'HOMEWORK', timeType: 'DEADLINE', date: '2026-10-15' });
  await taskService.toggleTask(USER, dbState.tasks[0].id); // first occurrence done

  const filters = { collapseSeries: true, today: '2026-10-10', limit: 50, offset: 0, showCompleted: true };
  const { tasks, total } = await taskService.listTasks(USER, filters);

  assert.equal(total, 3); // series + any-time + homework
  assert.deepEqual(tasks.map((t) => t.title), ['Algorithms', 'HW', 'Read']); // dated first, any-time last
  const seriesRow = tasks[0];
  assert.equal(seriesRow.date.toISOString().slice(0, 10), '2026-10-14'); // 10-12 is completed -> next one
  assert.deepEqual(seriesRow.seriesInfo, { total: 8, completed: 1, firstDate: '2026-10-12', lastDate: '2026-11-04' });
  assert.equal(tasks[1].seriesInfo, undefined);

  const page = await taskService.listTasks(USER, { ...filters, limit: 1, offset: 1 });
  assert.deepEqual(page.tasks.map((t) => t.title), ['HW']);
  assert.equal(page.hasMore, true);
});

test('list: server sorting applies to paginated tasks with a stable id tie-breaker', async () => {
  const low = (await taskService.createTask(USER, {
    title: 'Gamma',
    type: 'COURSE',
    timeType: 'TIMED',
    date: '2026-12-01',
    startTime: '09:00',
    endTime: '10:00',
    priority: 'LOW',
  })).task;
  const high = (await taskService.createTask(USER, {
    title: 'Beta',
    type: 'EXAM',
    timeType: 'TIMED',
    date: '2026-12-02',
    startTime: '09:00',
    endTime: '10:00',
    priority: 'HIGH',
  })).task;
  const medium = (await taskService.createTask(USER, {
    title: 'Alpha',
    type: 'HOMEWORK',
    timeType: 'DEADLINE',
    date: '2026-12-03',
    endTime: '10:00',
    priority: 'MEDIUM',
  })).task;
  const highLater = (await taskService.createTask(USER, {
    title: 'Zulu',
    type: 'CUSTOM',
    timeType: 'TIMED',
    date: '2026-12-04',
    startTime: '09:00',
    endTime: '10:00',
    priority: 'HIGH',
  })).task;
  dbState.tasks.find((task) => task.id === low.id).createdAt = new Date('2026-01-03T00:00:00Z');
  dbState.tasks.find((task) => task.id === high.id).createdAt = new Date('2026-01-01T00:00:00Z');
  dbState.tasks.find((task) => task.id === medium.id).createdAt = new Date('2026-01-02T00:00:00Z');
  dbState.tasks.find((task) => task.id === highLater.id).createdAt = new Date('2026-01-04T00:00:00Z');

  const options = { limit: 50, offset: 0, today: '2026-12-01', showCompleted: true };
  const byPriority = await taskService.listTasks(USER, { ...options, sort: 'priority', order: 'desc' });
  assert.deepEqual(byPriority.tasks.map((task) => task.id), [high.id, highLater.id, medium.id, low.id]);

  const byTitle = await taskService.listTasks(USER, { ...options, sort: 'title', order: 'asc' });
  assert.deepEqual(byTitle.tasks.map((task) => task.id), [medium.id, high.id, low.id, highLater.id]);

  const byType = await taskService.listTasks(USER, { ...options, sort: 'type', order: 'asc' });
  assert.deepEqual(byType.tasks.map((task) => task.id), [low.id, high.id, medium.id, highLater.id]);

  const byCreated = await taskService.listTasks(USER, { ...options, sort: 'created', order: 'asc' });
  assert.deepEqual(byCreated.tasks.map((task) => task.id), [high.id, medium.id, low.id, highLater.id]);

  const byDateDescending = await taskService.listTasks(USER, { ...options, sort: 'date', order: 'desc' });
  assert.deepEqual(byDateDescending.tasks.map((task) => task.id), [highLater.id, medium.id, high.id, low.id]);
});

test('list: collapsed series use the requested sort order too', async () => {
  const { task: lowSeriesTask } = await taskService.createTask(USER, {
    ...weekly(),
    title: 'Weekly low',
    priority: 'LOW',
  });
  const { task: highSeriesTask } = await taskService.createTask(USER, {
    ...weekly(),
    title: 'Weekly high',
    priority: 'HIGH',
  });

  const { tasks } = await taskService.listTasks(USER, {
    collapseSeries: true,
    sort: 'priority',
    order: 'desc',
    limit: 50,
    offset: 0,
    today: '2026-10-12',
    showCompleted: true,
  });
  assert.deepEqual(tasks.map((task) => task.id), [highSeriesTask.id, lowSeriesTask.id]);
});
