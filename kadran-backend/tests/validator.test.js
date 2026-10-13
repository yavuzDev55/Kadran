import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTaskBody, listTasks } from '../src/features/task/task.validator.js';
import { buildTimeFields } from '../src/features/task/task.time.js';

const check = (body) => validateTaskBody(body).details;
const ok = (body) => assert.deepEqual(check(body), {}, JSON.stringify(check(body)));

const course = { title: 'Algo', type: 'COURSE', timeType: 'TIMED', date: '2026-10-12', startTime: '09:00', endTime: '11:00' };

// ─── time types ───
test('TIMED needs date, start and end (start before end)', () => {
  ok(course);
  assert.ok(check({ ...course, endTime: '08:00' }).startTime);
  assert.ok(check({ ...course, startTime: undefined }).startTime);
  assert.ok(check({ ...course, date: undefined }).date);
});

test('OPEN_ENDED needs only a start time', () => {
  const body = { title: 'Study', type: 'CUSTOM', timeType: 'OPEN_ENDED', date: '2026-10-12', startTime: '14:00' };
  ok(body);
  assert.ok(check({ ...body, endTime: '15:00' }).endTime);
  assert.ok(check({ ...body, startTime: undefined }).startTime);
});

test('DEADLINE takes a date and an optional due time, never a start time', () => {
  const body = { title: 'HW', type: 'HOMEWORK', timeType: 'DEADLINE', date: '2026-10-12' };
  ok(body);
  ok({ ...body, endTime: '17:30' });
  assert.ok(check({ ...body, startTime: '10:00' }).startTime);
  assert.ok(check({ ...body, endTime: '25:00' }).endTime);
});

test('MULTI_DAY accepts one day (same start and end) and rejects reversed ranges', () => {
  const body = { title: 'Project', type: 'CUSTOM', timeType: 'MULTI_DAY', rangeStartDate: '2026-10-12', rangeEndDate: '2026-10-12' };
  ok(body);
  ok({ ...body, rangeEndDate: '2026-10-20' });
  assert.ok(check({ ...body, rangeEndDate: '2026-10-11' }).rangeEndDate);
  assert.ok(check({ ...body, startTime: '10:00' }).timeType);
  assert.ok(check({ ...body, rangeEndDate: '2028-01-01' }).rangeEndDate); // longer than the hard limit
});

test('ANY_TIME must carry no date or time', () => {
  const body = { title: 'Read', type: 'CUSTOM', timeType: 'ANY_TIME' };
  ok(body);
  assert.ok(check({ ...body, date: '2026-10-12' }).timeType);
});

test('impossible calendar dates are rejected', () => {
  assert.ok(check({ ...course, date: '2026-02-31' }).date);
});

// ─── task type rules ───
test('HOMEWORK is deadline-only, EXAM and COURSE are timed-only', () => {
  assert.ok(check({ title: 'x', type: 'HOMEWORK', timeType: 'TIMED', date: '2026-10-12', startTime: '09:00', endTime: '10:00' }).timeType);
  assert.ok(check({ title: 'x', type: 'EXAM', timeType: 'DEADLINE', date: '2026-10-12' }).timeType);
  assert.ok(check({ title: 'x', type: 'COURSE', timeType: 'ANY_TIME' }).timeType);
});

test('HOMEWORK completable flag is locked on, COURSE/EXAM may change it', () => {
  const hw = { title: 'x', type: 'HOMEWORK', timeType: 'DEADLINE', date: '2026-10-12' };
  ok({ ...hw, isCompletable: true });
  assert.ok(check({ ...hw, isCompletable: false }).isCompletable);
  ok({ ...course, isCompletable: false });
  ok({ ...course, type: 'EXAM', isCompletable: true });
});

// ─── recurrence ───
const weekly = {
  ...course, date: undefined,
  recurrence: { pattern: 'WEEKLY', startDate: '2026-10-12', endDate: '2027-01-31', weekDays: ['MONDAY', 'WEDNESDAY'] },
};

