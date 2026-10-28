/**
 * @file banner.js - Patrick Jane & Red John Themed ASCII Banner
 */
import { c } from './colors.js';

const MENTALIST_QUOTES = [
  "Tyger Tyger, burning bright, In the forests of the night... — Red John",
  "There is no such thing as magic. Only perception, psychology, and observation. — Patrick Jane",
  "People leave traces of their habits everywhere they go. — Patrick Jane",
  "Tea first. Clues second. — Patrick Jane",
  "If you observe closely, people reveal their digital footprints in plain sight.",
  "The truth is rarely hidden. It's usually just unobserved. — Patrick Jane",
  "Sherlock looked for physical clues. Patrick Jane reads what people leave behind."
];

/**
 * Get random Mentalist / Red John quote
 * @returns {string}
 */
export function getRandomQuote() {
  const index = Math.floor(Math.random() * MENTALIST_QUOTES.length);
  return MENTALIST_QUOTES[index];
}

/**
 * Render stylish banner with Red John's iconic blood smiley mark
 * @returns {string}
 */
export function getBanner() {
  const quote = getRandomQuote();

  const redJohnFace = `
                  ${c.redJohn('. ── ~ ~ ~ ── .')}
              ${c.redJohn('. \'   \\       /   \' .')}
            ${c.redJohn('/       ●     ●       \\')}
           ${c.redJohn(':                         :')}
           ${c.redJohn(':      \\             /    :')}
            ${c.redJohn('\\       \' ─ . . ─ \'     /')}
              ${c.redJohn('\' .                 . \'')}
                  ${c.redJohn('\' ── ~ ~ ~ ── \'')}`;

  const logo = `
${c.gold('    ____        __       _      __                             ')}
${c.amber('   / __ \\____ _/ /______(_)____/ /____  ______  _____ ____ _____')}
${c.gold('  / /_/ / __ `/ __/ ___/ / ___/ //_/ / / / __ \\/ ___// __ `/ __ \\')}
${c.amber(' / ____/ /_/ / /_/ /  / / /__/ ,< / /_/ / /_/ / /   / /_/ / /_/ /')}
${c.gold('/_/    \\__,_/\\__/_/  /_/\\___/_/|_|\\__,_/\\____/_/    \\__,_/ .___/ ')}
${c.cyan('  ~ The Mentalist OSINT Username Hunter (Sherlock Successor) ~')} ${c.darkGray('/_/')}
`;

  const meta = [
    ` ${c.badgeRed('RED JOHN MARK')} ${c.dim('Version:')} ${c.white('1.0.0 (Native ESM)')} ${c.dim('·')} ${c.dim('CBI Database:')} ${c.gold('80+ Platforms')} ${c.dim('·')} ${c.cyan('Zero Deps')}`,
    ` ${c.italic(c.amber('"' + quote + '"'))}`,
    `${c.darkGray('────────────────────────────────────────────────────────────────────────────')}`
  ].join('\n');

  return `${redJohnFace}\n${logo}\n${meta}`;
}
