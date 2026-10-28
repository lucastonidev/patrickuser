import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { startServer } from '../src/server/index.js';

describe('PatrickUser Micro-API Server', () => {
  const PORT = 3899;
  let server;

  test('starts server and responds to GET /', async () => {
    server = startServer(PORT);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const res = await fetch(`http://localhost:${PORT}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('PatrickUser'));
    assert.ok(html.includes('The Mentalist'));
  });

  test('GET /api/sites returns JSON catalog', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/sites`);
    assert.strictEqual(res.status, 200);
    const sites = await res.json();
    assert.ok(Array.isArray(sites));
    assert.ok(sites.length > 50);
  });

  test('GET /api/categories returns category array', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/categories`);
    assert.strictEqual(res.status, 200);
    const cats = await res.json();
    assert.ok(Array.isArray(cats));
    assert.ok(cats.includes('brasil'));
  });

  after(() => {
    if (server) {
      server.close();
    }
  });
});

