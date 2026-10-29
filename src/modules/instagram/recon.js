/**
 * @file modules/instagram/recon.js
 * Instagram Public Profile Reconnaissance & Meta Account Recovery Engine
 * Modernized 100% Native Node.js ESM inspired by YesItsMe
 */

import crypto from 'node:crypto';
import { request, getRandomUserAgent } from '../../core/http.js';
import { decodeHtmlEntities } from '../../core/parser.js';

const WEB_APP_ID = '936619743392459';
const ASBD_ID = '129477';

// YesItsMe / Toutatis official private mobile HMAC key
const IG_SIG_KEY = 'e6358aeede676184b9fe702b30f4fd35e71744605e39d2181a34cede076b3c33';
const SIG_KEY_VERSION = '4';

/**
 * Generate YesItsMe HMAC signed body for Instagram Mobile API endpoints
 * @param {string} payloadString
 * @returns {string}
 */
export function generateInstagramSignature(payloadString) {
  const hmac = crypto.createHmac('sha256', IG_SIG_KEY).update(payloadString).digest('hex');
  return `ig_sig_key_version=${SIG_KEY_VERSION}&signed_body=${hmac}.${encodeURIComponent(payloadString)}`;
}

/**
 * Extract followers, following, posts and full name from standard Instagram OpenGraph description
 * e.g. "1,234 Followers, 567 Following, 89 Posts - See Instagram photos and videos from Carlos Silva (@carlos.silva)"
 * 
 * @param {string} rawOgDescription
 * @param {string} [rawOgTitle='']
 * @returns {{ followers: number, following: number, postsCount: number, fullName: string }}
 */
