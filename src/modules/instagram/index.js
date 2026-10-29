/**
 * @file modules/instagram/index.js
 * Instagram OSINT Engine (InstagramEngine) - High-Power YesItsMe Successor
 * Modernized 100% Native Node.js ESM Architecture
 */

import {
  generateHandlePermutations,
  sanitizeInstagramHandle,
  isValidInstagramHandle,
  decomposeName,
  resolveProfessionTokens,
  PROFESSIONS_CATALOG
} from './permutator.js';

import {
  reconInstagramProfile,
  lookupAccountRecovery,
  parseOgDescription,
  extractMasksFromText
} from './recon.js';

import {
  calculateMatchScore,
  matchDomainMask,
  extractMaskTrailingDigits
} from './matcher.js';

import {
  estimateAccountAge,
  extractBioEntities,
  generateReverseImageSearchUrls,
  generateCrossSocialLinks,
  META_PK_CHRONOLOGY
} from './extractor.js';

export {
  generateHandlePermutations,
  sanitizeInstagramHandle,
  isValidInstagramHandle,
  decomposeName,
  resolveProfessionTokens,
  PROFESSIONS_CATALOG,
  reconInstagramProfile,
  lookupAccountRecovery,
  parseOgDescription,
  extractMasksFromText,
  calculateMatchScore,
  matchDomainMask,
  extractMaskTrailingDigits,
  estimateAccountAge,
  extractBioEntities,
  generateReverseImageSearchUrls,
  generateCrossSocialLinks,
  META_PK_CHRONOLOGY
};

/**
 * Perform a complete Instagram OSINT investigation with permutation generation,
 * profile reconnaissance, contact obfuscation matching, and forensic extraction.
 * 
 * @param {Object} params
 * @param {string} [params.nome] - Target's full or partial name
 * @param {string} [params.name] - Alias for nome
 * @param {string} [params.email] - Suspected email to correlate
 * @param {string} [params.telefone] - Suspected phone to correlate
 * @param {string} [params.phone] - Alias for telefone
 * @param {string} [params.username] - Known handle to probe directly
 * @param {string} [params.handle] - Alias for username
 * @param {string} [params.profissao] - Profession or segment
 * @param {string} [params.profession] - Alias for profissao
 * @param {string|number} [params.anoNascimento] - Birth year
 * @param {string} [params.cidade] - City or region
 * @param {number} [params.limitePermutacoes=40] - Max permutations to probe
 * @param {Object} [options]
 * @param {number} [options.concurrency=10] - Simultaneous requests
 * @param {number} [options.timeout=6000] - Timeout in milliseconds
 * @param {string} [options.sessionId] - Optional Instagram session ID
 * @param {string} [options.csrfToken] - Optional CSRF token
 * @param {Function} [options.onCandidateChecked] - Progress callback
 * @param {Function} [options.onMatchFound] - Discovery callback
 * @param {Object} [options.mockData] - Mock profiles for offline/testing
 * @param {Object} [options.mockRecovery] - Mock recovery masks for offline/testing
 * @returns {Promise<{
 *   target: Object,
 *   totalPermutations: number,
 *   checkedCount: number,
 *   foundCount: number,
 *   matches: Array<Object>,
 *   highCertaintyMatches: Array<Object>,
 *   mediumCertaintyMatches: Array<Object>,
 *   lowCertaintyMatches: Array<Object>,
 *   durationMs: number
 * }>}
 */
