/**
 * @file banner.js - Patrick Jane / The Mentalist Themed ASCII Banner
 */
import { c } from './colors.js';

const MENTALIST_QUOTES = [
  "There is no such thing as magic. Only perception, psychology, and observation.",
  "People leave traces of their habits everywhere they go.",
  "Tea first. Clues second.",
  "If you observe closely, people reveal their digital footprints in plain sight.",
  "The truth is rarely hidden. It's usually just unobserved.",
  "Sherlock looked for physical clues. Patrick Jane reads what people leave behind."
];

/**
 * Get random Mentalist quote
 * @returns {string}
 */
export function getRandomQuote() {
  const index = Math.floor(Math.random() * MENTALIST_QUOTES.length);
  return MENTALIST_QUOTES[index];
}

/**
 * Render stylish banner
 * @returns {string}
 */
export function getBanner() {
  const quote = getRandomQuote();

  const logo = `
${c.gold('    ____        __       _      __                             ')}
${c.amber('   / __ \\____ _/ /______(_)____/ /____  ______  _____ ____ _____')}
${c.gold('  / /_/ / __ `/ __/ ___/ / ___/ //_/ / / / __ \\/ ___// __ `/ __ \\')}
${c.amber(' / ____/ /_/ / /_/ /  / / /__/ ,< / /_/ / /_/ / /   / /_/ / /_/ /')}
${c.gold('/_/    \\__,_/\\__/_/  /_/\\___/_/|_|\\__,_/\\____/_/    \\__,_/ .___/ ')}
${c.cyan('  ~ The Mentalist OSINT Username Hunter (Sherlock Successor) ~')} ${c.darkGray('/_/')}
`;

  const meta = [
    ` ${c.badgeGold('CBI OSINT')} ${c.dim('Version:')} ${c.white('1.0.0 (Native ESM)')} ${c.dim('·')} ${c.dim('Platform:')} ${c.cyan('Node.js >=18')} ${c.dim('·')} ${c.dim('Zero Deps')}`,
    ` ${c.italic(c.amber('"' + quote + '"'))}`,
    `${c.darkGray('────────────────────────────────────────────────────────────────────────────')}`
  ].join('\n');

  return `${logo}\n${meta}`;
}