export function parseOgDescription(rawOgDescription, rawOgTitle = '') {
  const result = {
    followers: 0,
    following: 0,
    postsCount: 0,
    fullName: ''
  };

  if (!rawOgDescription || typeof rawOgDescription !== 'string') return result;

  const ogDescription = decodeHtmlEntities(rawOgDescription);
  const ogTitle = decodeHtmlEntities(rawOgTitle);

  // Numbers parsing helper (handles 1,234 or 1.234 or 12K or 1.5M or 680M)
  function parseCount(str) {
    if (!str) return 0;
    const clean = str.trim().toUpperCase();
    if (cEnds(clean, 'K')) {
      return Math.round(parseFloat(clean.slice(0, -1).replace(',', '.')) * 1000);
    }
    if (cEnds(clean, 'M')) {
      return Math.round(parseFloat(clean.slice(0, -1).replace(',', '.')) * 1000000);
    }
    return parseInt(clean.replace(/[.,\s]/g, ''), 10) || 0;
  }

  function cEnds(s, suffix) {
    return s.endsWith(suffix);
  }

  const matchStats = ogDescription.match(/([\d.,KM]+)\s*Followers?,\s*([\d.,KM]+)\s*Following,\s*([\d.,KM]+)\s*Posts?/i);
  if (matchStats) {
    result.followers = parseCount(matchStats[1]);
    result.following = parseCount(matchStats[2]);
    result.postsCount = parseCount(matchStats[3]);
  }

  // Extract name: "... from Full Name (@username)"
  const matchName = ogDescription.match(/from\s+(.+?)\s+\(@/i) || ogTitle.match(/^(.+?)\s*\(@/);
  if (matchName) {
    result.fullName = decodeHtmlEntities(matchName[1].trim());
  }

  return result;
}

/**
 * Extract rich profile attributes directly from public Instagram HTML page
 * @param {string} html
 * @param {string} cleanHandle
 * @returns {{
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
 *   } | null
 * }}
 */
export function parseInstagramHtml(html, cleanHandle) {
  if (!html || typeof html !== 'string') {
    return { exists: false, profile: null };
  }

  // Extract meta tags by property or content
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i);
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i);
  const ogImgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i);

  if (!ogTitleMatch && !ogImgMatch) {
    return { exists: false, profile: null };
  }

  const ogTitle = ogTitleMatch ? decodeHtmlEntities(ogTitleMatch[1]) : '';
  const ogDesc = ogDescMatch ? decodeHtmlEntities(ogDescMatch[1]) : '';
  const ogImg = ogImgMatch ? decodeHtmlEntities(ogImgMatch[1]) : '';

  // Nonexistent user returns title "Instagram" and no description
  if (ogTitle === 'Instagram' && !ogDesc) {
    return { exists: false, profile: null };
  }

  // Parse followers, following, posts, full name
  const parsed = parseOgDescription(ogDesc, ogTitle);

  // Extract biography from embedded JSON scripts
  let biography = '';
  const bioMatch = html.match(/"biography":"([^"]*)"/);
  if (bioMatch) {
    try {
      biography = JSON.parse('"' + bioMatch[1] + '"');
    } catch {
      biography = bioMatch[1];
    }
  }

  // Extract Meta User ID (PK)
  let id = '';
  const idMatch = html.match(/"props":\{"id":"(\d+)"/) ||
    html.match(/"user_id":"(\d+)"/) ||
    html.match(/"target_id":"(\d+)"/) ||
    html.match(/profilePage_(\d+)/);
  if (idMatch) {
    id = idMatch[1];
  }

  // Verified & Private flags
  const isVerified = /"is_verified":true/.test(html);
  const isPrivate = /"is_private":true/.test(html);

  // External URL
  let externalUrl = '';
  const extUrlMatch = html.match(/"external_url":"([^"]*)"/);
  if (extUrlMatch) {
    try {
      externalUrl = JSON.parse('"' + extUrlMatch[1] + '"');
    } catch {
      externalUrl = extUrlMatch[1];
    }
  }

  return {
    exists: true,
    profile: {
      id,
      username: cleanHandle,
      fullName: parsed.fullName || cleanHandle,
      biography: biography || ogDesc,
      avatarUrl: ogImg || '',
      isPrivate,
      isVerified,
      followers: parsed.followers,
      following: parsed.following,
      postsCount: parsed.postsCount,
      externalUrl
    }
  };
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
 * @param {number} [options.timeout=8000]
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
 *   source: 'api' | 'web_opengraph' | 'mock' | 'none',
 *   rateLimited: boolean
 * }>}
 */
