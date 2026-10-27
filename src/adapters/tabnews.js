/**
 * @file adapters/tabnews.js - TabNews (Brasil Tech Community) Adapter
 */
import { request } from '../core/http.js';

/**
 * Check TabNews profile and extract TabCoins, bio and creations
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkTabNews(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://www.tabnews.com.br/${encodeURIComponent(username)}`;

  try {
    const apiUrl = `https://www.tabnews.com.br/api/v1/users/${encodeURIComponent(username)}`;
    const res = await request(apiUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.status === 200) {
      try {
        const user = JSON.parse(res.text);
        if (user && user.username) {
          return {
            site: 'TabNews',
            category: 'brasil',
            exists: true,
            url: profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: user.username,
              bio: user.description || null,
              avatarUrl: null,
              extra: {
                tabcoins: user.tabcoins ?? 0,
                tabcash: user.tabcash ?? 0,
                createdAt: user.created_at || null
              }
            }
          };
        }
      } catch {
        // fall through
      }
    }

    return {
      site: 'TabNews',
      category: 'brasil',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'TabNews',
      category: 'brasil',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}
