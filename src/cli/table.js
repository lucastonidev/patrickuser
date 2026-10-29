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

    if (prof.avatarUrl) {
      console.log(`    ${c.darkGray('↳')} ${c.dim('Foto Perfil:')} ${c.darkGray(prof.avatarUrl)}`);
    }
  }

  // Contacts: Obfuscated Recovery Masks & Public Contacts ("somente o resto apresentado")
  const rec = hit.recovery;
  const bioEnt = hit.forensics?.bioEntities;
  const contactLines = [];

  // 1. Partial/Obfuscated recovery masks (from Instagram recovery / mobile API)
  if (rec && (rec.maskedEmail || rec.maskedPhone)) {
    const recParts = [];
    if (rec.maskedEmail) recParts.push(`${c.dim('Email (Parcial/Ofuscado):')} ${c.neonGreen(c.bold(rec.maskedEmail))}`);
    if (rec.maskedPhone) recParts.push(`${c.dim('Telefone (Parcial/Ofuscado):')} ${c.gold(c.bold(rec.maskedPhone))}`);
    if (recParts.length > 0) {
      contactLines.push(`    ${c.darkGray('↳')} ${c.badgeGold('RECUPERAÇÃO')} ${recParts.join(c.darkGray(' · '))}`);
    }
  }

  // 2. Public contacts parsed from Bio & External Link
  if (bioEnt && (bioEnt.emails?.length > 0 || bioEnt.whatsapp?.length > 0)) {
    const pubParts = [];
    if (bioEnt.whatsapp.length > 0) pubParts.push(`${c.dim('WhatsApp/Tel:')} ${c.neonGreen(c.bold(bioEnt.whatsapp.join(', ')))}`);
    if (bioEnt.emails.length > 0) pubParts.push(`${c.dim('Email:')} ${c.white(c.bold(bioEnt.emails.join(', ')))}`);
    if (pubParts.length > 0) {
      contactLines.push(`    ${c.darkGray('↳')} ${c.dim('📞 Contatos Públicos:')} ${pubParts.join(c.darkGray(' · '))}`);
    }
  }

  if (contactLines.length > 0) {
    contactLines.forEach(l => console.log(l));
  } else {
    console.log(`    ${c.darkGray('↳')} ${c.dim('Contatos (Email/Telefone):')} ${c.darkGray('Ocultos na bio (use --session para puxar máscaras de recuperação)')}`);
  }

  // 3. Email Filter & Correlation Details
  if (hit.match?.checks?.length > 0) {
    const emailChecks = hit.match.checks.filter(chk => chk.factor.startsWith('Email:'));
    if (emailChecks.length > 0) {
      const anyPassed = emailChecks.some(chk => chk.passed);
      const statusLabel = anyPassed ? c.neonGreen(c.bold('COINCIDENTE')) : c.dim('NÃO COINCIDENTE');
      const details = emailChecks
        .map(chk => chk.passed ? c.neonGreen(`[✓ ${chk.factor.replace('Email: ', '')}]`) : c.dim(`[✗ ${chk.factor.replace('Email: ', '')}]`))
        .join(' ');
      console.log(`    ${c.darkGray('↳')} ${c.dim('Filtro Email:')} ${statusLabel} ${details}`);
    }
  }

  // Forensics: Meta ID age
  if (hit.forensics?.estimatedAge?.numericId) {
    const age = hit.forensics.estimatedAge;
    console.log(`    ${c.darkGray('↳')} ${c.dim('Meta PK:')} ${c.white(age.numericId)} ${c.darkGray('·')} ${c.dim('Criação Estimada:')} ${c.gold(age.estimatedYears)} ${c.dim(`(${age.era})`)}`);
  }

  // Forensics: Bio Pix
  if (bioEnt) {
    const pixParts = [];
    if (bioEnt.pix.cpfs.length > 0) pixParts.push(`${c.dim('Pix CPF:')} ${c.cyan(bioEnt.pix.cpfs.join(', '))}`);
    if (bioEnt.pix.cnpjs.length > 0) pixParts.push(`${c.dim('Pix CNPJ:')} ${c.cyan(bioEnt.pix.cnpjs.join(', '))}`);
    if (bioEnt.pix.evp.length > 0) pixParts.push(`${c.dim('Pix EVP:')} ${c.cyan(bioEnt.pix.evp.join(', '))}`);
    if (pixParts.length > 0) {
      console.log(`    ${c.darkGray('↳')} ${c.bold(c.gold('Pix Bio:'))} ${pixParts.join(c.darkGray(' · '))}`);
    }
  }

  // Reverse Image Search
  if (hit.forensics?.reverseImageSearch?.googleLens) {
    const rev = hit.forensics.reverseImageSearch;
    console.log(`    ${c.darkGray('↳')} ${c.dim('Busca Reversa Foto:')} ${c.underline(c.sky(`[Google Lens]`))} ${c.darkGray('·')} ${c.underline(c.sky(`[Yandex]`))} ${c.darkGray('·')} ${c.underline(c.sky(`[Bing]`))}`);
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
    emailFilteredMatches = [],
    emailFilterActive = false,
    durationMs
  } = results;

  console.log(`\n${c.darkGray('────────────────────────────────────────────────────────────────────────────')}`);
  console.log(` ${c.badgeGold('INSTAGRAM FORENSIC SUMMARY (YESITSME ENGINE)')}`);
  const targetLabel = target.username ? `@${target.username}` : (target.nome || 'N/A');
  console.log(` ${c.dim('Alvo:')} ${c.bold(c.white(targetLabel))} ${target.profissao ? c.dim(`(${target.profissao})`) : ''}`);
  if (target.email) console.log(` ${c.dim('E-mail Alvo (Filtro):')} ${c.cyan(target.email)}`);
  if (target.telefone) console.log(` ${c.dim('Telefone Alvo:')} ${c.gold(target.telefone)}`);
  console.log(` ${c.dim('Consultados:')} ${c.white(String(checkedCount))} ${c.dim('·')} ${c.dim('Perfis Encontrados:')} ${c.neonGreen(String(foundCount))}`);
  if (emailFilterActive) {
    console.log(` ${c.dim('Filtro de Email:')} ${c.cyan(target.email)} ${c.darkGray('·')} ${c.dim('Coincidências:')} ${emailFilteredMatches.length > 0 ? c.neonGreen(c.bold(String(emailFilteredMatches.length))) : c.dim('0')} ${c.dim(`de ${foundCount} perfis`)}`);
  }
  console.log(` ${c.dim('Alta Certeza (>=75%):')} ${c.neonGreen(c.bold(String(highCertaintyMatches.length)))} ${c.dim('·')} ${c.dim('Média Certeza (45-74%):')} ${c.amber(String(mediumCertaintyMatches.length))} ${c.dim('·')} ${c.dim('Duração:')} ${c.white((durationMs / 1000).toFixed(2) + 's')}`);

  const hasRecoveryMask = matches.some((m) => m.recovery?.maskedEmail || m.recovery?.maskedPhone);
  if (!hasRecoveryMask && (target.email || target.telefone)) {
    console.log(`\n ${c.cyan('ℹ')} ${c.dim('Nota sobre E-mail/Telefone Ofuscados:')}`);
    console.log(`   ${c.dim('O Instagram protege as máscaras de recuperação contra requisições anônimas.')}`);
    console.log(`   ${c.dim('Para extrair máscaras ofuscadas completas (como no YesItsMe original), use:')}`);
    console.log(`   ${c.gold('patrickuser insta @usuario --session <seu_sessionid>')} ${c.dim('ou configure')} ${c.cyan('export IG_SESSION_ID=<cookie>')}`);
  }
  console.log(`${c.darkGray('────────────────────────────────────────────────────────────────────────────')}\n`);
}

