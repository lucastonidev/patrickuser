/**
 * @file modules/instagram/recon.js
 * Instagram Public Profile Reconnaissance & Meta Account Recovery Engine
 * Modernized 100% Native Node.js ESM inspired by YesItsMe
 */

import { request, getRandomUserAgent } from '../../core/http.js';
import { extractMetadata, decodeHtmlEntities } from '../../core/parser.js';

const WEB_APP_ID = '936619743392459';
const ASBD_ID = '129477';

/**
 * Extract followers, following, posts and full name from standard Instagram OpenGraph description
 * e.g. "1,234 Followers, 567 Following, 89 Posts - See Instagram photos and videos from Carlos Silva (@carlos.silva)"
 * 
 * @param {string} ogDescription
 * @param {string} [ogTitle]
 * @returns {{ followers: number, following: number, postsCount: number, fullName: string }}
 */
export function parseOgDescription(ogDescription, ogTitle = '') {
  const result = {
    followers: 0,
    following: 0,
    postsCount: 0,
    fullName: ''
  };

  if (!ogDescription || typeof ogDescription !== 'string') return result;

  // Numbers parsing helper (handles 1,234 or 1.234 or 12K or 1.5M)
  function parseCount(str) {
    if (!str) return 0;
    const clean = str.trim().toUpperCase();
    if (clean.endsWith('K')) {
      return Math.round(parseFloat(clean.replace(',', '.')) * 1000);
    }
    if (clean.endsWith('M')) {
      return Math.round(parseFloat(clean.replace(',', '.')) * 1000000);
    }
    return parseInt(clean.replace(/[.,\s]/g, ''), 10) || 0;
  }

  const matchStats = ogDescription.match(/([\d.,KM]+)\s*Followers?,\s*([\d.,KM]+)\s*Following,\s*([\d.,KM]+)\s*Posts?/i);
  if (matchStats) {
    result.followers = parseCount(matchStats[1]);
    result.following = parseCount(matchStats[2]);
    result.postsCount = parseCount(matchStats[3]);
  }

  // Extract name: "... from Full Name (@username)"
  const matchName = ogDescription.match(/from\s+(.+?)\s+\(@/i);
  if (matchName) {
    result.fullName = decodeHtmlEntities(matchName[1].trim());
  } else if (ogTitle) {
    // "Carlos Silva (@carlos.silva) • Instagram photos and videos"
    const matchTitle = ogTitle.match(/^(.+?)\s*\(@/);
    if (matchTitle) {
      result.fullName = decodeHtmlEntities(matchTitle[1].trim());
    }
  }

  return result;
}

/**
 * Extract masked email and masked phone from recovery response text / message
 * @param {string} text
 * @returns {{ maskedEmail: string|null, maskedPhone: string|null }}
 */
export function extractMasksFromText(text) {
  let maskedEmail = null;
  let maskedPhone = null;

  if (!text || typeof text !== 'string') {
    return { maskedEmail, maskedPhone };
  }

  // Email pattern with asterisks (e.g. c******o@g****.com)
  const emailRegex = /([a-zA-Z0-9*._%+-]+@[a-zA-Z0-9*.-]+\.[a-zA-Z*]{2,})/g;
  const emailMatch = text.match(emailRegex);
  if (emailMatch && emailMatch[0]) {
    maskedEmail = emailMatch[0];
  }

  // Phone pattern with asterisks (e.g. +55 ** *****-4321 or +55 ** *** ** 21)
  const phoneRegex = /(\+\d{1,3}[\d\s*()-]+\d{2,4})/g;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch && phoneMatch[0]) {
    maskedPhone = phoneMatch[0].trim();
  }

  return { maskedEmail, maskedPhone };
}

/**
 * Fetch public Instagram profile information using native endpoints with resilient fallbacks
 * 
 * @param {string} username
 * @param {Object} [options]
 * @param {number} [options.timeout=6000]
 * @param {string} [options.sessionId]
 * @param {Object} [options.mockData]
 * @returns {Promise<{
 *   exists: boolean,
 *   profile: {
 *     id: string,
 *     username: string,
 *     fullName: string,
 *     biography: string,
 *     avatarUrl: string,
 *     isPrivate: boolean,
 *     isVerified: boolean,
 *     followers: number,
 *     following: number,
 *     postsCount: number,
 *     externalUrl: string
 *   } | null,
 *   source: 'api' | 'web_opengraph' | 'oembed' | 'mock' | 'none',
 *   rateLimited: boolean
 * }>}
 */
export async function reconInstagramProfile(username, options = {}) {
  const {
    timeout = 6000,
    sessionId = null,
    mockData = null
  } = options;

  if (mockData && mockData[username]) {
    return {
      exists: true,
      profile: mockData[username],
      source: 'mock',
      rateLimited: false
    };
  }

  const cleanHandle = username.replace(/^@+/, '').trim();
  const profileUrl = `https://www.instagram.com/${cleanHandle}/`;

  // Step 1: Query Instagram Web Profile Info API
  const apiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(cleanHandle)}`;
  const headers = {
    'x-ig-app-id': WEB_APP_ID,
    'x-asbd-id': ASBD_ID,
    'x-ig-www-claim': '0',
    'x-requested-with': 'XMLHttpRequest',
    'Accept': '*/*',
    'Referer': profileUrl,
    'User-Agent': getRandomUserAgent()
  };

  if (sessionId) {
    headers['Cookie'] = `sessionid=${sessionId};`;
  }

  try {
    const res = await request(apiUrl, {
      method: 'GET',
      headers,
      timeout
    });

    if (res.status === 200) {
      try {
        const json = JSON.parse(res.text);
        const user = json?.data?.user;
        if (user) {
          return {
            exists: true,
            profile: {
              id: String(user.id || ''),
              username: user.username || cleanHandle,
              fullName: user.full_name || '',
              biography: user.biography || '',
              avatarUrl: user.profile_pic_url_hd || user.profile_pic_url || '',
              isPrivate: Boolean(user.is_private),
              isVerified: Boolean(user.is_verified),
              followers: user.edge_followed_by?.count || 0,
              following: user.edge_follow?.count || 0,
              postsCount: user.edge_owner_to_timeline_media?.count || 0,
              externalUrl: user.external_url || ''
            },
            source: 'api',
            rateLimited: false
          };
        }
      } catch {
        // Fallback to HTML scraping
      }
    }

    if (res.status === 404) {
      return {
        exists: false,
        profile: null,
        source: 'api',
        rateLimited: false
      };
    }
  } catch {
    // Continue to fallbacks on network timeout or connection reset
  }

  // Step 2: Fallback to HTML OpenGraph scraping
  try {
    const htmlRes = await request(profileUrl, {
      method: 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout
    });

    if (htmlRes.status === 200) {
      const meta = extractMetadata(htmlRes.text);
      if (meta.title && !meta.title.includes('Page Not Found')) {
        const parsed = parseOgDescription(meta.description || '', meta.title || '');
        return {
          exists: true,
          profile: {
            id: '',
            username: cleanHandle,
            fullName: parsed.fullName || meta.title.split('(')[0].trim(),
            biography: meta.description || '',
            avatarUrl: meta.image || '',
            isPrivate: false,
            isVerified: false,
            followers: parsed.followers,
            following: parsed.following,
            postsCount: parsed.postsCount,
            externalUrl: ''
          },
          source: 'web_opengraph',
          rateLimited: false
        };
      }
    } else if (htmlRes.status === 404) {
      return {
        exists: false,
        profile: null,
        source: 'web_opengraph',
        rateLimited: false
      };
    }
  } catch {
    // Continue to oEmbed fallback
  }

  // Step 3: Fallback to Public oEmbed API
  try {
    const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(profileUrl)}`;
    const oembedRes = await request(oembedUrl, {
      method: 'GET',
      timeout
    });

    if (oembedRes.status === 200) {
      const data = JSON.parse(oembedRes.text);
      if (data && data.author_name) {
        return {
          exists: true,
          profile: {
            id: '',
            username: cleanHandle,
            fullName: data.author_name || '',
            biography: data.title || '',
            avatarUrl: data.thumbnail_url || '',
            isPrivate: false,
            isVerified: false,
            followers: 0,
            following: 0,
            postsCount: 0,
            externalUrl: data.author_url || ''
          },
          source: 'oembed',
          rateLimited: false
        };
      }
    }
  } catch {
    // Ignore and conclude
  }

  return {
    exists: false,
    profile: null,
    source: 'none',
    rateLimited: true
  };
}

