/**
 * @file adapters/tiktok.js - TikTok Creator Profile Adapter via Official oEmbed API
 */
import { request } from '../core/http.js';

/**
 * Check TikTok creator profile using official oEmbed endpoint to bypass WAF challenges
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkTikTok(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://www.tiktok.com/@${encodeURIComponent(username)}`;

  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${encodeURIComponent(username)}`;
    const res = await request(oembedUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (res.status === 200 && res.text) {
      try {
        const json = JSON.parse(res.text);
        if (json.author_name || json.title) {
          return {
            site: 'TikTok',
            category: 'social',
            exists: true,
            url: json.author_url || profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: json.author_name || username,
              title: json.title || null,
              extra: {
                provider: json.provider_name || 'TikTok',
                embedType: json.embed_type || null
              }
            }
          };
        }
      } catch {
        // Fall through
      }
    }

    if (res.status === 429) {
      return {
        site: 'TikTok',
        category: 'social',
        exists: false,
        url: profileUrl,
        httpStatus: 429,
        durationMs: Date.now() - startTime,
        rateLimited: true,
        error: 'TikTok rate limited'
      };
    }

    return {
      site: 'TikTok',
      category: 'social',
      exists: false,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime
    };
  } catch (err) {
    return {
      site: 'TikTok',
      category: 'social',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}
