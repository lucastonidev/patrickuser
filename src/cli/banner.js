/**
 * @file banner.js - Patrick Jane & Red John Themed ASCII Banner
 * Dynamically scales and centers to terminal width with blood-red ANSI styling.
 */
import { readFileSync } from 'node:fs';
import { c } from './colors.js';

export let appVersion = '1.1.0';
try {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'));
  if (pkg.version) appVersion = pkg.version;
} catch {
  // fallback
}

const MENTALIST_QUOTES = [
  "Tyger Tyger, burning bright, In the forests of the night... — Red John",
  "There is no such thing as magic. Only perception, psychology, and observation. — Patrick Jane",
  "People leave traces of their habits everywhere they go. — Patrick Jane",
  "Tea first. Clues second. — Patrick Jane",
  "If you observe closely, people reveal their digital footprints in plain sight.",
  "The truth is rarely hidden. It's usually just unobserved. — Patrick Jane",
  "Sherlock looked for physical clues. Patrick Jane reads what people leave behind."
];

// Full HD Red John blood mark (57 columns wide)
const RED_JOHN_RAW_LINES = [
  "            ███████    ██",
  "           ████████████████    ██",
  "                  ████████████████  ██",
  "                              ████████  █",
  "                                    ████████",
  "                    ███                  ██████",
  "                ████████                     ████",
  "            ███████                            ████",
  "         ██████                                  ████",
  "       █████                                       ███",
  "     █████                                          ███",
  "    ████                                              ██",
  "   ███                             ██████             ███",
  "  ████            ███           ███████████            ██",
  " ████         █████████                ███ █            █",
  "████         ███                         █              █",
  "████         █                           █              █",
  "████         █                           █              █",
  "████         █                           █             ██",
  " ████        █                           █            ██",
  " █████       █                       █████           ███",
  "   ████      █    ████           ██████             ██",
  "    ████     █     ████████████████               ███",
  "      ████         █     █    ███               ███",
  "        ██████     █     █                  ████",
  "          ██████         █              █████",
  "             ████████    █       ████████",
  "                 ██████████████████",
  "                  █",
  "                  █",
  "                                       █",
  "                                       █"
];

// Compact fallback for narrow terminals (< 62 columns)
const RED_JOHN_COMPACT_LINES = [
  "        . ── ~ ~ ~ ── .",
  "    . '   \\       /   ' .",
  "  /       ●     ●       \\",
  " :                         :",
  " :      \\             /    :",
  "  \\       ' ─ . . ─ '     /",
  "    ' .                 . '",
  "        ' ── ~ ~ ~ ── '"
];

const LOGO_LINES = [
  "    ____        __       _      __                             ",
  "   / __ \\____ _/ /______(_)____/ /____  ______  _____ ____ _____",
  "  / /_/ / __ `/ __/ ___/ / ___/ //_/ / / / __ \\/ ___// __ `/ __ \\",
  " / ____/ /_/ / /_/ /  / / /__/ ,< / /_/ / /_/ / /   / /_/ / /_/ /",
  "/_/    \\__,_/\\__/_/  /_/\\___/_/|_|\\__,_/\\____/_/    \\__,_/ .___/ ",
  "  ~ The Mentalist OSINT Username Hunter (Sherlock Successor) ~ /_/ "
];

/**
 * Get random quote
 * @returns {string}
 */
export function getRandomQuote() {
  const index = Math.floor(Math.random() * MENTALIST_QUOTES.length);
  return MENTALIST_QUOTES[index];
}

/**
 * Render the Red John face centered and colored in blood red
 * @param {number} termWidth
 * @returns {string}
 */
function renderRedJohnFace(termWidth) {
  const isCompact = termWidth < 62;
  const rawLines = isCompact ? RED_JOHN_COMPACT_LINES : RED_JOHN_RAW_LINES;
  const maxLineLen = Math.max(...rawLines.map((l) => l.length));
  const pad = Math.max(0, Math.floor((termWidth - maxLineLen) / 2));
  const indent = ' '.repeat(pad);

  return rawLines
    .map((line, idx) => {
      let coloredLine;
      if (isCompact) {
        coloredLine = c.redJohn(line);
      } else {
        // Deep blood red gradient: vivid crimson on the face, dark dried blood on drips
        let color = '\x1b[38;5;196m';
        if (idx < 3) color = '\x1b[38;5;160m';
        else if (idx >= 3 && idx <= 23) color = '\x1b[38;5;196m\x1b[1m';
        else if (idx > 23 && idx <= 27) color = '\x1b[38;5;160m';
        else color = '\x1b[38;5;124m'; // blood drips

        coloredLine = color + line + '\x1b[0m';
      }
      return indent + coloredLine;
    })
    .join('\n');
}

/**
 * Render the PATRICKUSER logo centered
 * @param {number} termWidth
 * @returns {string}
 */
function renderLogo(termWidth) {
  const maxLogoLen = 67;
  const pad = Math.max(0, Math.floor((termWidth - maxLogoLen) / 2));
  const indent = ' '.repeat(pad);

  return LOGO_LINES
    .map((line, i) => {
      const col = i < 2 ? c.gold : (i < 4 ? c.amber : (i === 4 ? c.gold : c.cyan));
      return indent + col(line);
    })
    .join('\n');
}

/**
 * Render a divider line adapted to terminal width
 * @param {number} termWidth
 * @returns {string}
 */
function renderDivider(termWidth) {
  const dividerLen = Math.min(Math.max(termWidth, 50), 90);
  const pad = Math.max(0, Math.floor((termWidth - dividerLen) / 2));
  return ' '.repeat(pad) + c.darkGray('─'.repeat(dividerLen));
}

/**
 * Render complete responsive banner
 * @returns {string}
 */
export function getBanner() {
  const termWidth = process.stdout.columns || 80;
  const quote = getRandomQuote();

  const face = renderRedJohnFace(termWidth);
  const logo = renderLogo(termWidth);
  const divider = renderDivider(termWidth);

  const padMeta = Math.max(0, Math.floor((termWidth - 75) / 2));
  const indentMeta = ' '.repeat(padMeta);

  const metaLine = `${indentMeta} ${c.badgeRed('RED JOHN MARK')} ${c.dim('Version:')} ${c.white(appVersion)} ${c.dim('·')} ${c.dim('CBI Database:')} ${c.gold('80+ Platforms')} ${c.dim('·')} ${c.cyan('Zero Deps')}`;

  const quoteLen = quote.length + 4;
  const padQuote = Math.max(0, Math.floor((termWidth - quoteLen) / 2));
  const quoteLine = ' '.repeat(padQuote) + c.italic(c.amber('"' + quote + '"'));

  return `\n${face}\n\n${logo}\n\n${metaLine}\n${quoteLine}\n${divider}\n`;
}
