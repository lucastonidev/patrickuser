/**
 * @file modules/instagram/matcher.js
 * Probabilistic Correlation Calculator & Contact Point Obfuscation Matcher
 * Modernized 100% Native Node.js ESM inspired by YesItsMe
 */

/**
 * Normalize and extract domain parts from an email string
 * @param {string} email
 * @returns {{ user: string, domain: string, tld: string }}
 */
function parseEmailParts(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { user: '', domain: '', tld: '' };
  }
  const [user, domain = ''] = email.toLowerCase().trim().split('@');
  const dotIndex = domain.lastIndexOf('.');
  const tld = dotIndex !== -1 ? domain.slice(dotIndex) : '';
  return { user, domain, tld };
}

/**
 * Check if a masked domain (e.g. "g****.com") matches target domain (e.g. "gmail.com")
 * @param {string} targetDomain
 * @param {string} maskDomain
 * @returns {boolean}
 */
export function matchDomainMask(targetDomain, maskDomain) {
  if (!targetDomain || !maskDomain) return false;
  const target = targetDomain.toLowerCase().trim();
  const mask = maskDomain.toLowerCase().trim();

  if (target === mask) return true;

  // If mask has asterisks
  if (mask.includes('*')) {
    const targetParts = target.split('.');
    const maskParts = mask.split('.');

    if (targetParts.length !== maskParts.length) return false;

    // Compare main domain portion (e.g. "gmail" vs "g****")
    const tHost = targetParts[0];
    const mHost = maskParts[0];

    if (tHost[0] !== mHost[0]) return false;
    if (tHost.length !== mHost.length) return false;

    // Compare TLD
    const tTld = targetParts.slice(1).join('.');
    const mTld = maskParts.slice(1).join('.');

    // TLD might also be partially masked or clear
    if (mTld.includes('*')) {
      if (tTld.length !== mTld.length || tTld[0] !== mTld[0]) return false;
    } else if (tTld !== mTld) {
      return false;
    }

    return true;
  }

  return target === mask;
}

/**
 * Clean phone string to digits only
 * @param {string} phone
 * @returns {string}
 */
function cleanDigits(phone) {
  return String(phone || '').replace(/\D/g, '');
}

/**
 * Extract trailing visible digits from a masked phone string
 * e.g. "+55 ** *****-4321" -> "4321"
 * @param {string} mask
 * @returns {string}
 */
export function extractMaskTrailingDigits(mask) {
  if (!mask || typeof mask !== 'string') return '';
  const match = mask.match(/(\d+)\s*$/);
  return match ? match[1] : '';
}

/**
 * Normalize and tokenize a full name string
 * @param {string} name
 * @returns {string[]}
 */
