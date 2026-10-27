import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { hasAdapter, runAdapter } from '../src/adapters/index.js';

describe('Specialized Adapters Registry', () => {
  test('correctly identifies registered adapters case-insensitively', () => {
    assert.strictEqual(hasAdapter('GitHub'), true);
    assert.strictEqual(hasAdapter('github'), true);
    assert.strictEqual(hasAdapter('Reddit'), true);
    assert.strictEqual(hasAdapter('Duolingo'), true);
    assert.strictEqual(hasAdapter('Chess.com'), true);
    assert.strictEqual(hasAdapter('Steam'), true);
    assert.strictEqual(hasAdapter('Bluesky'), true);
    assert.strictEqual(hasAdapter('TabNews'), true);
    assert.strictEqual(hasAdapter('Gravatar'), true);
    assert.strictEqual(hasAdapter('NonExistentSite123'), false);
  });

  test('returns null when running adapter for non-registered site', async () => {
    const res = await runAdapter('non_existent', 'alice');
    assert.strictEqual(res, null);
  });
});
