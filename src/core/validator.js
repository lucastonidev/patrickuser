/**
 * @file validator.js - Username format validation per platform
 */

/**
 * Validate username against a platform's regex pattern
 * @param {string} username - Target username
 * @param {string} [regexPattern] - Regex pattern string from site definition
 * @returns {boolean} True if username matches regex or no regex defined
 */
export function validateUsername(username, regexPattern) {
  if (!username || typeof username !== 'string') {
    return false;
  }

  if (!regexPattern) {
    return true;
  }

  try {
    const re = new RegExp(regexPattern);
    return re.test(username);
  } catch {
    // If invalid regex pattern in config, default to true to avoid false rejections
    return true;
  }
}

/**
 * Sanitize input username (remove spaces, @ prefix if provided)
 * @param {string} raw
 * @returns {string}
 */
export function sanitizeUsername(raw) {
  if (!raw) return '';
  return String(raw).trim().replace(/^@+/, '');
}
