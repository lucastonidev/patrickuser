/**
 * @file progress.js - Terminal Progress Bar & Real-Time Status Reporter
 */
import { c } from './colors.js';

export class ProgressBar {
  /**
   * @param {number} total
   * @param {Object} [options]
   * @param {number} [options.width=25]
   */
  constructor(total, options = {}) {
    this.total = total;
    this.width = options.width || 25;
    this.isTTY = Boolean(process.stdout.isTTY);
    this.hasRendered = false;
  }

  /**
   * Render or update the progress line
   * @param {import('../core/types.js').HuntStats} stats
   * @param {string} currentSite
   */
  update(stats, currentSite = '') {
    if (!this.isTTY) return;
    this.hasRendered = true;

    const ratio = this.total > 0 ? stats.checked / this.total : 0;
    const filled = Math.round(this.width * Math.min(1, Math.max(0, ratio)));
    const empty = this.width - filled;

    const bar = c.gold('━'.repeat(filled)) + c.darkGray('─'.repeat(empty));
    const pct = `${stats.percent}%`.padStart(4, ' ');
    const count = `${stats.checked}/${this.total}`.padStart(7, ' ');
    const hits = c.neonGreen(`⚡ Hits: ${stats.found}`);
    const site = currentSite ? c.gray(`[${currentSite.slice(0, 15)}]`) : '';

    const line = `\r\x1b[2K ${bar} ${c.white(pct)} ${c.dim(count)} ${hits} ${site}`;

    process.stdout.write(line);
  }

  /**
   * Clear the progress line before printing hit or finishing
   */
  clear() {
    if (this.isTTY && this.hasRendered) {
      process.stdout.write('\r\x1b[2K');
      this.hasRendered = false;
    }
  }
}
