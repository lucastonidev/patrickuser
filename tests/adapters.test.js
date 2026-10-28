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
    assert.strictEqual(hasAdapter('Apoia.se'), true);
    assert.strictEqual(hasAdapter('500px'), true);
    assert.strictEqual(hasAdapter('Freelancer'), true);
    assert.strictEqual(hasAdapter('Archive.org'), true);
    assert.strictEqual(hasAdapter('Medium'), true);
    assert.strictEqual(hasAdapter('Mixcloud'), true);
    assert.strictEqual(hasAdapter('Dailymotion'), true);
    assert.strictEqual(hasAdapter('Threads'), true);
    assert.strictEqual(hasAdapter('Minecraft'), true);
    assert.strictEqual(hasAdapter('Roblox'), true);
    assert.strictEqual(hasAdapter('Lichess'), true);
    assert.strictEqual(hasAdapter('AniList'), true);
    assert.strictEqual(hasAdapter('Speedrun.com'), true);
    assert.strictEqual(hasAdapter('NonExistentSite123'), false);
  });

  test('returns null when running adapter for non-registered site', async () => {
    const res = await runAdapter('non_existent', 'alice');
    assert.strictEqual(res, null);
  });
});

