/**
 * @file parser.js - High-speed OpenGraph, Twitter Card & JSON-LD Metadata Extractor
 * Zero external dependencies, pure regex-based parsing optimized for microsecond latency.
 */

/**
 * Decode common HTML entities
 * @param {string} str
 * @returns {string}
 */
export function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .trim();
}

/**
 * Extract OpenGraph and standard metadata from HTML text
 * @param {string} html
 * @param {string} [baseUrl='']
 * @returns {import('./types.js').ProfileMetadata}
 */
export function extractMetadata(html, baseUrl = '') {
  /** @type {import('./types.js').ProfileMetadata} */
  const metadata = {
    name: null,
    title: null,
    bio: null,
    avatarUrl: null,
    location: null,
    followers: null,
    following: null,
    extra: {}
  };

  if (!html || typeof html !== 'string') {
    return metadata;
  }

  // Quick extract title tag
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    metadata.title = decodeHtmlEntities(titleMatch[1].replace(/\s+/g, ' '));
  }

  // Extract meta tags by property or name
  // Matches: <meta property="og:..." content="..."> or <meta content="..." property="og:...">
  const metaRegex = /<meta\s+[^>]*?(?:name|property)\s*=\s*["']([^"']+)["'][^>]*?content\s*=\s*["']([^"']*)["'][^>]*>|<meta\s+[^>]*?content\s*=\s*["']([^"']*)["'][^>]*?(?:name|property)\s*=\s*["']([^"']+)["'][^>]*>/gi;

  const metaMap = new Map();
  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    const key = (match[1] || match[4] || '').toLowerCase().trim();
    const val = decodeHtmlEntities(match[2] || match[3] || '').trim();
    if (key && val && !metaMap.has(key)) {
      metaMap.set(key, val);
    }
  }

  // 1. Avatar / Image extraction
  const avatarKey = [
    'og:image',
    'og:image:secure_url',
    'twitter:image',
    'twitter:image:src'
  ].find((k) => metaMap.has(k));

  if (avatarKey) {
    const rawImg = metaMap.get(avatarKey);
    // Filter out generic default placeholder images if possible
    if (rawImg && !rawImg.includes('default_avatar') && !rawImg.includes('blank-profile')) {
      try {
        metadata.avatarUrl = baseUrl ? new URL(rawImg, baseUrl).href : rawImg;
      } catch {
        metadata.avatarUrl = rawImg;
      }
    }
  }

  // 2. Name / Title extraction
  const nameVal = metaMap.get('profile:username') ||
    metaMap.get('og:title') ||
    metaMap.get('twitter:title');

  if (nameVal) {
    // Often titles are "Lucas (lucas) / Twitter" or "Lucas Silva · GitHub"
    // Clean up common site suffixes
    const cleaned = nameVal
      .replace(/\s*[|·\-–—]\s*(GitHub|Twitter|X|Instagram|Steam|Reddit|Duolingo|Chess\.com|TabNews|Twitch|Medium).*$/i, '')
      .trim();
    metadata.name = cleaned || nameVal;
  }

  // 3. Bio / Description extraction
  const bioVal = metaMap.get('og:description') ||
    metaMap.get('description') ||
    metaMap.get('twitter:description');

  if (bioVal) {
    // Avoid generic boilerplates like "Join GitHub today to see..."
    if (!bioVal.startsWith('Sign up for') && !bioVal.startsWith('Create an account')) {
      metadata.bio = bioVal.replace(/\s+/g, ' ');
    }
  }

  // 4. Try JSON-LD schema if present
  const jsonLdRegex = /<script\s+[^>]*?type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonMatch;
  while ((jsonMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      const item = Array.isArray(data) ? data[0] : (data['@graph'] ? data['@graph'][0] : data);
      if (item) {
        if (item.name && !metadata.name) metadata.name = String(item.name).trim();
        if (item.description && !metadata.bio) metadata.bio = String(item.description).trim();
        if (item.image && !metadata.avatarUrl) {
          metadata.avatarUrl = typeof item.image === 'string' ? item.image : (item.image.url || null);
        }
        if (item.address && !metadata.location) {
          metadata.location = typeof item.address === 'string' ? item.address : (item.address.addressLocality || null);
        }
      }
    } catch {
      // Ignore invalid JSON-LD in third-party markup
    }
  }

  return metadata;
}