test('a COURSE can recur; the end date is required and at most one year after the start', () => {
  ok(weekly);
  ok({ ...weekly, recurrence: { ...weekly.recurrence, endDate: '2027-10-12' } }); // exactly one year
  assert.ok(check({ ...weekly, recurrence: { ...weekly.recurrence, endDate: '2027-10-13' } })['recurrence.endDate']);
  assert.ok(check({ ...weekly, recurrence: { ...weekly.recurrence, endDate: undefined } })['recurrence.endDate']);
  assert.ok(check({ ...weekly, recurrence: { ...weekly.recurrence, endDate: '2026-10-01' } })['recurrence.endDate']);
});

test('EXAM and HOMEWORK cannot recur', () => {
  assert.ok(check({ ...weekly, type: 'EXAM' }).recurrence);
  assert.ok(check({ title: 'x', type: 'HOMEWORK', timeType: 'DEADLINE', recurrence: weekly.recurrence }).recurrence);
});

test('only TIMED and OPEN_ENDED can recur', () => {
  const custom = { title: 'x', type: 'CUSTOM', recurrence: weekly.recurrence };
  assert.ok(check({ ...custom, timeType: 'DEADLINE' }).recurrence);
  assert.ok(check({ ...custom, timeType: 'MULTI_DAY' }).recurrence);
  assert.ok(check({ ...custom, timeType: 'ANY_TIME' }).recurrence);
  ok({ ...custom, timeType: 'OPEN_ENDED', startTime: '10:00' });
});

test('WEEKLY needs weekdays; per-day slots are validated', () => {
  assert.ok(check({ ...weekly, recurrence: { ...weekly.recurrence, weekDays: [] } })['recurrence.weekDays']);
  const bad = { ...weekly, recurrence: { ...weekly.recurrence, slots: { MONDAY: { startTime: '12:00', endTime: '11:00' } } } };
  assert.ok(check(bad)['recurrence.slots.MONDAY.startTime']);
  ok({ ...weekly, startTime: undefined, endTime: undefined, recurrence: { ...weekly.recurrence, slots: {
    MONDAY: { startTime: '09:00', endTime: '10:00' }, WEDNESDAY: { startTime: '13:00', endTime: '15:00' } } } });
});

test('MONTHLY needs a valid monthDay', () => {
  const monthly = { ...weekly, recurrence: { pattern: 'MONTHLY', startDate: '2026-10-12', endDate: '2027-03-01', monthDay: 31 } };
  ok(monthly);
  ok({ ...monthly, recurrence: { ...monthly.recurrence, monthDay: -1 } });
  assert.ok(check({ ...monthly, recurrence: { ...monthly.recurrence, monthDay: 32 } })['recurrence.monthDay']);
});

// ─── column builder ───
test('buildTimeFields nulls every column that does not belong to the type', () => {
  const f = buildTimeFields('DEADLINE', { date: '2026-10-12', startTime: '09:00', rangeStartDate: '2026-10-01' });
  assert.equal(f.startTime, null);
  assert.equal(f.rangeStartDate, null);
  assert.equal(f.endTime, '23:59'); // default due time
  assert.equal(f.date.toISOString(), '2026-10-12T00:00:00.000Z');
  assert.deepEqual(Object.values(buildTimeFields('ANY_TIME', {})).filter((v) => v !== null), []);
});

// ─── list query ───
const parse = (query) => {
  let error; const req = { query };
  listTasks(req, {}, (e) => { error = e; });
  return { error, filters: req.taskFilters };
};

test('GET /tasks query: valid parameters are parsed, bad ones rejected', () => {
  const { filters, error } = parse({ type: 'COURSE', from: '2026-10-01', to: '2026-10-31', isPinned: 'true', limit: '20', tags: 'A, b', collapseSeries: 'true' });
  assert.equal(error, undefined);
  assert.equal(filters.limit, 20);
  assert.equal(filters.isPinned, true);
  assert.deepEqual(filters.tags, ['a', 'b']);
  assert.equal(filters.collapseSeries, true);

  assert.ok(parse({ type: 'NOPE' }).error);
  assert.ok(parse({ limit: '999999' }).error);
  assert.ok(parse({ limit: 'abc' }).error);
  assert.ok(parse({ from: '2026-13-01' }).error);
  assert.ok(parse({ from: '2026-10-10', to: '2026-10-01' }).error);
  assert.equal(parse({}).filters.limit, 50);
  assert.equal(parse({ showCompleted: 'false' }).filters.showCompleted, false);
});
