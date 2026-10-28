/**
 * @file adapters/threads.js - Threads Profile Adapter
 */
import { request } from '../core/http.js';
import { extractMetadata } from '../core/parser.js';

/**
 * Check Threads profile avoiding login wall false-positives
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkThreads(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://www.threads.net/@${encodeURIComponent(username)}`;

  try {
    const res = await request(profileUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    const isLoginRedirect =
      res.finalUrl.includes('/login') ||
      res.finalUrl.includes('/accounts/login') ||
      res.text.includes('Threads • Log in') ||
      res.text.includes('Threads &#x2022; Log in');

    if (isLoginRedirect) {
      return {
        site: 'Threads',
        category: 'social',
        exists: false,
        url: profileUrl,
        httpStatus: 200,
        durationMs: Date.now() - startTime
      };
    }

    const title = res.text.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] || '';
    const ogTitle = res.text.match(/<meta property="og:title" content="([^"]+)"/i)?.[1] || '';

    const exists =
      (title.includes('• Threads') && !title.includes('Log in')) ||
      (ogTitle.includes('Threads') && !ogTitle.includes('Log in'));

    return {
      site: 'Threads',
      category: 'social',
      exists,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime,
      metadata: exists ? extractMetadata(res.text, profileUrl) : undefined
    };
  } catch (err) {
    return {
      site: 'Threads',
      category: 'social',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}