export async function reconInstagramProfile(username, options = {}) {
  const cleanHandle = username.replace(/^@+/, '').trim();
  const sessionId = options.sessionId || process.env.IG_SESSION_ID || process.env.INSTAGRAM_SESSION_ID || null;
  const timeout = options.timeout || 8000;
  const mockData = options.mockData;

  if (mockData && mockData[cleanHandle]) {
    return {
      exists: true,
      profile: mockData[cleanHandle],
      source: 'mock',
      rateLimited: false
    };
  }

  const profileUrl = `https://www.instagram.com/${cleanHandle}/`;
  const ua = getRandomUserAgent();

  // Step 1: If session cookie is provided, attempt official Instagram User Info endpoint (YesItsMe getInfo)
  if (sessionId) {
    try {
      const headers = {
        'User-Agent': 'Instagram 278.0.0.19.115 Android',
        'Cookie': `sessionid=${sessionId};`,
        'Accept': '*/*'
      };

      const webApiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(cleanHandle)}`;
      const apiRes = await request(webApiUrl, {
        headers: {
          ...headers,
          'x-ig-app-id': WEB_APP_ID,
          'x-asbd-id': ASBD_ID,
          'x-requested-with': 'XMLHttpRequest',
          'Referer': profileUrl
        },
        timeout
      });

      if (apiRes.status === 200) {
        const json = JSON.parse(apiRes.text);
        const user = json?.data?.user;
        if (user) {
          return {
            exists: true,
            profile: {
              id: String(user.id || ''),
              username: user.username || cleanHandle,
              fullName: user.full_name || cleanHandle,
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
      }
    } catch {
      // Fallback to HTML parsing
    }
  }

  // Step 2: High-accuracy Public HTML & JSON Parser
  try {
    const htmlRes = await request(profileUrl, {
      method: 'GET',
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8'
      },
      timeout
    });

    if (htmlRes.status === 200) {
      const parsed = parseInstagramHtml(htmlRes.text, cleanHandle);
      if (parsed.exists && parsed.profile) {
        return {
          exists: true,
          profile: parsed.profile,
          source: 'web_opengraph',
          rateLimited: false
        };
      } else {
        return {
          exists: false,
          profile: null,
          source: 'web_opengraph',
          rateLimited: false
        };
      }
    }

    if (htmlRes.status === 404) {
      return {
        exists: false,
        profile: null,
        source: 'web_opengraph',
        rateLimited: false
      };
    }
  } catch {
    // Continue
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
 * @param {number} [options.timeout=8000]
 * @param {string} [options.sessionId]
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
  const cleanTarget = usernameOrEmail.replace(/^@+/, '').trim();
  const sessionId = options.sessionId || process.env.IG_SESSION_ID || process.env.INSTAGRAM_SESSION_ID || null;
  const timeout = options.timeout || 8000;
  const mockRecovery = options.mockRecovery;

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

  // 1. YesItsMe Mobile HMAC Signed Lookup
  try {
    const payload = JSON.stringify({
      login_attempt_count: '0',
      directly_sign_in: 'true',
      source: 'default',
      q: cleanTarget,
      ig_sig_key_version: SIG_KEY_VERSION
    });

    const signedBody = generateInstagramSignature(payload);
    const lookupHeaders = {
      'Accept-Language': 'en-US',
      'User-Agent': 'Instagram 101.0.0.15.120',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-FB-HTTP-Engine': 'Liger'
    };

    if (sessionId) {
      lookupHeaders['Cookie'] = `sessionid=${sessionId};`;
    }

    const res = await request('https://i.instagram.com/api/v1/users/lookup/', {
      method: 'POST',
      headers: lookupHeaders,
      body: signedBody,
      timeout
    });

    if (res.status === 200) {
      const rep = JSON.parse(res.text);
      const user = rep?.user || rep;

      const maskedEmail = user?.obfuscated_email || user?.email || null;
      const maskedPhone = user?.obfuscated_phone || user?.phone_number || null;

      if (maskedEmail || maskedPhone) {
        return {
          success: true,
          maskedEmail,
          maskedPhone,
          contactPoint: user?.contact_point || null,
          message: 'Contact mask retrieved successfully via mobile lookup',
          rateLimited: false
        };
      }
    }
  } catch {
    // Continue to web recovery flow
  }

  // 2. Web Recovery Flow (account_recovery_send_ajax)
  try {
    const recoveryUrl = 'https://www.instagram.com/api/v1/web/accounts/account_recovery_send_ajax/';
    const body = `email_or_username=${encodeURIComponent(cleanTarget)}&flow=lookup`;
    const headers = {
      'x-ig-app-id': WEB_APP_ID,
      'x-asbd-id': ASBD_ID,
      'x-csrftoken': options.csrfToken || 'missing',
      'x-requested-with': 'XMLHttpRequest',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': 'https://www.instagram.com/accounts/password/reset/',
      'User-Agent': getRandomUserAgent()
    };

    if (sessionId) {
      headers['Cookie'] = `sessionid=${sessionId};`;
    }

    const res = await request(recoveryUrl, {
      method: 'POST',
      headers,
      body,
      timeout
    });

    if (res.status === 200) {
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
    }
  } catch {
    // Continue
  }

  return {
    success: false,
    maskedEmail: null,
    maskedPhone: null,
    contactPoint: null,
    message: sessionId ? 'Nenhuma máscara de recuperação encontrada' : 'Sessão requerida para máscaras de recuperação',
    rateLimited: false
  };
}
