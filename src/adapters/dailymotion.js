/**
 * @file adapters/dailymotion.js - Dailymotion Public API Adapter
 */
import { request } from '../core/http.js';

/**
 * Check Dailymotion profile via public API
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkDailymotion(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://www.dailymotion.com/${encodeURIComponent(username)}`;

  try {
    const apiUrl = `https://api.dailymotion.com/user/${encodeURIComponent(username)}?fields=id,screenname,avatar_720_url`;
    const res = await request(apiUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.status === 200 && res.text) {
      try {
        const json = JSON.parse(res.text);
        if (json.id && json.screenname) {
          return {
            site: 'Dailymotion',
            category: 'content',
            exists: true,
            url: profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: json.screenname,
              avatarUrl: json.avatar_720_url || null,
              extra: {
                id: json.id
              }
            }
          };
        }
      } catch {
        // Fall through
      }
    }

    return {
      site: 'Dailymotion',
      category: 'content',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'Dailymotion',
      category: 'content',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}

