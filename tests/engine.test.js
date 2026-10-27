import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getSites, getCategories } from '../src/core/engine.js';

describe('Investigation Engine Core', () => {
  test('loads database sites and validates fields', () => {
    const sites = getSites();
    assert.ok(Array.isArray(sites));
    assert.ok(sites.length > 50, `Expected at least 50 sites, got ${sites.length}`);

    for (const site of sites) {
      assert.ok(site.name, 'Site must have a name');
      assert.ok(site.url, 'Site must have a url');
      assert.ok(site.category, 'Site must have a category');
      assert.ok(site.errorType, 'Site must have an errorType');
    }
  });

  test('extracts unique categories list', () => {
    const categories = getCategories();
    assert.ok(categories.includes('tech'));
    assert.ok(categories.includes('social'));
    assert.ok(categories.includes('gaming'));
    assert.ok(categories.includes('brasil'));
  });
});
