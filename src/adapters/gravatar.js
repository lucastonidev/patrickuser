/**
 * @file adapters/gravatar.js - Gravatar Rich Adapter
 */
import { request } from '../core/http.js';

/**
 * Check Gravatar profile and extract accounts, avatar, and bio
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkGravatar(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://gravatar.com/${encodeURIComponent(username)}`;

  try {
    const jsonUrl = `https://en.gravatar.com/${encodeURIComponent(username)}.json`;
    const res = await request(jsonUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.status === 200) {
      try {
        const data = JSON.parse(res.text);
        if (data.entry && Array.isArray(data.entry) && data.entry.length > 0) {
          const entry = data.entry[0];
          const verified = Array.isArray(entry.verifiedAccounts)
            ? entry.verifiedAccounts.map((a) => a.shortname || a.service_type).filter(Boolean)
            : [];

          return {
            site: 'Gravatar',
            category: 'tech',
            exists: true,
            url: profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: entry.displayName || entry.preferredUsername,
              bio: entry.aboutMe || null,
              avatarUrl: entry.thumbnailUrl || null,
              location: entry.currentLocation || null,
              extra: {
                verifiedAccounts: verified,
                hash: entry.hash || null
              }
            }
          };
        }
      } catch {
        // fall through
      }
    }

    return {
      site: 'Gravatar',
      category: 'tech',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'Gravatar',
      category: 'tech',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}
