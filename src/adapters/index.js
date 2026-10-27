/**
 * @file adapters/index.js - Adapter Registry
 */
import { checkGitHub } from './github.js';
import { checkReddit } from './reddit.js';
import { checkDuolingo } from './duolingo.js';
import { checkChess } from './chess.js';
import { checkSteam } from './steam.js';
import { checkBluesky } from './bluesky.js';
import { checkTabNews } from './tabnews.js';
import { checkGravatar } from './gravatar.js';

/**
 * @type {Map<string, function(string, Object): Promise<import('../core/types.js').ServiceResult>>}
 */
const adapters = new Map();

adapters.set('github', checkGitHub);
adapters.set('reddit', checkReddit);
adapters.set('duolingo', checkDuolingo);
adapters.set('chess.com', checkChess);
adapters.set('chess', checkChess);
adapters.set('steam', checkSteam);
adapters.set('bluesky', checkBluesky);
adapters.set('tabnews', checkTabNews);
adapters.set('gravatar', checkGravatar);

/**
 * Check if a specialized adapter exists for the given site
 * @param {string} siteName
 * @returns {boolean}
 */
export function hasAdapter(siteName) {
  return adapters.has(siteName.toLowerCase().trim());
}

/**
 * Run specialized adapter for a site
 * @param {string} siteName
 * @param {string} username
 * @param {Object} [options]
 * @returns {Promise<import('../core/types.js').ServiceResult>|null}
 */
export async function runAdapter(siteName, username, options = {}) {
  const fn = adapters.get(siteName.toLowerCase().trim());
  if (!fn) return null;
  return fn(username, options);
}

export {
  checkGitHub,
  checkReddit,
  checkDuolingo,
  checkChess,
  checkSteam,
  checkBluesky,
  checkTabNews,
  checkGravatar
};
