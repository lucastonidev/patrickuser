/**
 * @file modules/instagram/extractor.js
 * Forensic Data Extraction, PK Chronology Estimation & Cross-OSINT Intelligence
 * Modernized 100% Native Node.js ESM inspired by YesItsMe
 */

export const META_PK_CHRONOLOGY = [
  { maxId: 25_000_000n, range: '2010 - 2012', era: 'Pioneiro / Early Adopter (Pré-aquisição Meta)' },
  { maxId: 350_000_000n, range: '2012 - 2013', era: 'Fase de Crescimento Inicial (Pós-aquisição Facebook)' },
  { maxId: 1_200_000_000n, range: '2013 - 2014', era: 'Expansão Global & Lançamento Android' },
  { maxId: 3_000_000_000n, range: '2014 - 2016', era: 'Direct Messages & Crescimento Massivo' },
  { maxId: 8_000_000_000n, range: '2016 - 2017', era: 'Lançamento Stories & Novo Feed' },
  { maxId: 18_000_000_000n, range: '2017 - 2019', era: 'IGTV & Unificação de Infraestrutura Meta' },
  { maxId: 35_000_000_000n, range: '2019 - 2021', era: 'Era Pandemia & Lançamento dos Reels' },
  { maxId: 55_000_000_000n, range: '2021 - 2023', era: 'Ecossistema Meta Graph v12+' },
  { maxId: 10_000_000_000_000n, range: '2023 - 2026', era: 'Contas Recentes / Geração Atual' }
];

/**
 * Estimate the creation date range of an Instagram account based on its numeric Meta User ID (PK)
 * @param {string|number|bigint} rawId
 * @returns {{
 *   numericId: string,
 *   estimatedYears: string,
 *   era: string,
 *   isEarlyAdopter: boolean
 * }}
 */
export function estimateAccountAge(rawId) {
  if (!rawId) {
    return {
      numericId: '',
      estimatedYears: 'Desconhecido',
      era: 'ID não disponível',
      isEarlyAdopter: false
    };
  }

  const cleanDigits = String(rawId).replace(/\D/g, '');
  if (!cleanDigits) {
    return {
      numericId: '',
      estimatedYears: 'Desconhecido',
      era: 'Formato de ID inválido',
      isEarlyAdopter: false
    };
  }

  let idNum;
  try {
    idNum = BigInt(cleanDigits);
  } catch {
    return {
      numericId: cleanDigits,
      estimatedYears: 'Desconhecido',
      era: 'Erro ao interpretar ID numérico',
      isEarlyAdopter: false
    };
  }

  for (const bracket of META_PK_CHRONOLOGY) {
    if (idNum <= bracket.maxId) {
      return {
        numericId: cleanDigits,
        estimatedYears: bracket.range,
        era: bracket.era,
        isEarlyAdopter: idNum <= 350_000_000n
      };
    }
  }

  return {
    numericId: cleanDigits,
    estimatedYears: '2023 - 2026',
    era: 'Contas Recentes / Geração Atual',
    isEarlyAdopter: false
  };
}

/**
 * Extract forensic entities from an Instagram bio text
 * @param {string} bioText
 * @returns {{
 *   whatsapp: string[],
 *   pix: {
 *     cpfs: string[],
 *     cnpjs: string[],
 *     evp: string[],
 *     explicitKeys: string[]
 *   },
 *   emails: string[],
 *   links: string[],
 *   mentions: string[]
 * }}
 */
