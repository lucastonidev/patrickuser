/**
 * @file adapters/anilist.js - AniList Anime & Gaming Community Adapter
 */
import { request } from '../core/http.js';

/**
 * Check AniList account via public GraphQL
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkAniList(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://anilist.co/user/${encodeURIComponent(username)}`;

  try {
    const res = await request('https://graphql.anilist.co', {
      method: 'POST',
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: {
        query: 'query ($name: String) { User (name: $name) { id name avatar { large } siteUrl about } }',
        variables: { name: username }
      }
    });

    if (res.status === 200 && res.text) {
      try {
        const json = JSON.parse(res.text);
        const user = json.data?.User;
        if (user && user.id) {
          return {
            site: 'AniList',
            category: 'content',
            exists: true,
            url: user.siteUrl || profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: user.name,
              avatarUrl: user.avatar?.large || null,
              bio: user.about ? user.about.replace(/<[^>]*>/g, '').slice(0, 150) : null,
              extra: {
                id: user.id
              }
            }
          };
        }
      } catch {
        // Fall through
      }
    }

    return {
      site: 'AniList',
      category: 'content',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'AniList',
      category: 'content',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}

