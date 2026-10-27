import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { dbState, resetDb } from './helpers/fakePrisma.js';
import { getMeService, registerService, updateSettingsService } from '../src/features/auth/auth.service.js';
import { ValidationError } from '../src/shared/utils/customErrors.js';

const USER = 1;
beforeEach(() => {
  resetDb();
  dbState.users.push({
    id: USER,
    email: 'student@example.com',
    password: 'hashed',
    displayName: null,
    headline: null,
    timeZone: 'Europe/Istanbul',
    weekStartsOn: 'MONDAY',
    dayStartHour: 8,
    dayEndHour: 22,
    timeFormat: 'H24',
    defaultView: 'WEEK',
    hideCompleted: false,
  });
});

test('profile fields are returned as null for existing users without profile data', async () => {
  const { data } = await getMeService(USER);
  assert.equal(data.displayName, null);
  assert.equal(data.headline, null);
  assert.equal('password' in data, false);
});

test('profile fields are trimmed, saved and serialized with updated preferences', async () => {
  const { data } = await updateSettingsService(USER, {
    displayName: '  Ada Lovelace  ',
    headline: '  Mathematics student  ',
    hideCompleted: true,
  });

  assert.equal(data.displayName, 'Ada Lovelace');
  assert.equal(data.headline, 'Mathematics student');
  assert.equal(data.hideCompleted, true);
  assert.equal(dbState.users[0].displayName, 'Ada Lovelace');
  assert.equal(dbState.users[0].headline, 'Mathematics student');
});

test('blank profile values clear the optional fields', async () => {
  dbState.users[0].displayName = 'Ada';
  dbState.users[0].headline = 'Student';

  const { data } = await updateSettingsService(USER, { displayName: '  ', headline: null });
  assert.equal(data.displayName, null);
  assert.equal(data.headline, null);
});

test('profile fields reject invalid types and values beyond their limits', async () => {
  await assert.rejects(
    updateSettingsService(USER, { displayName: 123 }),
    (error) => error instanceof ValidationError && error.details.displayName === 'displayName must be a string'
  );
  await assert.rejects(
    updateSettingsService(USER, { displayName: 'a'.repeat(51) }),
    (error) => error instanceof ValidationError && error.details.displayName.includes('50')
  );
  await assert.rejects(
    updateSettingsService(USER, { headline: 'a'.repeat(81) }),
    (error) => error instanceof ValidationError && error.details.headline.includes('80')
  );
});

test('registration keeps profile fields optional for existing clients', async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-only-jwt-secret';
  try {
    const { data } = await registerService('new@example.com', 'Password1', 'Europe/Istanbul');
    assert.equal(data.user.displayName, null);
    assert.equal(data.user.headline, null);
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test('hideCompleted accepts only real booleans, so the string "false" is rejected', async () => {
  await assert.rejects(
    updateSettingsService(USER, { hideCompleted: 'false' }),
    (error) => error instanceof ValidationError && error.details.hideCompleted === 'hideCompleted must be a boolean'
  );
  assert.equal(dbState.users[0].hideCompleted, false);

  const { data } = await updateSettingsService(USER, { hideCompleted: true });
  assert.equal(data.hideCompleted, true);
});

test('a day-window change alone is checked against the stored other bound', async () => {
  // Stored window is 8..22.
  await assert.rejects(
    updateSettingsService(USER, { dayStartHour: 23 }),
    (error) => error instanceof ValidationError && 'dayStartHour' in error.details
  );
  await assert.rejects(
    updateSettingsService(USER, { dayEndHour: 7 }),
    (error) => error instanceof ValidationError && 'dayStartHour' in error.details
  );
  assert.equal(dbState.users[0].dayStartHour, 8);
  assert.equal(dbState.users[0].dayEndHour, 22);

  const { data } = await updateSettingsService(USER, { dayEndHour: 20 });
  assert.equal(data.dayEndHour, 20);
  assert.equal(data.dayStartHour, 8);
});

test('a combined day-window change is validated on the new values only', async () => {
  const { data } = await updateSettingsService(USER, { dayStartHour: 23, dayEndHour: 24 });
  assert.equal(data.dayStartHour, 23);
  assert.equal(data.dayEndHour, 24);
});
