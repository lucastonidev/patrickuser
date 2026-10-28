/**
 * @file adapters/reddit.js - Reddit Rich Adapter
 */
import { request } from '../core/http.js';
import { extractMetadata } from '../core/parser.js';

/**
 * Check Reddit profile and extract karma and avatar
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkReddit(username, options = {}) {
  const startTime = Date.now();
  const profileUrl = `https://www.reddit.com/user/${encodeURIComponent(username)}`;

  try {
    const jsonUrl = `https://www.reddit.com/user/${encodeURIComponent(username)}/about.json`;
    const res = await request(jsonUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      }
    });

    if (res.status === 200) {
      try {
        const json = JSON.parse(res.text);
        if (json && json.data && json.data.name) {
          const d = json.data;
          let avatar = d.icon_img ? d.icon_img.split('?')[0] : null;
          return {
            site: 'Reddit',
            category: 'social',
            exists: true,
            url: profileUrl,
            httpStatus: 200,
            durationMs: Date.now() - startTime,
            metadata: {
              name: `u/${d.name}`,
              bio: d.subreddit ? (d.subreddit.public_description || null) : null,
              avatarUrl: avatar,
              extra: {
                totalKarma: d.total_karma,
                linkKarma: d.link_karma,
                commentKarma: d.comment_karma,
                createdUtc: d.created_utc,
                isGold: d.is_gold,
                isMod: d.is_mod
              }
            }
          };
        }
      } catch {
        // Continue to fallback
      }
    } else if (res.status === 404) {
      return {
        site: 'Reddit',
        category: 'social',
        exists: false,
        url: profileUrl,
        httpStatus: 404,
        durationMs: Date.now() - startTime
      };
    }

    // Fallback HTML page check
    const pageRes = await request(profileUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal
    });

    const notFound = pageRes.status === 404 ||
      pageRes.text.includes("Sorry, nobody on Reddit goes by that name") ||
      pageRes.text.includes("This account has been suspended");

    const exists = pageRes.status === 200 && !notFound;
    const meta = exists ? extractMetadata(pageRes.text, profileUrl) : undefined;

    return {
      site: 'Reddit',
      category: 'social',
      exists,
      url: profileUrl,
      httpStatus: pageRes.status,
      durationMs: Date.now() - startTime,
      metadata: meta
    };
  } catch (err) {
    return {
      site: 'Reddit',
      category: 'social',
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}