export function extractBioEntities(bioText) {
  const result = {
    whatsapp: [],
    pix: {
      cpfs: [],
      cnpjs: [],
      evp: [],
      explicitKeys: []
    },
    emails: [],
    links: [],
    mentions: []
  };

  if (!bioText || typeof bioText !== 'string') return result;

  const text = bioText;

  // 1. WhatsApp Extraction
  const waLinkMatches = text.matchAll(/(?:wa\.me|api\.whatsapp\.com\/send\?phone=)\/??([+0-9]+)/gi);
  for (const match of waLinkMatches) {
    const num = match[1].replace(/\D/g, '');
    if (num && !result.whatsapp.includes(num)) {
      result.whatsapp.push(num);
    }
  }

  // Explicit label: whats: 11 98888-7777 / zap / contato
  const waExplicit = text.matchAll(/(?:whatsapp|whats|wpp|zap|contato)[:\s]*([+]?[0-9\s().-]{8,20})/gi);
  for (const match of waExplicit) {
    const rawNum = match[1].trim();
    const digits = rawNum.replace(/\D/g, '');
    if (digits.length >= 8 && digits.length <= 15 && !result.whatsapp.includes(digits)) {
      result.whatsapp.push(digits);
    }
  }

  // BR Cell phone pattern: (11) 98765-4321 or +55 11 98765-4321
  const brPhoneMatches = text.matchAll(/(?:\+?55\s?)?(?:\(?([1-9][0-9])\)?\s?)?(9[0-9]{4}[-\s]?[0-9]{4})/g);
  for (const match of brPhoneMatches) {
    const ddd = match[1] || '';
    const number = match[2].replace(/\D/g, '');
    const full = ddd ? `55${ddd}${number}` : number;
    if (!result.whatsapp.includes(full)) {
      result.whatsapp.push(full);
    }
  }

  // 2. Commercial Emails
  const emailMatches = text.matchAll(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi);
  for (const match of emailMatches) {
    const email = match[1].toLowerCase();
    if (!result.emails.includes(email)) {
      result.emails.push(email);
    }
  }

  // 3. Pix Keys
  // CPF format: 123.456.789-00 or 12345678900
  const cpfMatches = text.matchAll(/\b(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/g);
  for (const match of cpfMatches) {
    const cleanCpf = match[1].replace(/\D/g, '');
    // Avoid false positives like simple timestamps
    if (cleanCpf.length === 11 && !result.pix.cpfs.includes(cleanCpf)) {
      result.pix.cpfs.push(cleanCpf);
    }
  }

  // CNPJ format: 12.346.789/0001-90
  const cnpjMatches = text.matchAll(/\b(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/g);
  for (const match of cnpjMatches) {
    const cleanCnpj = match[1].replace(/\D/g, '');
    if (cleanCnpj.length === 14 && !result.pix.cnpjs.includes(cleanCnpj)) {
      result.pix.cnpjs.push(cleanCnpj);
    }
  }

  // EVP / Random Key (UUID format)
  const evpMatches = text.matchAll(/\b([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\b/g);
  for (const match of evpMatches) {
    const uuid = match[1].toLowerCase();
    if (!result.pix.evp.includes(uuid)) {
      result.pix.evp.push(uuid);
    }
  }

  // Explicit Pix keyword: "pix: ...", "chave pix: ..."
  const explicitPixMatches = text.matchAll(/(?:chave\s*pix|pix)[:\s]+([^\s,;]+)/gi);
  for (const match of explicitPixMatches) {
    const rawKey = match[1].trim();
    if (rawKey && !result.pix.explicitKeys.includes(rawKey)) {
      result.pix.explicitKeys.push(rawKey);
    }
  }

  // 4. External Links & Link Aggregators
  const urlMatches = text.matchAll(/https?:\/\/[^\s<>"]+/gi);
  for (const match of urlMatches) {
    const url = match[0];
    if (!result.links.includes(url)) {
      result.links.push(url);
    }
  }

  const aggregatorMatches = text.matchAll(/\b((?:linktr\.ee|beacons\.ai|bio\.link|campsite\.bio|instabio\.cc)\/[a-zA-Z0-9_.-]+)/gi);
  for (const match of aggregatorMatches) {
    const full = `https://${match[1]}`;
    if (!result.links.includes(full)) {
      result.links.push(full);
    }
  }

  // 5. Mentions (@handle)
  const mentionMatches = text.matchAll(/(?:^|[\s,;])@([a-zA-Z0-9._]{1,30})/g);
  for (const match of mentionMatches) {
    const handle = match[1].toLowerCase().replace(/\.+$/, '');
    if (handle && !result.mentions.includes(handle)) {
      result.mentions.push(handle);
    }
  }

  return result;
}

/**
 * Generate 1-click reverse image search URLs for an avatar image
 * @param {string} avatarUrl
 * @returns {{
 *   googleLens: string,
 *   yandex: string,
 *   bing: string,
 *   tineye: string
 * }}
 */
export function generateReverseImageSearchUrls(avatarUrl) {
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return { googleLens: '', yandex: '', bing: '', tineye: '' };
  }

  const encoded = encodeURIComponent(avatarUrl);

  return {
    googleLens: `https://lens.google.com/uploadbyurl?url=${encoded}`,
    yandex: `https://yandex.com/images/search?rpt=imageview&url=${encoded}`,
    bing: `https://www.bing.com/images/search?view=detailv2&iss=sbi&FORM=SBIHMP&sbisrc=UrlPaste&q=imgurl:${encoded}`,
    tineye: `https://tineye.com/search?url=${encoded}`
  };
}

/**
 * Generate cross-social platform verification links for the same username
 * @param {string} handle
 * @returns {Record<string, string>}
 */
export function generateCrossSocialLinks(handle) {
  if (!handle || typeof handle !== 'string') return {};

  const clean = handle.replace(/^@+/, '').trim();

  return {
    threads: `https://www.threads.net/@${clean}`,
    tiktok: `https://www.tiktok.com/@${clean}`,
    twitter: `https://x.com/${clean}`,
    github: `https://github.com/${clean}`,
    linkedin: `https://www.linkedin.com/in/${clean}`,
    youtube: `https://www.youtube.com/@${clean}`
  };
}