function tokenizeName(name) {
  if (!name || typeof name !== 'string') return [];
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Calculate probabilistic match score (0 - 100%) between target inputs and discovered Instagram data
 * 
 * Rules:
 * 1. Email (Max: 40 pts):
 *    - +10 pts: First letter matches
 *    - +10 pts: Last letter before '@' matches
 *    - +10 pts: Exact length before '@' matches
 *    - +10 pts: Domain matches (e.g. @g****.com with @gmail.com)
 * 
 * 2. Phone (Max: 30 pts):
 *    - +8 pts: DDI (+55 Brasil) matches
 *    - +22 pts: Last 4 digits match exactly
 *    - OR +18 pts: Last 2 digits match (if mask only shows 2)
 * 
 * 3. Full Name (Max: 20 pts):
 *    - +20 pts: 100% identical
 *    - +16 pts: First and last name match
 *    - +10 pts: First name matches
 * 
 * 4. Handle / Username (Max: 10 pts):
 *    - +10 pts: Contains exact root of target name or email prefix
 * 
 * Classification:
 * - >= 75%: HIGH (Match Confirmado / Alta Certeza)
 * - 45% - 74%: MEDIUM (Provável Vínculo / Média Certeza)
 * - < 45%: LOW (Sugestão Homônima / Baixa Certeza)
 * 
 * @param {Object} target
 * @param {string} [target.email]
 * @param {string} [target.telefone]
 * @param {string} [target.phone]
 * @param {string} [target.nome]
 * @param {string} [target.name]
 * @param {Object} discovered
 * @param {string} [discovered.maskedEmail]
 * @param {string} [discovered.maskedPhone]
 * @param {string} [discovered.fullName]
 * @param {string} [discovered.handle]
 * @returns {{
 *   score: number,
 *   certainty: 'HIGH' | 'MEDIUM' | 'LOW',
 *   breakdown: {
 *     email: { score: number, max: 40, passedChecks: string[] },
 *     phone: { score: number, max: 30, passedChecks: string[] },
 *     name: { score: number, max: 20, passedChecks: string[] },
 *     handle: { score: number, max: 10, passedChecks: string[] }
 *   },
 *   checks: Array<{ factor: string, passed: boolean, points: number, detail: string }>
 * }}
 */
export function calculateMatchScore(target = {}, discovered = {}) {
  const targetEmail = target.email || '';
  const targetPhone = target.telefone || target.phone || '';
  const targetName = target.nome || target.name || '';

  const {
    maskedEmail = '',
    maskedPhone = '',
    fullName: discoveredFullName = '',
    handle = ''
  } = discovered;

  const checks = [];

  // ==========================================================================
  // 1. EMAIL MATCH (Max: 40 pts)
  // ==========================================================================
  let emailScore = 0;
  const emailPassed = [];

  if (targetEmail && maskedEmail && targetEmail.includes('@') && maskedEmail.includes('@')) {
    const tParts = parseEmailParts(targetEmail);
    const mParts = parseEmailParts(maskedEmail);

    // +10 pts: Primeira letra coincidente
    const firstLetterMatch = tParts.user.length > 0 && mParts.user.length > 0 && tParts.user[0] === mParts.user[0];
    if (firstLetterMatch) {
      emailScore += 10;
      emailPassed.push('FIRST_LETTER');
    }
    checks.push({
      factor: 'Email: Primeira Letra',
      passed: firstLetterMatch,
      points: firstLetterMatch ? 10 : 0,
      detail: `Alvo: '${tParts.user[0]}' | Máscara: '${mParts.user[0]}'`
    });

    // +10 pts: Última letra antes do @ coincidente
    const lastLetterMatch = tParts.user.length > 0 && mParts.user.length > 0 && tParts.user.slice(-1) === mParts.user.slice(-1);
    if (lastLetterMatch) {
      emailScore += 10;
      emailPassed.push('LAST_LETTER');
    }
    checks.push({
      factor: 'Email: Última Letra Antes do @',
      passed: lastLetterMatch,
      points: lastLetterMatch ? 10 : 0,
      detail: `Alvo: '${tParts.user.slice(-1)}' | Máscara: '${mParts.user.slice(-1)}'`
    });

    // +10 pts: Tamanho exato do usuário antes do @ bate com a contagem de caracteres da máscara
    const exactLengthMatch = tParts.user.length === mParts.user.length;
    if (exactLengthMatch) {
      emailScore += 10;
      emailPassed.push('USER_LENGTH');
    }
    checks.push({
      factor: 'Email: Contagem de Caracteres',
      passed: exactLengthMatch,
      points: exactLengthMatch ? 10 : 0,
      detail: `Alvo: ${tParts.user.length} chars | Máscara: ${mParts.user.length} chars`
    });

    // +10 pts: Domínio coincidente (ex: @g****.com casa com @gmail.com)
    const domainMatch = matchDomainMask(tParts.domain, mParts.domain);
    if (domainMatch) {
      emailScore += 10;
      emailPassed.push('DOMAIN_MATCH');
    }
    checks.push({
      factor: 'Email: Domínio Coincidente',
      passed: domainMatch,
      points: domainMatch ? 10 : 0,
      detail: `Alvo: '@${tParts.domain}' | Máscara: '@${mParts.domain}'`
    });
  }

  // ==========================================================================
  // 2. TELEFONE MATCH (Max: 30 pts)
  // ==========================================================================
  let phoneScore = 0;
  const phonePassed = [];

  if (targetPhone && maskedPhone) {
    const cleanTarget = cleanDigits(targetPhone);
    const maskHas55 = maskedPhone.includes('+55') || maskedPhone.startsWith('55');
    const targetHas55 = targetPhone.includes('+55') || cleanTarget.startsWith('55');

    // +8 pts: DDI (+55 Brasil) coincidente
    const ddiMatch = maskHas55 && targetHas55;
    if (ddiMatch) {
      phoneScore += 8;
      phonePassed.push('DDI_55');
    }
    checks.push({
      factor: 'Telefone: DDI (+55 Brasil)',
      passed: ddiMatch,
      points: ddiMatch ? 8 : 0,
      detail: `Alvo DDI 55: ${targetHas55} | Máscara DDI 55: ${maskHas55}`
    });

    // Últimos dígitos
    const maskTrailing = extractMaskTrailingDigits(maskedPhone);
    if (maskTrailing.length >= 4) {
      // +22 pts: Últimos 4 dígitos idênticos
      const match4 = cleanTarget.endsWith(maskTrailing);
      if (match4) {
        phoneScore += 22;
        phonePassed.push('LAST_4_DIGITS');
      }
      checks.push({
        factor: 'Telefone: Últimos 4 Dígitos',
        passed: match4,
        points: match4 ? 22 : 0,
        detail: `Alvo termina com '${cleanTarget.slice(-4)}' | Máscara termina com '${maskTrailing}'`
      });
    } else if (maskTrailing.length >= 2) {
      // +18 pts se apenas os últimos 2 forem confirmados
      const match2 = cleanTarget.endsWith(maskTrailing);
      if (match2) {
        phoneScore += 18;
        phonePassed.push('LAST_2_DIGITS');
      }
      checks.push({
        factor: 'Telefone: Últimos 2 Dígitos',
        passed: match2,
        points: match2 ? 18 : 0,
        detail: `Alvo termina com '${cleanTarget.slice(-2)}' | Máscara termina com '${maskTrailing}'`
      });
    }
  }

  // ==========================================================================
  // 3. NOME COMPLETO MATCH (Max: 20 pts)
  // ==========================================================================
  let nameScore = 0;
  const namePassed = [];

  if (targetName && discoveredFullName) {
    const tTokens = tokenizeName(targetName);
    const dTokens = tokenizeName(discoveredFullName);

    if (tTokens.length > 0 && dTokens.length > 0) {
      const isIdentical = tTokens.length === dTokens.length && tTokens.every((t, i) => t === dTokens[i]);

      if (isIdentical) {
        // +20 pts: Nome e sobrenome 100% idênticos
        nameScore = 20;
        namePassed.push('FULL_NAME_IDENTICAL');
        checks.push({
          factor: 'Nome: 100% Idêntico',
          passed: true,
          points: 20,
          detail: `Alvo: '${targetName}' === Perfil: '${discoveredFullName}'`
        });
      } else {
        const firstMatch = tTokens[0] === dTokens[0];
        const lastMatch = tTokens.at(-1) === dTokens.at(-1);

        if (firstMatch && lastMatch) {
          // +16 pts: Primeiro e último nome coincidem
          nameScore = 16;
          namePassed.push('FIRST_AND_LAST_NAME');
          checks.push({
            factor: 'Nome: Primeiro e Último Nome Coincidentes',
            passed: true,
            points: 16,
            detail: `Primeiro: '${tTokens[0]}' & Último: '${tTokens.at(-1)}'`
          });
        } else if (firstMatch) {
          // +10 pts: Primeiro nome coincide
          nameScore = 10;
          namePassed.push('FIRST_NAME');
          checks.push({
            factor: 'Nome: Primeiro Nome Coincidente',
            passed: true,
            points: 10,
            detail: `Primeiro: '${tTokens[0]}'`
          });
        } else {
          checks.push({
            factor: 'Nome: Sem Coincidência Forte',
            passed: false,
            points: 0,
            detail: `Alvo: '${targetName}' vs Perfil: '${discoveredFullName}'`
          });
        }
      }
    }
  }

  // ==========================================================================
  // 4. HANDLE / USERNAME MATCH (Max: 10 pts)
  // ==========================================================================
  let handleScore = 0;
  const handlePassed = [];

  if (handle) {
    const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9]/g, '');
    let matchedRoot = false;

    // Check against target name root (e.g. "carlossilva" or "carlos" + "silva")
    if (targetName) {
      const tTokens = tokenizeName(targetName);
      if (tTokens.length >= 2) {
        const first = tTokens[0];
        const last = tTokens.at(-1);
        const nameRoot = `${first}${last}`;
        if (cleanHandle.includes(nameRoot) || (cleanHandle.includes(first) && cleanHandle.includes(last))) {
          matchedRoot = true;
        }
      } else if (tTokens.length === 1 && cleanHandle.includes(tTokens[0])) {
        matchedRoot = true;
      }
    }

    // Check against target email prefix root (e.g. "carlos.silva" -> "carlossilva")
    if (!matchedRoot && targetEmail && targetEmail.includes('@')) {
      const emailUserClean = targetEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      if (emailUserClean.length >= 3 && cleanHandle.includes(emailUserClean)) {
        matchedRoot = true;
      }
    }

    if (matchedRoot) {
      handleScore = 10;
      handlePassed.push('ROOT_MATCH');
      checks.push({
        factor: 'Handle: Raiz Exata Identificada',
        passed: true,
        points: 10,
        detail: `Handle '${handle}' contém a raiz do alvo`
      });
    } else {
      checks.push({
        factor: 'Handle: Raiz Não Identificada',
        passed: false,
        points: 0,
        detail: `Handle '${handle}' não contém raízes diretas do alvo`
      });
    }
  }

  // Calculate total score (0 to 100)
  const totalScore = Math.min(100, emailScore + phoneScore + nameScore + handleScore);

  // Certainty classification
  let certainty = 'LOW';
  if (totalScore >= 75) {
    certainty = 'HIGH';
  } else if (totalScore >= 45) {
    certainty = 'MEDIUM';
  }

  return {
    score: totalScore,
    certainty,
    breakdown: {
      email: { score: emailScore, max: 40, passedChecks: emailPassed },
      phone: { score: phoneScore, max: 30, passedChecks: phonePassed },
      name: { score: nameScore, max: 20, passedChecks: namePassed },
      handle: { score: handleScore, max: 10, passedChecks: handlePassed }
    },
    checks
  };
}

