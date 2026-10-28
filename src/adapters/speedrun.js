/**
 * @file adapters/speedrun.js - Speedrun.com Gaming Records Adapter
 */
import { request } from '../core/http.js';

/**
 * Check Speedrun.com speedrunner profile via public REST API
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkSpeedrun(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://www.speedrun.com/user/${encodeURIComponent(username)}`;

  try {
    const apiUrl = `https://www.speedrun.com/api/v1/users?lookup=${encodeURIComponent(username)}`;
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
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          const u = json.data[0];
          return {
            site: 'Speedrun.com',
            category: 'gaming',
            exists: true,
            url: u.weblink || profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: u.names?.international || username,
              location: u.location?.country?.names?.international || null,
              extra: {
                id: u.id,
                role: u.role
              }
            }
          };
        }
      } catch {
        // Fall through
      }
    }

    return {
      site: 'Speedrun.com',
      category: 'gaming',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'Speedrun.com',
      category: 'gaming',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}

