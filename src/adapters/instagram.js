/**
 * @file adapters/instagram.js - Instagram Profile Adapter with Deep Metadata Extraction
 */
import { request } from '../core/http.js';
import { decodeHtmlEntities } from '../core/parser.js';

/**
 * Check Instagram profile and extract rich observational metadata
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>}
 */
export async function checkInstagram(username, options = {}) {
  const startTime = Date.now();
  const cleanHandle = username.replace(/^@+/, '').trim();
  const profileUrl = `https://www.instagram.com/${encodeURIComponent(cleanHandle)}/`;

  try {
    const res = await request(profileUrl, {
      timeout: options.timeout || 8000,
      signal: options.signal,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8'
      }
    });

    const html = res.text || '';

    // Nonexistent profiles return status 200 with title "Instagram" and no og tags
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i);
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i);
    const ogImgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i);

    if (!ogTitleMatch && !ogImgMatch) {
      return {
        site: 'Instagram',
        category: 'social',
        exists: false,
        url: profileUrl,
        httpStatus: res.status,
        durationMs: Date.now() - startTime
      };
    }

    const ogTitle = ogTitleMatch ? decodeHtmlEntities(ogTitleMatch[1]) : '';
    const ogDesc = ogDescMatch ? decodeHtmlEntities(ogDescMatch[1]) : '';
    const ogImg = ogImgMatch ? decodeHtmlEntities(ogImgMatch[1]) : '';

    if (ogTitle === 'Instagram' && !ogDesc) {
      return {
        site: 'Instagram',
        category: 'social',
        exists: false,
        url: profileUrl,
        httpStatus: res.status,
        durationMs: Date.now() - startTime
      };
    }

    const parseCount = (s) => {
      if (!s) return 0;
      const c = s.trim().toUpperCase();
      if (c.endsWith('K')) return Math.round(parseFloat(c.replace(',', '.')) * 1000);
      if (c.endsWith('M')) return Math.round(parseFloat(c.replace(',', '.')) * 1000000);
      return parseInt(c.replace(/[.,\s]/g, ''), 10) || 0;
    };

    const matchStats = ogDesc.match(/([\d.,KM]+)\s*Followers?,\s*([\d.,KM]+)\s*Following,\s*([\d.,KM]+)\s*Posts?/i);
    const followers = matchStats ? parseCount(matchStats[1]) : null;
    const following = matchStats ? parseCount(matchStats[2]) : null;
    const postsCount = matchStats ? parseCount(matchStats[3]) : null;

    const matchName = ogDesc.match(/from\s+(.+?)\s+\(@/i) || ogTitle.match(/^(.+?)\s*\(@/);
    const fullName = matchName ? matchName[1].trim() : '';

    let bio = '';
    const bioMatch = html.match(/"biography":"([^"]*)"/);
    if (bioMatch) {
      try {
        bio = JSON.parse('"' + bioMatch[1] + '"');
      } catch {
        bio = bioMatch[1];
      }
    }

    let id = '';
    const idMatch = html.match(/"props":\{"id":"(\d+)"/) || html.match(/"user_id":"(\d+)"/) || html.match(/"target_id":"(\d+)"/);
    if (idMatch) id = idMatch[1];

    const isVerified = /"is_verified":true/.test(html);
    const isPrivate = /"is_private":true/.test(html);

    return {
      site: 'Instagram',
      category: 'social',
      exists: true,
      url: profileUrl,
      httpStatus: res.status,
      durationMs: Date.now() - startTime,
      metadata: {
        name: fullName || cleanHandle,
        bio: bio || ogDesc,
        avatarUrl: ogImg || null,
        followers,
        following,
        extra: {
          posts: postsCount,
          metaPk: id || undefined,
          isVerified,
          isPrivate
        }
      }
    };
  } catch (err) {
    return {
      site: 'Instagram',
      category: 'social',
      exists: false,
      url: profileUrl,
      httpStatus: 0,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}
