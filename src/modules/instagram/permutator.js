/**
 * @file modules/instagram/permutator.js
 * High-Power Combinatorial Username Permutator for Instagram OSINT
 * Modernized 100% Native Node.js ESM inspired by YesItsMe
 */

export const CONNECTIVES = ['da', 'de', 'do', 'das', 'dos', 'del', 'e', 'di', 'du'];

export const PROFESSIONS_CATALOG = {
  juridico: ['adv', 'advogado', 'advogada', 'oab', 'juridico', 'direito'],
  saude: ['dr', 'dra', 'med', 'medico', 'medica', 'psi', 'psico', 'psicologa', 'nutri', 'odonto', 'dentista', 'enf', 'dermato'],
  tech: ['eng', 'engenheiro', 'dev', 'tech', 'code'],
  negocios: ['arq', 'arquiteto', 'contabil', 'corretor', 'imoveis', 'consultor'],
  gerais: ['oficial', 'real', 'prof', 'coach', 'personal']
};

/**
 * Sanitize candidate string strictly according to Instagram handle rules:
 * - Lowercase
 * - Diacritics removed (Unicode NFD)
 * - Only [a-z0-9._] allowed
 * - Consecutive dots forbidden ('..' -> '.')
 * - No leading or trailing dots
 * - Max 30 characters
 * 
 * @param {string} raw
 * @returns {string}
 */
export function sanitizeInstagramHandle(raw) {
  if (typeof raw !== 'string') return '';

  let handle = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9._]/g, '')     // Apenas a-z, 0-9, . e _
    .replace(/\.+/g, '.')            // Proibir pontos consecutivos
    .replace(/^\.+|\.+$/g, '');      // Proibir ponto no início ou no fim

  if (handle.length > 30) {
    handle = handle.slice(0, 30).replace(/\.+$/, '');
  }

  return handle;
}

/**
 * Validate whether a handle strictly meets Instagram requirements
 * @param {string} handle
 * @returns {boolean}
 */
export function isValidInstagramHandle(handle) {
  if (!handle || typeof handle !== 'string') return false;
  if (handle.length < 1 || handle.length > 30) return false;
  if (handle.startsWith('.') || handle.endsWith('.')) return false;
  if (handle.includes('..')) return false;
  return /^[a-z0-9._]+$/.test(handle);
}

/**
 * Parse and decompose a full name into OSINT components
 * @param {string} fullName
 * @returns {{
 *   firstName: string,
 *   lastName: string,
 *   middleNames: string[],
 *   connectives: string[],
 *   hasExplicitConnective: boolean,
 *   firstInitial: string,
 *   lastInitial: string,
 *   middleInitials: string[]
 * }}
 */
export function decomposeName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return {
      firstName: '',
      lastName: '',
      middleNames: [],
      connectives: [],
      hasExplicitConnective: false,
      firstInitial: '',
      lastInitial: '',
      middleInitials: []
    };
  }

  const clean = fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .trim();

  const rawTokens = clean.split(/\s+/).filter(Boolean);
  if (rawTokens.length === 0) {
    return {
      firstName: '',
      lastName: '',
      middleNames: [],
      connectives: [],
      hasExplicitConnective: false,
      firstInitial: '',
      lastInitial: '',
      middleInitials: []
    };
  }

  if (rawTokens.length === 1) {
    const single = rawTokens[0];
    return {
      firstName: single,
      lastName: single,
      middleNames: [],
      connectives: [],
      hasExplicitConnective: false,
      firstInitial: single[0],
      lastInitial: single[0],
      middleInitials: []
    };
  }

  const firstName = rawTokens[0];
  const lastIndex = rawTokens.length - 1;
  const lastName = rawTokens[lastIndex];

  const middleTokens = rawTokens.slice(1, lastIndex);
  const connectives = [];
  const middleNames = [];

  for (const token of middleTokens) {
    if (CONNECTIVES.includes(token)) {
      connectives.push(token);
    } else {
      middleNames.push(token);
    }
  }

  return {
    firstName,
    lastName,
    middleNames,
    connectives,
    hasExplicitConnective: connectives.length > 0,
    firstInitial: firstName[0] || '',
    lastInitial: lastName[0] || '',
    middleInitials: middleNames.map(m => m[0] || '')
  };
}

