// Unit tests for the week-grid vertical math. Run with: npm --prefix kadran-frontend test
import test from 'node:test';
import assert from 'node:assert/strict';
import { yForMinute, minuteForY } from './calendarUtils.js';

// 08:00 – 11:00 with the middle hour compacted to 16px (an empty hour).
const START = 8 * 60;
const END = 11 * 60;
const HEIGHTS = [60, 16, 60];

test('yForMinute maps clock minutes through cumulative row heights', () => {
  assert.equal(yForMinute(START, HEIGHTS, START, END), 0);
  assert.equal(yForMinute(9 * 60, HEIGHTS, START, END), 60);
  assert.equal(yForMinute(10 * 60, HEIGHTS, START, END), 76);
  assert.equal(yForMinute(10 * 60 + 30, HEIGHTS, START, END), 106);
});

test('yForMinute clamps minutes outside the visible range', () => {
  assert.equal(yForMinute(7 * 60, HEIGHTS, START, END), 0);
  assert.equal(yForMinute(12 * 60, HEIGHTS, START, END), 136);
});

test('minuteForY snaps to 15 minutes and inverts yForMinute on row boundaries', () => {
  assert.equal(minuteForY(0, HEIGHTS, START, END), START);
  assert.equal(minuteForY(30, HEIGHTS, START, END), 8 * 60 + 30);
  assert.equal(minuteForY(76, HEIGHTS, START, END), 10 * 60);
});

test('minuteForY never returns a minute past the last quarter hour', () => {
  assert.equal(minuteForY(10_000, HEIGHTS, START, END), END - 15);
  assert.equal(minuteForY(-50, HEIGHTS, START, END), START);
});

test('a full-height grid is linear: one hour is 60px', () => {
  const full = [60, 60, 60];
  assert.equal(yForMinute(9 * 60 + 15, full, START, END), 75);
  assert.equal(minuteForY(75, full, START, END), 9 * 60 + 15);
});
