import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatJson, formatCsv, formatMarkdown } from '../src/cli/exporter.js';

describe('Report Exporters (JSON, CSV, Markdown)', () => {
  const mockResults = [
    {
      site: 'GitHub',
      category: 'tech',
      exists: true,
      url: 'https://github.com/alice',
      httpStatus: 200,
      durationMs: 150,
      metadata: {
        name: 'Alice Developer',
        bio: 'Open source lover',
        avatarUrl: 'https://github.com/alice.png',
        followers: 42
      }
    },
    {
      site: 'NonExistent',
      category: 'social',
      exists: false,
      url: 'https://example.com/alice',
      httpStatus: 404,
      durationMs: 90
    }
  ];

  test('generates valid JSON report', () => {
    const jsonStr = formatJson('alice', mockResults, 240);
    const parsed = JSON.parse(jsonStr);
    assert.strictEqual(parsed.target, 'alice');
    assert.strictEqual(parsed.totalChecked, 2);
    assert.strictEqual(parsed.totalFound, 1);
    assert.strictEqual(parsed.hits[0].site, 'GitHub');
  });

  test('generates valid CSV report', () => {
    const csv = formatCsv('alice', mockResults);
    assert.ok(csv.includes('"Username","Site","Category"'));
    assert.ok(csv.includes('"alice","GitHub","tech","https://github.com/alice"'));
    assert.ok(!csv.includes('NonExistent')); // Only confirmed hits in CSV
  });

  test('generates valid Markdown report', () => {
    const md = formatMarkdown('alice', mockResults, 240);
    assert.ok(md.includes('# 🔍 PatrickUser OSINT Investigation: @alice'));
    assert.ok(md.includes('| **GitHub** | `tech` | [https://github.com/alice](https://github.com/alice)'));
  });
});
