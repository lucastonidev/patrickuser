import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { extractMetadata, decodeHtmlEntities } from '../src/core/parser.js';

describe('Metadata Parser & OpenGraph Extractor', () => {
  test('decodes HTML entities correctly', () => {
    assert.strictEqual(decodeHtmlEntities('Lucas &amp; Patrick &lt;3'), 'Lucas & Patrick <3');
    assert.strictEqual(decodeHtmlEntities('&#39;The Mentalist&#39;'), "'The Mentalist'");
    assert.strictEqual(decodeHtmlEntities('&quot;Tea&quot;'), '"Tea"');
  });

  test('extracts og:title, og:description, and og:image', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lucas Silva (lucas) · GitHub</title>
        <meta property="og:title" content="Lucas Silva · GitHub" />
        <meta property="og:description" content="Software Engineer passionate about OSINT." />
        <meta property="og:image" content="https://avatars.githubusercontent.com/u/12345?v=4" />
      </head>
      <body></body>
      </html>
    `;

    const meta = extractMetadata(html, 'https://github.com/lucas');
    assert.strictEqual(meta.title, 'Lucas Silva (lucas) · GitHub');
    assert.strictEqual(meta.name, 'Lucas Silva');
    assert.strictEqual(meta.bio, 'Software Engineer passionate about OSINT.');
    assert.strictEqual(meta.avatarUrl, 'https://avatars.githubusercontent.com/u/12345?v=4');
  });

  test('extracts JSON-LD Person schema', () => {
    const html = `
      <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": "Patrick Jane",
          "description": "Consultant for CBI",
          "image": "https://example.com/avatar.jpg"
        }
        </script>
      </head>
      <body></body>
      </html>
    `;

    const meta = extractMetadata(html);
    assert.strictEqual(meta.name, 'Patrick Jane');
    assert.strictEqual(meta.bio, 'Consultant for CBI');
    assert.strictEqual(meta.avatarUrl, 'https://example.com/avatar.jpg');
  });

  test('handles malformed or empty HTML gracefully', () => {
    const meta = extractMetadata('');
    assert.strictEqual(meta.name, null);
    assert.strictEqual(meta.bio, null);
    assert.strictEqual(meta.avatarUrl, null);
  });
});
