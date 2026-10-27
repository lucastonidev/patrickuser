/**
 * @file adapters/github.js - GitHub Rich Adapter
 */
import { request } from '../core/http.js';
import { extractMetadata } from '../core/parser.js';

/**
 * Check GitHub profile and extract rich developer metadata
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkGitHub(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://github.com/${encodeURIComponent(username)}`;

  try {
    // Try public API first
    const apiUrl = `https://api.github.com/users/${encodeURIComponent(username)}`;
    const apiRes = await request(apiUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'PatrickUser-Mentalist-OSINT'
      }
    });

    if (apiRes.status === 200) {
      try {
        const data = JSON.parse(apiRes.text);
        return {
          site: 'GitHub',
          category: 'tech',
          exists: true,
          url: profileUrl,
          httpStatus: 200,
          durationMs: Date.now() - startTime,
          metadata: {
            name: data.name || data.login,
            bio: data.bio || null,
            avatarUrl: data.avatar_url || null,
            location: data.location || null,
            followers: data.followers ?? null,
            following: data.following ?? null,
            extra: {
              publicRepos: data.public_repos,
              publicGists: data.public_gists,
              company: data.company || null,
              blog: data.blog || null,
              createdAt: data.created_at || null
            }
          }
        };
      } catch {
        // Fallback to HTML check
      }
    } else if (apiRes.status === 404) {
      return {
        site: 'GitHub',
        category: 'tech',
        exists: false,
        url: profileUrl,
        httpStatus: 404,
        durationMs: Date.now() - startTime
      };
    }

    // Fallback: standard web request if API is rate limited (403)
    const pageRes = await request(profileUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal
    });

    const exists = pageRes.status === 200;
    const meta = exists ? extractMetadata(pageRes.text, profileUrl) : undefined;

    return {
      site: 'GitHub',
      category: 'tech',
      exists,
      url: profileUrl,
      httpStatus: pageRes.status,
      durationMs: Date.now() - startTime,
      metadata: meta
    };
  } catch (err) {
    return {
      site: 'GitHub',
      category: 'tech',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}
