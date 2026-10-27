/**
 * @file adapters/bluesky.js - Bluesky Social Adapter
 */
import { request } from '../core/http.js';

/**
 * Check Bluesky profile via AT Protocol public endpoint
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkBluesky(username, options = {}) {
  const startTime = Date.now();
  const handle = username.includes('.') ? username : `${username}.bsky.social`;
  const profileUrl = `https://bsky.app/profile/${encodeURIComponent(handle)}`;

  try {
    const apiUrl = `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(handle)}`;
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
        if (data && data.did) {
          return {
            site: 'Bluesky',
            category: 'social',
            exists: true,
            url: profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: data.displayName || data.handle,
              bio: data.description || null,
              avatarUrl: data.avatar || null,
              followers: data.followersCount ?? null,
              following: data.followsCount ?? null,
              extra: {
                did: data.did,
                postsCount: data.postsCount ?? 0,
                createdAt: data.createdAt || null
              }
            }
          };
        }
      } catch {
        // fall through
      }
    }

    return {
      site: 'Bluesky',
      category: 'social',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'Bluesky',
      category: 'social',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}
