import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateUsername, sanitizeUsername } from '../src/core/validator.js';

describe('Username Validator & Sanitizer', () => {
  test('sanitizes leading @ and extra whitespace', () => {
    assert.strictEqual(sanitizeUsername('  @patrick_jane  '), 'patrick_jane');
    assert.strictEqual(sanitizeUsername('@@@target'), 'target');
    assert.strictEqual(sanitizeUsername(''), '');
  });

  test('validates username against regex correctly', () => {
    const githubRegex = '^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$';

    assert.strictEqual(validateUsername('torvalds', githubRegex), true);
    assert.strictEqual(validateUsername('patrick-jane', githubRegex), true);
    assert.strictEqual(validateUsername('-invalid-start', githubRegex), false);
    assert.strictEqual(validateUsername('invalid_underscore', githubRegex), false);
  });

  test('allows username when no regex is provided', () => {
    assert.strictEqual(validateUsername('anyone', undefined), true);
  });

  test('rejects empty or non-string usernames', () => {
    assert.strictEqual(validateUsername('', '^[a-z]+$'), false);
    assert.strictEqual(validateUsername(null, '^[a-z]+$'), false);
  });
});

