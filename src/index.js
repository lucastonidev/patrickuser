/**
 * @file index.js - Main Library Entry Point for PatrickUser
 * The Mentalist OSINT Username Hunter (Sherlock Successor)
 */

export {
  huntUsername,
  checkSite,
  getSites,
  getCategories
} from './core/engine.js';

export {
  request,
  getRandomUserAgent,
  getDefaultHeaders
} from './core/http.js';

export {
  extractMetadata,
  decodeHtmlEntities
} from './core/parser.js';

export {
  validateUsername,
  sanitizeUsername
} from './core/validator.js';

export {
  hasAdapter,
  runAdapter,
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
} from './adapters/index.js';

export {
  startServer
} from './server/index.js';

export {
  formatJson,
  formatCsv,
  formatMarkdown,
  saveToFile
} from './cli/exporter.js';

