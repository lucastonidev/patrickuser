/**
 * @file adapters/duolingo.js - Duolingo Rich Adapter
 */
import { request } from '../core/http.js';

/**
 * Check Duolingo profile and extract streaks, courses and XP
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkDuolingo(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://www.duolingo.com/profile/${encodeURIComponent(username)}`;

  try {
    const apiUrl = `https://www.duolingo.com/2017-06-30/users?username=${encodeURIComponent(username)}`;
    const res = await request(apiUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.status === 200) {
      try {
        const data = JSON.parse(res.text);
        if (data.users && Array.isArray(data.users) && data.users.length > 0) {
          const user = data.users[0];
          const courses = Array.isArray(user.courses)
            ? user.courses.map((c) => c.title || c.learningLanguage).filter(Boolean)
            : [];

          let avatarUrl = user.picture ? (user.picture.startsWith('//') ? `https:${user.picture}` : user.picture) : null;
          if (avatarUrl) avatarUrl = `${avatarUrl}/xlarge`;

          return {
            site: 'Duolingo',
            category: 'content',
            exists: true,
            url: profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: user.name || user.username,
              bio: user.bio || null,
              avatarUrl,
              extra: {
                streak: user.streak || 0,
                totalXp: user.totalXp || 0,
                coursesLearning: courses.slice(0, 5),
                creationDate: user.creationDate ? new Date(user.creationDate * 1000).toISOString() : null
              }
            }
          };
        }
      } catch {
        // fall through
      }
    }

    return {
      site: 'Duolingo',
      category: 'content',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'Duolingo',
      category: 'content',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}