export async function investigateInstagram(params = {}, options = {}) {
  const startTime = Date.now();

  const targetNome = params.nome || params.name || '';
  const targetEmail = params.email || '';
  const targetPhone = params.telefone || params.phone || '';
  const directUsername = params.username || params.handle || '';
  const targetProfissao = params.profissao || params.profession || '';
  const targetAno = params.anoNascimento || params.birthYear;
  const targetCidade = params.cidade || params.city;
  const maxPermutations = params.limitePermutacoes || params.limit || 40;

  const {
    concurrency = 10,
    timeout = 6000,
    sessionId = null,
    csrfToken = null,
    onCandidateChecked = null,
    onMatchFound = null,
    mockData = null,
    mockRecovery = null
  } = options;

  // 1. Build candidates list
  const candidatesSet = new Set();
  if (directUsername) {
    const cleanDirect = sanitizeInstagramHandle(directUsername);
    if (isValidInstagramHandle(cleanDirect)) {
      candidatesSet.add(cleanDirect);
    }
  }

  if (targetNome) {
    const generated = generateHandlePermutations({
      nome: targetNome,
      profissao: targetProfissao,
      anoNascimento: targetAno,
      cidade: targetCidade,
      limite: maxPermutations
    });
    generated.forEach(h => candidatesSet.add(h));
  }

  const candidatesList = Array.from(candidatesSet);
  if (candidatesList.length === 0) {
    return {
      target: { nome: targetNome, email: targetEmail, telefone: targetPhone },
      totalPermutations: 0,
      checkedCount: 0,
      foundCount: 0,
      matches: [],
      highCertaintyMatches: [],
      mediumCertaintyMatches: [],
      lowCertaintyMatches: [],
      durationMs: Date.now() - startTime
    };
  }

  const foundResults = [];
  let checkedCount = 0;

  // 2. Worker Pool for bounded concurrency
  let candidateIndex = 0;

  async function worker() {
    while (candidateIndex < candidatesList.length) {
      const idx = candidateIndex++;
      const handle = candidatesList[idx];

      let profileResult = null;
      let recoveryResult = null;

      try {
        // Run profile recon and recovery lookup in parallel
        const [prof, rec] = await Promise.all([
          reconInstagramProfile(handle, { timeout, sessionId, mockData }),
          lookupAccountRecovery(handle, { timeout, csrfToken, mockRecovery })
        ]);
        profileResult = prof;
        recoveryResult = rec;
      } catch {
        // Resilience against unexpected socket drops
      }

      checkedCount++;

      const exists = Boolean(profileResult?.exists || recoveryResult?.success);

      let finding = null;
      if (exists) {
        const maskedEmail = recoveryResult?.maskedEmail || '';
        const maskedPhone = recoveryResult?.maskedPhone || '';
        const fullName = profileResult?.profile?.fullName || '';

        // Calculate probabilistic match score
        const match = calculateMatchScore(
          { email: targetEmail, telefone: targetPhone, nome: targetNome },
          { maskedEmail, maskedPhone, fullName, handle }
        );

        // Forensic extractions
        const pk = profileResult?.profile?.id || '';
        const bio = profileResult?.profile?.biography || '';
        const avatar = profileResult?.profile?.avatarUrl || '';

        const estimatedAge = estimateAccountAge(pk);
        const bioEntities = extractBioEntities(bio);
        const reverseImageSearch = generateReverseImageSearchUrls(avatar);
        const crossSocialLinks = generateCrossSocialLinks(handle);

        finding = {
          handle,
          exists: true,
          url: `https://www.instagram.com/${handle}`,
          profile: profileResult?.profile || null,
          recovery: recoveryResult || null,
          match,
          forensics: {
            estimatedAge,
            bioEntities,
            reverseImageSearch,
            crossSocialLinks
          }
        };

        foundResults.push(finding);

        if (typeof onMatchFound === 'function') {
          onMatchFound(finding);
        }
      }

      if (typeof onCandidateChecked === 'function') {
        onCandidateChecked(
          { handle, exists, finding },
          {
            checked: checkedCount,
            total: candidatesList.length,
            percent: Math.round((checkedCount / candidatesList.length) * 100),
            found: foundResults.length
          }
        );
      }
    }
  }

  const workerCount = Math.min(concurrency, candidatesList.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);

  // 3. Sort results by match score descending, then by followers
  foundResults.sort((a, b) => {
    if (b.match.score !== a.match.score) {
      return b.match.score - a.match.score;
    }
    const bFollowers = b.profile?.followers || 0;
    const aFollowers = a.profile?.followers || 0;
    return bFollowers - aFollowers;
  });

  const highCertaintyMatches = foundResults.filter(r => r.match.certainty === 'HIGH');
  const mediumCertaintyMatches = foundResults.filter(r => r.match.certainty === 'MEDIUM');
  const lowCertaintyMatches = foundResults.filter(r => r.match.certainty === 'LOW');

  return {
    target: {
      nome: targetNome,
      email: targetEmail,
      telefone: targetPhone,
      profissao: targetProfissao,
      username: directUsername
    },
    totalPermutations: candidatesList.length,
    checkedCount,
    foundCount: foundResults.length,
    matches: foundResults,
    highCertaintyMatches,
    mediumCertaintyMatches,
    lowCertaintyMatches,
    durationMs: Date.now() - startTime
  };
}

/**
 * Class-based representation of InstagramEngine
 */
export class InstagramEngine {
  constructor(options = {}) {
    this.defaultOptions = options;
  }

  generatePermutations(criteria) {
    return generateHandlePermutations(criteria);
  }

  async investigate(params, options = {}) {
    return investigateInstagram(params, { ...this.defaultOptions, ...options });
  }

  async checkProfile(username, options = {}) {
    return reconInstagramProfile(username, { ...this.defaultOptions, ...options });
  }

  async checkRecovery(usernameOrEmail, options = {}) {
    return lookupAccountRecovery(usernameOrEmail, { ...this.defaultOptions, ...options });
  }
}

