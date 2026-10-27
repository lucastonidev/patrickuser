/**
 * @file colors.js - Terminal ANSI Colors with NO_COLOR & TTY Support
 */

const isColorSupported =
  !process.env.NO_COLOR &&
  (process.env.FORCE_COLOR || (process.stdout.isTTY && process.env.TERM !== 'dumb'));

/**
 * Format string with ANSI code if colors are enabled
 * @param {string} open
 * @param {string} close
 * @returns {function(string): string}
 */
const color = (open, close) => (str) =>
  isColorSupported ? `\x1b[${open}m${str}\x1b[${close}m` : String(str);

export const c = {
  reset: color('0', '0'),
  bold: color('1', '22'),
  dim: color('2', '22'),
  italic: color('3', '23'),
  underline: color('4', '24'),

  // Mentalist Palette
  gold: color('38;5;220', '39'),
  amber: color('38;5;214', '39'),
  redJohn: color('38;5;196', '39'),
  neonGreen: color('38;5;82', '39'),
  cyan: color('38;5;51', '39'),
  sky: color('38;5;39', '39'),
  magenta: color('38;5;201', '39'),
  white: color('97', '39'),
  gray: color('38;5;244', '39'),
  darkGray: color('38;5;238', '39'),

  // Badge styles
  badgeFound: (text) => (isColorSupported ? `\x1b[48;5;22m\x1b[97m ${text} \x1b[0m` : `[${text}]`),
  badgeRed: (text) => (isColorSupported ? `\x1b[48;5;124m\x1b[97m ${text} \x1b[0m` : `[${text}]`),
  badgeGold: (text) => (isColorSupported ? `\x1b[48;5;178m\x1b[30m\x1b[1m ${text} \x1b[0m` : `[${text}]`),
  badgeCyan: (text) => (isColorSupported ? `\x1b[48;5;24m\x1b[97m ${text} \x1b[0m` : `[${text}]`)
};
