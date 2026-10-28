/**
 * @file adapters/archiveorg.js - Internet Archive Adapter
 */
import { request } from '../core/http.js';

/**
 * Check Archive.org user profile via metadata endpoint
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkArchiveOrg(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://archive.org/details/@${encodeURIComponent(username)}`;

  try {
    const metaUrl = `https://archive.org/metadata/@${encodeURIComponent(username)}`;
    const res = await request(metaUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.status === 200 && res.text) {
      const trimmed = res.text.trim();
      if (trimmed === '{}' || trimmed.length <= 4) {
        return {
          site: 'Archive.org',
          category: 'content',
          exists: false,
          url: profileUrl,
          httpStatus: 200,
          durationMs: Date.now() - startTime
        };
      }

      try {
        const json = JSON.parse(res.text);
        if (json.created || (json.metadata && json.metadata.publicdate)) {
          return {
            site: 'Archive.org',
            category: 'content',
            exists: true,
            url: profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: json.metadata?.title || username,
              bio: json.metadata?.description || null,
              extra: {
                created: json.created ? new Date(json.created * 1000).toISOString() : null,
                itemCount: Array.isArray(json.files) ? json.files.length : undefined
              }
            }
          };
        }
      } catch {
        // Fall through
      }
    }

    return {
      site: 'Archive.org',
      category: 'content',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'Archive.org',
      category: 'content',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}
