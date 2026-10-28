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
import { checkApoiaSe } from './apoiase.js';
import { check500px } from './500px.js';
import { checkFreelancer } from './freelancer.js';
import { checkArchiveOrg } from './archiveorg.js';
import { checkMedium } from './medium.js';
import { checkMixcloud } from './mixcloud.js';
import { checkDailymotion } from './dailymotion.js';
import { checkThreads } from './threads.js';
import { checkMinecraft } from './minecraft.js';
import { checkRoblox } from './roblox.js';
import { checkLichess } from './lichess.js';
import { checkAniList } from './anilist.js';
import { checkSpeedrun } from './speedrun.js';
import { checkTikTok } from './tiktok.js';

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
adapters.set('apoia.se', checkApoiaSe);
adapters.set('apoiase', checkApoiaSe);
adapters.set('500px', check500px);
adapters.set('freelancer', checkFreelancer);
adapters.set('archive.org', checkArchiveOrg);
adapters.set('archiveorg', checkArchiveOrg);
adapters.set('medium', checkMedium);
adapters.set('mixcloud', checkMixcloud);
adapters.set('dailymotion', checkDailymotion);
adapters.set('threads', checkThreads);
adapters.set('minecraft', checkMinecraft);
adapters.set('minecraft (namemc)', checkMinecraft);
adapters.set('namemc', checkMinecraft);
adapters.set('roblox', checkRoblox);
adapters.set('lichess', checkLichess);
adapters.set('anilist', checkAniList);
adapters.set('speedrun.com', checkSpeedrun);
adapters.set('speedrun', checkSpeedrun);
adapters.set('tiktok', checkTikTok);

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
  checkGravatar,
  checkApoiaSe,
  check500px,
  checkFreelancer,
  checkArchiveOrg,
  checkMedium,
  checkMixcloud,
  checkDailymotion,
  checkThreads,
  checkMinecraft,
  checkRoblox,
  checkLichess,
  checkAniList,
  checkSpeedrun,
  checkTikTok
};
