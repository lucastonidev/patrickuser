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

/**
 * Print a single confirmed Instagram target hit with forensic data & matching score
 * @param {Object} hit
 */
export function printInstagramHit(hit) {
  if (process.stdout.isTTY) {
    process.stdout.write('\r\x1b[K');
  }

  const score = hit.match?.score || 0;
  const certainty = hit.match?.certainty || 'LOW';

  let scoreBadge;
  if (certainty === 'HIGH') {
    scoreBadge = c.neonGreen(c.bold(`[HIGH ${score}%]`));
  } else if (certainty === 'MEDIUM') {
    scoreBadge = c.amber(c.bold(`[MED ${score}%]`));
  } else {
    scoreBadge = c.dim(`[LOW ${score}%]`);
  }

  const handle = c.bold(c.white(`@${hit.handle}`));
  const url = c.underline(c.sky(hit.url));

  console.log(`\n ${scoreBadge} ${handle} ${c.darkGray('—')} ${url}`);

  if (hit.profile) {
    const prof = hit.profile;
    const parts = [];
    if (prof.fullName) parts.push(`${c.dim('Nome:')} ${c.bold(c.amber(prof.fullName))}`);
    if (prof.followers) parts.push(`${c.dim('Seguidores:')} ${c.white(String(prof.followers))}`);
    if (prof.following) parts.push(`${c.dim('Seguindo:')} ${c.white(String(prof.following))}`);
    if (prof.postsCount) parts.push(`${c.dim('Posts:')} ${c.white(String(prof.postsCount))}`);
    if (prof.isVerified) parts.push(c.cyan('✔ Verificado'));
    if (prof.isPrivate) parts.push(c.dim('🔒 Privado'));

    if (parts.length > 0) {
      console.log(`    ${c.darkGray('↳')} ${parts.join(c.darkGray(' · '))}`);
    }

    if (prof.biography) {
      const bioClean = prof.biography.replace(/[\r\n]+/g, ' ');
      const bioSnippet = bioClean.length > 90 ? `${bioClean.slice(0, 90)}...` : bioClean;
      console.log(`    ${c.darkGray('↳')} ${c.dim('Bio:')} ${c.gray(bioSnippet)}`);
    }
  }

  // Obfuscated recovery contacts
  if (hit.recovery) {
    const rec = hit.recovery;
    const recParts = [];
    if (rec.maskedEmail) recParts.push(`${c.dim('Email Ofuscado:')} ${c.neonGreen(rec.maskedEmail)}`);
    if (rec.maskedPhone) recParts.push(`${c.dim('Telefone Ofuscado:')} ${c.gold(rec.maskedPhone)}`);
    if (recParts.length > 0) {
      console.log(`    ${c.darkGray('↳')} ${recParts.join(c.darkGray(' · '))}`);
    }
  }

  // Forensics: Meta ID age
  if (hit.forensics?.estimatedAge?.numericId) {
    const age = hit.forensics.estimatedAge;
    console.log(`    ${c.darkGray('↳')} ${c.dim('Meta PK:')} ${c.white(age.numericId)} ${c.darkGray('·')} ${c.dim('Criação Estimada:')} ${c.gold(age.estimatedYears)} ${c.dim(`(${age.era})`)}`);
  }

  // Forensics: Bio Entities (WhatsApp, Pix, Commercial Email)
  const bioEnt = hit.forensics?.bioEntities;
  if (bioEnt) {
    const entParts = [];
    if (bioEnt.whatsapp.length > 0) {
      entParts.push(`${c.dim('WhatsApp:')} ${c.neonGreen(bioEnt.whatsapp.join(', '))}`);
    }
    if (bioEnt.pix.cpfs.length > 0) {
      entParts.push(`${c.dim('Pix CPF:')} ${c.cyan(bioEnt.pix.cpfs.join(', '))}`);
    }
    if (bioEnt.pix.cnpjs.length > 0) {
      entParts.push(`${c.dim('Pix CNPJ:')} ${c.cyan(bioEnt.pix.cnpjs.join(', '))}`);
    }
    if (bioEnt.pix.evp.length > 0) {
      entParts.push(`${c.dim('Pix EVP:')} ${c.cyan(bioEnt.pix.evp.join(', '))}`);
    }
    if (bioEnt.emails.length > 0) {
      entParts.push(`${c.dim('Email na Bio:')} ${c.white(bioEnt.emails.join(', '))}`);
    }
    if (entParts.length > 0) {
      console.log(`    ${c.darkGray('↳')} ${c.bold(c.gold('Forensics Bio:'))} ${entParts.join(c.darkGray(' · '))}`);
    }
  }

  // Reverse Image Search
  if (hit.forensics?.reverseImageSearch?.googleLens) {
    const rev = hit.forensics.reverseImageSearch;
    console.log(`    ${c.darkGray('↳')} ${c.dim('Busca Reversa:')} ${c.underline(c.sky(`[Google Lens]`))} ${c.darkGray('·')} ${c.underline(c.sky(`[Yandex]`))} ${c.darkGray('·')} ${c.underline(c.sky(`[Bing]`))}`);
  }
}

/**
 * Print complete Instagram investigation summary
 * @param {Object} results
 */
export function printInstagramSummary(results) {
  if (process.stdout.isTTY) {
    process.stdout.write('\r\x1b[K');
  }

  const {
    target,
    totalPermutations,
    checkedCount,
    foundCount,
    matches,
    highCertaintyMatches,
    mediumCertaintyMatches,
    durationMs
  } = results;

  console.log(`\n${c.darkGray('────────────────────────────────────────────────────────────────────────────')}`);
  console.log(` ${c.badgeGold('INSTAGRAM FORENSIC SUMMARY (YESITSME ENGINE)')}`);
  console.log(` ${c.dim('Alvo:')} ${c.bold(c.white(target.nome || target.username || 'N/A'))} ${target.profissao ? c.dim(`(${target.profissao})`) : ''}`);
  if (target.email) console.log(` ${c.dim('E-mail Alvo:')} ${c.cyan(target.email)}`);
  if (target.telefone) console.log(` ${c.dim('Telefone Alvo:')} ${c.gold(target.telefone)}`);
  console.log(` ${c.dim('Permutações:')} ${c.white(String(totalPermutations))} ${c.dim('·')} ${c.dim('Consultados:')} ${c.white(String(checkedCount))} ${c.dim('·')} ${c.dim('Perfis Encontrados:')} ${c.neonGreen(String(foundCount))}`);
  console.log(` ${c.dim('Alta Certeza (>=75%):')} ${c.neonGreen(c.bold(String(highCertaintyMatches.length)))} ${c.dim('·')} ${c.dim('Média Certeza (45-74%):')} ${c.amber(String(mediumCertaintyMatches.length))} ${c.dim('·')} ${c.dim('Duração:')} ${c.white((durationMs / 1000).toFixed(2) + 's')}`);
  console.log(`${c.darkGray('────────────────────────────────────────────────────────────────────────────')}\n`);
}

