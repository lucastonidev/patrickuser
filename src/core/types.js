/**
 * @file types.js - JSDoc Type Definitions for PatrickUser
 * The Mentalist OSINT Username Hunter
 */

/**
 * @typedef {Object} ProfileMetadata
 * @property {string|null} [name] - Real name or display name
 * @property {string|null} [title] - Page title or card title
 * @property {string|null} [bio] - Biography, description or about text
 * @property {string|null} [avatarUrl] - Avatar or profile image URL
 * @property {string|null} [location] - Location or country
 * @property {number|string|null} [followers] - Public followers count
 * @property {number|string|null} [following] - Public following count
 * @property {Record<string, any>} [extra] - Platform-specific details (streak, repos, karma, etc.)
 */

/**
 * @typedef {'social'|'tech'|'gaming'|'content'|'brasil'|'finance'|'professional'|'community'} SiteCategory
 */

/**
 * @typedef {Object} ServiceResult
 * @property {string} site - Name of the target platform (e.g., "GitHub", "Duolingo")
 * @property {SiteCategory|string} category - Platform category
 * @property {boolean} exists - Whether the target account exists and was confirmed
 * @property {string} url - Direct URL to the public profile
 * @property {number|null} httpStatus - HTTP response status code
 * @property {number} durationMs - Duration of the investigation in milliseconds
 * @property {ProfileMetadata} [metadata] - Extracted OpenGraph, JSON-LD, or API metadata
 * @property {boolean} [rateLimited] - Whether the request was rate-limited / blocked
 * @property {string|null} [error] - Error details if the check failed
 */

/**
 * @typedef {Object} SiteConfig
 * @property {string} name - Platform display name
 * @property {string} url - Template URL with {} placeholder for username
 * @property {string} [urlProbe] - Probe URL if different from profile URL
 * @property {SiteCategory|string} category - Category
 * @property {'status_code'|'message'|'response_url'|'adapter'} errorType - Detection method
 * @property {number} [errorCode] - HTTP status code denoting not found (usually 404)
 * @property {string|string[]} [errorMsg] - Message or substring indicating user doesn't exist
 * @property {string} [regexCheck] - Regex pattern that usernames must match on this platform
 * @property {Record<string, string>} [headers] - Optional headers for probe request
 * @property {boolean} [hasAdapter] - Indicates a specialized adapter exists in src/adapters/
 */

/**
 * @typedef {Object} HuntStats
 * @property {number} total - Total platforms selected for the hunt
 * @property {number} checked - Number of platforms examined so far
 * @property {number} found - Number of profiles confirmed
 * @property {number} notFound - Number of platforms confirmed not found
 * @property {number} errors - Number of errors or timeouts
 * @property {number} rateLimited - Number of rate-limited sites
 * @property {number} percent - Progress percentage (0 - 100)
 */

/**
 * @typedef {Object} HuntOptions
 * @property {number} [concurrency=20] - Max simultaneous requests
 * @property {number} [timeout=10000] - Request timeout in milliseconds
 * @property {string[]} [categories] - Filter by category list
 * @property {string[]} [sites] - Whitelist of specific site names
 * @property {string[]} [exclude] - Blacklist of site names to skip
 * @property {boolean} [extractMetadata=true] - Extract rich OpenGraph/JSON-LD metadata
 * @property {AbortSignal} [signal] - Abort controller signal for cancellation
 * @property {function(ServiceResult): void} [onFound] - Callback triggered immediately when a profile is found
 * @property {function(ServiceResult, HuntStats): void} [onChecked] - Callback on every completed platform check
 * @property {function(Error, string): void} [onError] - Callback on network error
 */

export {};