/**
 * Query Instagram Account Recovery lookup to retrieve obfuscated contact points (email / phone masks)
 * YesItsMe core functionality in modern native Node.js ESM
 * 
 * @param {string} usernameOrEmail
 * @param {Object} [options]
 * @param {number} [options.timeout=6000]
 * @param {string} [options.csrfToken]
 * @param {Object} [options.mockRecovery]
 * @returns {Promise<{
 *   success: boolean,
 *   maskedEmail: string | null,
 *   maskedPhone: string | null,
 *   contactPoint: string | null,
 *   message: string | null,
 *   rateLimited: boolean
 * }>}
 */
export async function lookupAccountRecovery(usernameOrEmail, options = {}) {
  const {
    timeout = 6000,
    csrfToken = 'missing',
    mockRecovery = null
  } = options;

  const cleanTarget = usernameOrEmail.replace(/^@+/, '').trim();

  if (mockRecovery && mockRecovery[cleanTarget]) {
    const mock = mockRecovery[cleanTarget];
    return {
      success: true,
      maskedEmail: mock.maskedEmail || null,
      maskedPhone: mock.maskedPhone || null,
      contactPoint: mock.contactPoint || null,
      message: mock.message || 'Recovery lookup succeeded (mock)',
      rateLimited: false
    };
  }

  const recoveryUrl = 'https://www.instagram.com/api/v1/web/accounts/account_recovery_send_ajax/';
  const body = `email_or_username=${encodeURIComponent(cleanTarget)}&flow=lookup`;

  try {
    const res = await request(recoveryUrl, {
      method: 'POST',
      headers: {
        'x-ig-app-id': WEB_APP_ID,
        'x-asbd-id': ASBD_ID,
        'x-csrftoken': csrfToken,
        'x-requested-with': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://www.instagram.com/accounts/password/reset/',
        'User-Agent': getRandomUserAgent()
      },
      body,
      timeout
    });

    if (res.status === 200) {
      try {
        const data = JSON.parse(res.text);
        const masks = extractMasksFromText(JSON.stringify(data));

        return {
          success: true,
          maskedEmail: data.email || masks.maskedEmail || null,
          maskedPhone: data.phone_number || masks.maskedPhone || null,
          contactPoint: data.contact_point || null,
          message: data.message || null,
          rateLimited: false
        };
      } catch {
        // Fallback parse text
        const masks = extractMasksFromText(res.text);
        if (masks.maskedEmail || masks.maskedPhone) {
          return {
            success: true,
            maskedEmail: masks.maskedEmail,
            maskedPhone: masks.maskedPhone,
            contactPoint: null,
            message: res.text,
            rateLimited: false
          };
        }
      }
    }

    if (res.status === 429) {
      return {
        success: false,
        maskedEmail: null,
        maskedPhone: null,
        contactPoint: null,
        message: 'Instagram rate limit exceeded (HTTP 429)',
        rateLimited: true
      };
    }
  } catch (err) {
    return {
      success: false,
      maskedEmail: null,
      maskedPhone: null,
      contactPoint: null,
      message: err.message,
      rateLimited: true
    };
  }

  return {
    success: false,
    maskedEmail: null,
    maskedPhone: null,
    contactPoint: null,
    message: null,
    rateLimited: false
  };
}

