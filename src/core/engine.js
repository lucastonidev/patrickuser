/**
 * @file engine.js - Core Investigation Engine & Async Pool
 * The Mentalist OSINT Username Hunter
 */
import { request } from './http.js';
import { extractMetadata } from './parser.js';
import { validateUsername, sanitizeUsername } from './validator.js';
import { hasAdapter, runAdapter } from '../adapters/index.js';
import sitesData from '../../data/sites.json' with { type: 'json' };

/**
 * Get all available site definitions
 * @returns {import('./types.js').SiteConfig[]}
 */
export function getSites() {
  return sitesData;
}

/**
 * List unique categories available
 * @returns {string[]}
 */
export function getCategories() {
  const set = new Set(sitesData.map((s) => s.category));
  return Array.from(set).sort();
}

/**
 * Check a single site for username existence
 * @param {string} username - Target username
 * @param {import('./types.js').SiteConfig} site - Site configuration
 * @param {Object} [options]
 * @param {number} [options.timeout=10000]
 * @param {boolean} [options.extractMetadata=true]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<import('./types.js').ServiceResult>}
 */
export async function checkSite(username, site, options = {}) {
  const { timeout = 10000, extractMetadata: doExtract = true, signal } = options;
  const cleanUser = sanitizeUsername(username);
  const startTime = Date.now();
  const profileUrl = site.url.replace(/\{\}/g, encodeURIComponent(cleanUser));

  // 1. Check username validity against site regex
  if (site.regexCheck && !validateUsername(cleanUser, site.regexCheck)) {
    return {
      site: site.name,
      category: site.category,
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: 'Username format invalid for this platform (skipped)'
    };
  }

  // 2. Specialized Adapter check
  if (site.hasAdapter || hasAdapter(site.name)) {
    try {
      const adapterResult = await runAdapter(site.name, cleanUser, { timeout, signal });
      if (adapterResult) {
        return adapterResult;
      }
    } catch (err) {
      // Fallback to standard check if adapter threw
    }
  }

  // 3. Standard probe check
  const probeUrl = (site.urlProbe || site.url).replace(/\{\}/g, encodeURIComponent(cleanUser));

  try {
    const res = await request(probeUrl, {
      timeout,
      signal,
      headers: site.headers || {}
    });

    const durationMs = Date.now() - startTime;
    let exists = false;
    let rateLimited = false;

    // Rate limiting detection
    if (res.status === 429 || (res.status === 403 && (res.text.includes('Cloudflare') || res.text.includes('Attention Required')))) {
      rateLimited = true;
    }

    const errorType = site.errorType || 'status_code';

    if (errorType === 'status_code') {
      const notFoundCode = site.errorCode || 404;
      exists = res.status !== notFoundCode && res.status >= 200 && res.status < 300;
    } else if (errorType === 'message') {
      const msgs = Array.isArray(site.errorMsg) ? site.errorMsg : [site.errorMsg];
      const hasErrorMsg = msgs.some((m) => m && res.text.includes(m));
      exists = res.status >= 200 && res.status < 400 && !hasErrorMsg;
    } else if (errorType === 'response_url') {
      // Check if redirected away from expected profile path
      const redirectedAway = res.finalUrl.endsWith('/') ? res.finalUrl === site.urlMain : false;
      exists = res.status >= 200 && res.status < 300 && !redirectedAway;
    }

    /** @type {import('./types.js').ProfileMetadata|undefined} */
    let metadata;
    if (exists && doExtract) {
      metadata = extractMetadata(res.text, profileUrl);
    }

    return {
      site: site.name,
      category: site.category,
      exists,
      url: profileUrl,
      httpStatus: res.status,
      durationMs,
      metadata,
      rateLimited
    };
  } catch (err) {
    return {
      site: site.name,
      category: site.category,
      exists: false,
      url: profileUrl,
      httpStatus: null,
      durationMs: Date.now() - startTime,
      error: err.message
    };
  }
}

/**
 * Execute concurrent username hunt across target platforms
 * @param {string} rawUsername
 * @param {import('./types.js').HuntOptions} [options={}]
 * @returns {Promise<{ username: string, total: number, found: number, results: import('./types.js').ServiceResult[], durationMs: number }>}
 */
export async function huntUsername(rawUsername, options = {}) {
  const username = sanitizeUsername(rawUsername);
  if (!username) {
    throw new Error('A valid username is required to begin the hunt');
  }

  const {
    concurrency = 20,
    timeout = 10000,
    categories,
    sites,
    exclude,
    extractMetadata = true,
    signal,
    onFound,
    onChecked,
    onError
  } = options;

  // Filter sites
  let targetSites = sitesData;

  if (categories && categories.length > 0) {
    const cats = categories.map((c) => c.toLowerCase().trim());
    targetSites = targetSites.filter((s) => cats.includes(s.category.toLowerCase()));
  }

  if (sites && sites.length > 0) {
    const names = sites.map((s) => s.toLowerCase().trim());
    targetSites = targetSites.filter((s) => names.includes(s.name.toLowerCase()));
  }

  if (exclude && exclude.length > 0) {
    const excluded = exclude.map((s) => s.toLowerCase().trim());
    targetSites = targetSites.filter((s) => !excluded.includes(s.name.toLowerCase()));
  }

  const total = targetSites.length;
  /** @type {import('./types.js').ServiceResult[]} */
  const results = [];
  const startHuntTime = Date.now();

  /** @type {import('./types.js').HuntStats} */
  const stats = {
    total,
    checked: 0,
    found: 0,
    notFound: 0,
    errors: 0,
    rateLimited: 0,
    percent: 0
  };

  // Promise pool concurrency control
  let currentIndex = 0;
  const poolWorkers = [];
  const activeConcurrency = Math.min(concurrency, total);

  async function worker() {
    while (currentIndex < total) {
      if (signal?.aborted) {
        break;
      }
      const index = currentIndex++;
      const site = targetSites[index];

      try {
        const result = await checkSite(username, site, {
          timeout,
          extractMetadata,
          signal
        });

        results.push(result);
        stats.checked++;

        if (result.exists) {
          stats.found++;
          if (onFound) {
            try { onFound(result); } catch {}
          }
        } else if (result.error) {
          stats.errors++;
        } else {
          stats.notFound++;
        }

        if (result.rateLimited) {
          stats.rateLimited++;
        }

        stats.percent = Math.round((stats.checked / total) * 100);

        if (onChecked) {
          try { onChecked(result, { ...stats }); } catch {}
        }
      } catch (err) {
        stats.checked++;
        stats.errors++;
        stats.percent = Math.round((stats.checked / total) * 100);

        if (onError) {
          try { onError(err, site.name); } catch {}
        }
      }
    }
  }

  for (let i = 0; i < activeConcurrency; i++) {
    poolWorkers.push(worker());
  }

  await Promise.all(poolWorkers);

  return {
    username,
    total,
    found: stats.found,
    results,
    durationMs: Date.now() - startHuntTime
  };
}
