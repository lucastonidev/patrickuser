/**
 * @file adapters/medium.js - Medium Profile Adapter
 */
import { request } from '../core/http.js';
import { extractMetadata } from '../core/parser.js';

/**
 * Check Medium profile and eliminate 404 soft-errors
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkMedium(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://medium.com/@${encodeURIComponent(username)}`;

  try {
    const res = await request(profileUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal
    });

    const isNotFound =
      res.status === 404 ||
      res.text.includes('PAGE NOT FOUND') ||
      res.text.includes('Out of nothing, something') ||
      res.text.includes("apparently even a page that doesn't exist");

    if (isNotFound) {
      return {
        site: 'Medium',
        category: 'content',
        exists: false,
        url: profileUrl,
        httpStatus: 404,
        durationMs: Date.now() - startTime
      };
    }

    const titleMatch = res.text.match(/<meta property="og:title" content="([^"]+)"/i);
    const ogTitle = titleMatch ? titleMatch[1] : '';

    const exists = res.status === 200 && (ogTitle.includes('– Medium') || ogTitle.includes('- Medium') || res.finalUrl.includes('.medium.com'));

    return {
      site: 'Medium',
      category: 'content',
      exists,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime,
      metadata: exists ? extractMetadata(res.text, profileUrl) : undefined
    };
  } catch (err) {
    return {
      site: 'Medium',
      category: 'content',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}
