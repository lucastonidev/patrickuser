/**
 * @file adapters/freelancer.js - Freelancer Public API Adapter
 */
import { request } from '../core/http.js';

/**
 * Check Freelancer profile via public API
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkFreelancer(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://www.freelancer.com/u/${encodeURIComponent(username)}`;

  try {
    const apiUrl = `https://www.freelancer.com/api/users/0.1/users?usernames[]=${encodeURIComponent(username)}`;
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
        const users = json.result?.users;
        if (users && typeof users === 'object') {
          const userIds = Object.keys(users);
          if (userIds.length > 0) {
            const u = users[userIds[0]];
            return {
              site: 'Freelancer',
              category: 'professional',
              exists: true,
              url: profileUrl,
              httpStatus: 200,
              durationMs: Date.now() - startTime,
              metadata: {
                name: u.username || username,
                extra: {
                  id: u.id,
                  status: u.status
                }
              }
            };
          }
        }
      } catch {
        // Fall through
      }
    }

    return {
      site: 'Freelancer',
      category: 'professional',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'Freelancer',
      category: 'professional',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}