/**
 * Expand profession query into synonymous prefix/suffix tokens
 * @param {string} [professionInput]
 * @returns {string[]}
 */
export function resolveProfessionTokens(professionInput) {
  if (!professionInput || typeof professionInput !== 'string') return [];

  const normalized = professionInput
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const tokens = new Set();
  tokens.add(normalized);

  // Check each category for matches or containment
  for (const list of Object.values(PROFESSIONS_CATALOG)) {
    if (list.includes(normalized)) {
      list.forEach(t => tokens.add(t));
    }
  }

  // Common quick aliases
  if (normalized === 'adv' || normalized === 'advogado' || normalized === 'advogada') {
    tokens.add('adv');
    tokens.add('oab');
    tokens.add('direito');
  } else if (normalized === 'med' || normalized === 'medico' || normalized === 'medica' || normalized === 'doutor') {
    tokens.add('dr');
    tokens.add('dra');
    tokens.add('med');
  } else if (normalized === 'psi' || normalized === 'psico' || normalized === 'psicologia') {
    tokens.add('psi');
    tokens.add('psico');
  } else if (normalized === 'dev' || normalized === 'programador' || normalized === 'software') {
    tokens.add('dev');
    tokens.add('tech');
    tokens.add('code');
  }

  return Array.from(tokens).slice(0, 5); // Pick top synonymous tokens
}

/**
 * Generate intelligent combinatorial username permutations for Instagram
 * 
 * @param {Object} criteria
 * @param {string} criteria.nome - Target's full or partial name (e.g. "Carlos Eduardo da Silva")
 * @param {string} [criteria.profissao] - Profession or segment (e.g. "adv", "dr", "psi")
 * @param {string|number} [criteria.anoNascimento] - Year of birth (e.g. 1990 or "90")
 * @param {string} [criteria.cidade] - City or state abbreviation (e.g. "SP", "Rio")
 * @param {number} [criteria.limite=300] - Max permutations to return
 * @returns {string[]} Array of sanitized, deduplicated handles ordered by relevance
 */
