import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOccurrenceDates, maxSeriesEnd } from '../src/features/recurring/recurring.service.js';
import { addYearsStr } from '../src/shared/utils/dateUtils.js';

test('DAILY covers every day, both ends inclusive', () => {
  const dates = generateOccurrenceDates({ pattern: 'DAILY', startDate: '2026-10-10', endDate: '2026-10-13' });
  assert.deepEqual(dates, ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13']);
});

test('WEEKLY only returns the chosen weekdays', () => {
  // 2026-10-12 is a Monday
  const dates = generateOccurrenceDates({
    pattern: 'WEEKLY', startDate: '2026-10-12', endDate: '2026-10-25', weekDays: ['MONDAY', 'THURSDAY'],
  });
  assert.deepEqual(dates, ['2026-10-12', '2026-10-15', '2026-10-19', '2026-10-22']);
});

test('MONTHLY day 31 is clamped to the last day of short months', () => {
  const dates = generateOccurrenceDates({ pattern: 'MONTHLY', startDate: '2026-01-01', endDate: '2026-06-30', monthDay: 31 });
  assert.deepEqual(dates, ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31', '2026-06-30']);
});

test('MONTHLY -1 is the last day (leap year February)', () => {
  const dates = generateOccurrenceDates({ pattern: 'MONTHLY', startDate: '2028-01-15', endDate: '2028-03-31', monthDay: -1 });
  assert.deepEqual(dates, ['2028-01-31', '2028-02-29', '2028-03-31']);
});

test('MONTHLY skips a month whose target day falls before the start date', () => {
  const dates = generateOccurrenceDates({ pattern: 'MONTHLY', startDate: '2026-10-20', endDate: '2026-12-31', monthDay: 5 });
  assert.deepEqual(dates, ['2026-11-05', '2026-12-05']);
});

test('end before start yields nothing', () => {
  assert.deepEqual(generateOccurrenceDates({ pattern: 'DAILY', startDate: '2026-10-10', endDate: '2026-10-09' }), []);
});

test('a full year of daily occurrences stays under the safety cap', () => {
  const start = '2026-10-10';
  const dates = generateOccurrenceDates({ pattern: 'DAILY', startDate: start, endDate: maxSeriesEnd(start) });
  assert.equal(dates.length, 366);
  assert.equal(dates.at(-1), '2027-10-10');
});

test('addYearsStr clamps Feb 29', () => {
  assert.equal(addYearsStr('2028-02-29', 1), '2029-02-28');
  assert.equal(addYearsStr('2026-10-10', 1), '2027-10-10');
});
