/**
 * @file adapters/lichess.js - Lichess Chess Gaming Adapter
 */
import { request } from '../core/http.js';

/**
 * Check Lichess player profile and ratings
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkLichess(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://lichess.org/@/${encodeURIComponent(username)}`;

  try {
    const apiUrl = `https://lichess.org/api/user/${encodeURIComponent(username)}`;
    const res = await request(apiUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.status === 200 && res.text) {
      try {
        const user = JSON.parse(res.text);
        if (user && user.username) {
          const blitz = user.perfs?.blitz?.rating;
          const rapid = user.perfs?.rapid?.rating;
          const bullet = user.perfs?.bullet?.rating;

          return {
            site: 'Lichess',
            category: 'gaming',
            exists: true,
            url: profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: user.title ? `${user.title} ${user.username}` : user.username,
              bio: user.profile?.bio || null,
              location: user.profile?.location || null,
              extra: {
                blitzRating: blitz || null,
                rapidRating: rapid || null,
                bulletRating: bullet || null,
                totalGames: user.count?.all ?? null
              }
            }
          };
        }
      } catch {
        // Fall through
      }
    }

    return {
      site: 'Lichess',
      category: 'gaming',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'Lichess',
      category: 'gaming',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}