export function generateHandlePermutations(criteria = {}) {
  const {
    nome = criteria.name || '',
    profissao = criteria.profession,
    anoNascimento = criteria.birthYear,
    cidade = criteria.city,
    limite = criteria.limit || 300
  } = criteria;

  if (!nome || typeof nome !== 'string') return [];

  const decomp = decomposeName(nome);
  const {
    firstName,
    lastName,
    middleNames,
    connectives,
    hasExplicitConnective,
    firstInitial,
    lastInitial,
    middleInitials
  } = decomp;

  if (!firstName) return [];

  const results = [];
  const added = new Set();

  function pushCandidate(handle, weight = 10) {
    const sanitized = sanitizeInstagramHandle(handle);
    if (isValidInstagramHandle(sanitized) && !added.has(sanitized)) {
      added.add(sanitized);
      results.push({ handle: sanitized, weight });
    }
  }

  const mid = middleNames[0] || '';
  const midInit = middleInitials[0] || '';
  const sepList = ['.', '_', ''];

  // Single word target
  if (firstName === lastName) {
    pushCandidate(firstName, 100);
    for (const sep of ['.', '_']) {
      pushCandidate(`${firstName}${sep}oficial`, 90);
      pushCandidate(`${firstName}${sep}real`, 85);
    }
  } else {
    // ------------------------------------------------------------------------
    // TIER 1: CORE NAME COMBINATIONS (High Statistical Weight)
    // ------------------------------------------------------------------------
    // [nome].[sobrenome], [nome]_[sobrenome], [nome][sobrenome]
    pushCandidate(`${firstName}.${lastName}`, 100);
    pushCandidate(`${firstName}_${lastName}`, 98);
    pushCandidate(`${firstName}${lastName}`, 96);

    // Inverted: [sobrenome].[nome], [sobrenome]_[nome], [sobrenome][nome]
    pushCandidate(`${lastName}.${firstName}`, 94);
    pushCandidate(`${lastName}_${firstName}`, 92);
    pushCandidate(`${lastName}${firstName}`, 90);

    // Middle names permutations if present
    if (mid) {
      pushCandidate(`${firstName}.${mid}.${lastName}`, 88);
      pushCandidate(`${firstName}_${mid}_${lastName}`, 86);
      pushCandidate(`${firstName}${mid}${lastName}`, 84);

      // Inverted with middle
      pushCandidate(`${lastName}.${firstName}.${mid}`, 82);
      pushCandidate(`${lastName}_${firstName}_${mid}`, 80);

      // First + Middle (omitting last)
      pushCandidate(`${firstName}.${mid}`, 78);
      pushCandidate(`${firstName}_${mid}`, 76);
      pushCandidate(`${firstName}${mid}`, 74);

      // Middle + Last
      pushCandidate(`${mid}.${lastName}`, 72);
      pushCandidate(`${mid}_${lastName}`, 70);
      pushCandidate(`${mid}${lastName}`, 68);

      // Middle initials: carlos.e.silva, carlos_e_silva, silva.e.carlos
      if (midInit) {
        pushCandidate(`${firstName}.${midInit}.${lastName}`, 85);
        pushCandidate(`${firstName}_${midInit}_${lastName}`, 83);
        pushCandidate(`${firstName}${midInit}${lastName}`, 81);
        pushCandidate(`${lastName}.${midInit}.${firstName}`, 79);
        pushCandidate(`${lastName}_${midInit}_${firstName}`, 77);
      }
    }

    // ------------------------------------------------------------------------
    // TIER 2: INITIALS AND MONOGRAMS
    // ------------------------------------------------------------------------
    // [inicial_nome].[sobrenome], [inicial_nome]_[sobrenome], [inicial_nome][sobrenome]
    pushCandidate(`${firstInitial}.${lastName}`, 75);
    pushCandidate(`${firstInitial}_${lastName}`, 73);
    pushCandidate(`${firstInitial}${lastName}`, 71);

    // [sobrenome].[inicial_nome], [sobrenome]_[inicial_nome], [sobrenome][inicial_nome]
    pushCandidate(`${lastName}.${firstInitial}`, 69);
    pushCandidate(`${lastName}_${firstInitial}`, 67);
    pushCandidate(`${lastName}${firstInitial}`, 65);

    // [nome].[inicial_sobrenome]
    pushCandidate(`${firstName}.${lastInitial}`, 63);
    pushCandidate(`${firstName}_${lastInitial}`, 61);
    pushCandidate(`${firstName}${lastInitial}`, 59);

    // Monograms with middle initial (e.g. ce.silva, silva.ce)
    if (midInit) {
      pushCandidate(`${firstInitial}${midInit}.${lastName}`, 57);
      pushCandidate(`${firstInitial}${midInit}_${lastName}`, 55);
      pushCandidate(`${firstInitial}${midInit}${lastName}`, 53);
      pushCandidate(`${lastName}.${firstInitial}${midInit}`, 51);
      pushCandidate(`${lastName}_${firstInitial}${midInit}`, 49);
      pushCandidate(`${lastName}${firstInitial}${midInit}`, 47);
    }

    // ------------------------------------------------------------------------
    // TIER 3: PREPOSITIONS AND CONNECTIVES
    // ------------------------------------------------------------------------
    const prepsToTest = hasExplicitConnective
      ? connectives
      : ['de', 'da', 'do'];

    for (const prep of prepsToTest) {
      // Preposição junta: dasilva, desilva, dosilva
      pushCandidate(`${firstName}.${prep}${lastName}`, 60);
      pushCandidate(`${firstName}_${prep}${lastName}`, 58);
      pushCandidate(`${firstName}${prep}${lastName}`, 56);

      // Invertida junta
      pushCandidate(`${prep}${lastName}.${firstName}`, 54);
      pushCandidate(`${prep}${lastName}_${firstName}`, 52);
      pushCandidate(`${prep}${lastName}${firstName}`, 50);

      // Preposição separada: da.silva, da_silva
      pushCandidate(`${firstName}.${prep}.${lastName}`, 58);
      pushCandidate(`${firstName}_${prep}_${lastName}`, 56);
      pushCandidate(`${lastName}.${prep}.${firstName}`, 52);
      pushCandidate(`${lastName}_${prep}_${firstName}`, 50);

      // Iniciais com preposição
      pushCandidate(`${firstInitial}.${prep}.${lastName}`, 45);
      pushCandidate(`${firstInitial}_${prep}_${lastName}`, 43);
      pushCandidate(`${prep}${lastName}.${firstInitial}`, 41);
    }
  }

  // --------------------------------------------------------------------------
  // TIER 4: PROFESSIONS AND SEGMENTS (PREFIXES & SUFFIXES)
  // --------------------------------------------------------------------------
  const profTokens = resolveProfessionTokens(profissao);
  const baseTops = results.slice(0, 10).map(r => r.handle);

  if (profTokens.length > 0) {
    for (const token of profTokens) {
      // Direct with first and last
      pushCandidate(`${token}.${firstName}.${lastName}`, 95);
      pushCandidate(`${token}_${firstName}_${lastName}`, 93);
      pushCandidate(`${token}${firstName}${lastName}`, 91);
      pushCandidate(`${token}.${lastName}`, 89);
      pushCandidate(`${token}_${lastName}`, 87);
      pushCandidate(`${token}${lastName}`, 85);

      // Suffix placement: [nome].[sobrenome].adv, [sobrenome].[nome].psi
      pushCandidate(`${firstName}.${lastName}.${token}`, 95);
      pushCandidate(`${firstName}_${lastName}_${token}`, 93);
      pushCandidate(`${firstName}${lastName}.${token}`, 91);
      pushCandidate(`${lastName}.${firstName}.${token}`, 89);
      pushCandidate(`${lastName}_${firstName}_${token}`, 87);
      pushCandidate(`${lastName}${firstName}.${token}`, 85);

      // With base tops
      for (const base of baseTops.slice(0, 4)) {
        pushCandidate(`${token}.${base}`, 80);
        pushCandidate(`${token}_${base}`, 78);
        pushCandidate(`${base}.${token}`, 80);
        pushCandidate(`${base}_${token}`, 78);
      }
    }
  }

  // --------------------------------------------------------------------------
  // TIER 5: BIRTH YEAR VARIANTS (if provided)
  // --------------------------------------------------------------------------
  if (anoNascimento) {
    const rawYear = String(anoNascimento).trim();
    const fourDigit = rawYear.length === 4 ? rawYear : (rawYear.length === 2 ? `19${rawYear}` : '');
    const twoDigit = rawYear.length === 2 ? rawYear : (rawYear.length === 4 ? rawYear.slice(2) : '');

    const years = [twoDigit, fourDigit].filter(Boolean);
    const topCandidates = results.slice(0, 8).map(r => r.handle);

    for (const y of years) {
      for (const base of topCandidates) {
        pushCandidate(`${base}${y}`, 65);
        pushCandidate(`${base}_${y}`, 63);
        pushCandidate(`${base}.${y}`, 61);
      }
    }
  }

  // --------------------------------------------------------------------------
  // TIER 6: CITY / REGION VARIANTS (if provided)
  // --------------------------------------------------------------------------
  if (cidade) {
    const cleanCity = cidade
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '')
      .trim();

    if (cleanCity) {
      const topCandidates = results.slice(0, 6).map(r => r.handle);
      for (const base of topCandidates) {
        pushCandidate(`${base}.${cleanCity}`, 55);
        pushCandidate(`${base}_${cleanCity}`, 53);
        pushCandidate(`${base}${cleanCity}`, 51);
      }
    }
  }

  // Sort by weight descending, preserving insertion order for ties
  results.sort((a, b) => b.weight - a.weight);

  return results.slice(0, limite).map(r => r.handle);
}

