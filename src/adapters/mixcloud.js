/**
 * @file adapters/mixcloud.js - Mixcloud Public API Adapter
 */
import { request } from '../core/http.js';

/**
 * Check Mixcloud profile via public JSON API
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkMixcloud(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://www.mixcloud.com/${encodeURIComponent(username)}/`;

  try {
    const apiUrl = `https://api.mixcloud.com/${encodeURIComponent(username)}/`;
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
        if (json.username || json.name) {
          const avatarUrl = json.pictures?.large || json.pictures?.medium || null;
          return {
            site: 'Mixcloud',
            category: 'content',
            exists: true,
            url: json.url || profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: json.name || json.username,
              bio: json.biog || null,
              avatarUrl,
              followers: json.follower_count ?? null,
              following: json.following_count ?? null,
              extra: {
                cloudcastCount: json.cloudcast_count ?? null
              }
            }
          };
        }
      } catch {
        // Fall through
      }
    }

    return {
      site: 'Mixcloud',
      category: 'content',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'Mixcloud',
      category: 'content',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}
