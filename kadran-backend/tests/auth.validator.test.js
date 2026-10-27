import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRegister, validateLogin } from '../src/features/auth/auth.validator.js';
import { ValidationError } from '../src/shared/utils/customErrors.js';

// Runs a validator middleware and returns what it passed to next().
const run = (middleware, body) => {
  let outcome;
  middleware({ body }, {}, (error) => { outcome = error ?? 'ok'; });
  return outcome;
};

test('register rejects a non-string email with a validation error instead of crashing', () => {
  const error = run(validateRegister, { email: 42, password: 'Password1' });
  assert.ok(error instanceof ValidationError);
  assert.ok(error.details.errors.includes('Email must be a string'));

  const arrayError = run(validateRegister, { email: ['a@b.co'], password: 'Password1' });
  assert.ok(arrayError instanceof ValidationError);
});

test('register accepts a valid string email', () => {
  assert.equal(run(validateRegister, { email: 'student@example.com', password: 'Password1' }), 'ok');
});

test('login rejects a non-string email with a validation error', () => {
  const error = run(validateLogin, { email: { $ne: null }, password: 'x' });
  assert.ok(error instanceof ValidationError);
  assert.ok(error.details.errors.includes('Email must be a string'));
});
