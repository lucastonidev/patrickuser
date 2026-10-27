/**
 * @file table.js - Formatters & Hit Visualizers
 */
import { c } from './colors.js';

/**
 * Format and print a single confirmed profile hit in real-time
 * @param {import('../core/types.js').ServiceResult} result
 */
export function printHit(result) {
  if (process.stdout.isTTY) {
    process.stdout.write('\r\x1b[K');
  }

  const symbol = c.neonGreen('[+]');
  const site = c.bold(c.white(result.site));
  const cat = c.cyan(`(${result.category})`);
  const url = c.underline(c.sky(result.url));
  const duration = c.dim(`(${result.durationMs}ms)`);

  console.log(`${symbol} ${site} ${cat} ${url} ${duration}`);

  if (result.metadata) {
    const meta = result.metadata;
    const details = [];

    if (meta.name && meta.name.toLowerCase() !== result.site.toLowerCase()) {
      details.push(`${c.dim('Name:')} ${c.amber(meta.name)}`);
    }

    if (meta.followers !== undefined && meta.followers !== null) {
      details.push(`${c.dim('Followers:')} ${c.white(String(meta.followers))}`);
    }

    if (meta.extra) {
      if (meta.extra.streak) details.push(`${c.dim('Streak:')} ${c.gold(String(meta.extra.streak) + ' 🔥')}`);
      if (meta.extra.totalKarma) details.push(`${c.dim('Karma:')} ${c.gold(String(meta.extra.totalKarma))}`);
      if (meta.extra.publicRepos !== undefined) details.push(`${c.dim('Repos:')} ${c.white(String(meta.extra.publicRepos))}`);
      if (meta.extra.rapidRating) details.push(`${c.dim('Rapid:')} ${c.gold(String(meta.extra.rapidRating))}`);
      if (meta.extra.tabcoins) details.push(`${c.dim('TabCoins:')} ${c.gold(String(meta.extra.tabcoins))}`);
      if (meta.extra.steamId64) details.push(`${c.dim('SteamID64:')} ${c.cyan(meta.extra.steamId64)}`);
    }

    if (details.length > 0) {
      console.log(`    ${c.darkGray('↳')} ${details.join(c.darkGray(' · '))}`);
    }

    if (meta.bio) {
      const bioSnippet = meta.bio.length > 80 ? `${meta.bio.slice(0, 80)}...` : meta.bio;
      console.log(`    ${c.darkGray('↳')} ${c.dim('Bio:')} ${c.gray(bioSnippet)}`);
    }

    if (meta.avatarUrl) {
      console.log(`    ${c.darkGray('↳')} ${c.dim('Avatar:')} ${c.darkGray(meta.avatarUrl)}`);
    }
  }
}

/**
 * Print final investigation summary
 * @param {string} username
 * @param {import('../core/types.js').ServiceResult[]} results
 * @param {number} durationMs
 */
export function printSummary(username, results, durationMs) {
  if (process.stdout.isTTY) {
    process.stdout.write('\r\x1b[K');
  }
  const found = results.filter((r) => r.exists);
  const rateLimited = results.filter((r) => r.rateLimited);

  console.log(`\n${c.darkGray('────────────────────────────────────────────────────────────────────────────')}`);
  console.log(` ${c.badgeGold('INVESTIGATION SUMMARY')} ${c.dim('Target:')} ${c.bold(c.gold(username))}`);
  console.log(` ${c.dim('Observed Platforms:')} ${c.white(String(results.length))} ${c.dim('·')} ${c.dim('Confirmed Footprints:')} ${c.neonGreen(c.bold(String(found.length)))} ${c.dim('·')} ${c.dim('Duration:')} ${c.white((durationMs / 1000).toFixed(2) + 's')}`);

  if (rateLimited.length > 0) {
    console.log(` ${c.redJohn('⚠')} ${c.dim('Rate-limited platforms:')} ${rateLimited.map((r) => r.site).join(', ')}`);
  }

  // Breakdown by category
  const catCount = {};
  for (const f of found) {
    catCount[f.category] = (catCount[f.category] || 0) + 1;
  }

  const catList = Object.entries(catCount)
    .map(([cat, count]) => `${c.cyan(cat)}: ${c.white(String(count))}`)
    .join(c.darkGray(' · '));

  if (catList) {
    console.log(` ${c.dim('Footprints by Category:')} ${catList}`);
  }
  console.log(`${c.darkGray('────────────────────────────────────────────────────────────────────────────')}\n`);
}
