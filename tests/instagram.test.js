import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateHandlePermutations,
  sanitizeInstagramHandle,
  isValidInstagramHandle,
  decomposeName,
  resolveProfessionTokens,
  calculateMatchScore,
  matchDomainMask,
  extractMaskTrailingDigits,
  estimateAccountAge,
  extractBioEntities,
  generateReverseImageSearchUrls,
  generateCrossSocialLinks,
  investigateInstagram,
  InstagramEngine
} from '../src/modules/instagram/index.js';

describe('Instagram Engine: Permutator (Combinatorial Generator)', () => {
  test('decomposes connectives and names correctly (e.g. Carlos Eduardo da Silva)', () => {
    const decomp = decomposeName('Carlos Eduardo da Silva');
    assert.strictEqual(decomp.firstName, 'carlos');
    assert.strictEqual(decomp.lastName, 'silva');
    assert.deepStrictEqual(decomp.middleNames, ['eduardo']);
    assert.deepStrictEqual(decomp.connectives, ['da']);
    assert.strictEqual(decomp.hasExplicitConnective, true);
    assert.strictEqual(decomp.firstInitial, 'c');
    assert.strictEqual(decomp.lastInitial, 's');
    assert.deepStrictEqual(decomp.middleInitials, ['e']);
  });

  test('generates prepositions variants when connective is present', () => {
    const perms = generateHandlePermutations({ nome: 'Carlos Eduardo da Silva', limite: 150 });
    
    // Core
    assert.ok(perms.includes('carlos.silva'));
    assert.ok(perms.includes('carlos_silva'));
    assert.ok(perms.includes('carlossilva'));
    
    // Inverted
    assert.ok(perms.includes('silva.carlos'));
    assert.ok(perms.includes('silva_carlos'));

    // Preposition variations: attached, separated, inverted
    assert.ok(perms.includes('carlos.dasilva') || perms.includes('carlos_dasilva') || perms.includes('carlosdasilva'));
    assert.ok(perms.includes('carlos.da.silva') || perms.includes('carlos_da_silva'));
    assert.ok(perms.includes('dasilva.carlos') || perms.includes('dasilva_carlos'));
  });

  test('adds frequent Brazilian prepositions (de, da, do) when name has no connectives (e.g. Lucas Pereira)', () => {
    const perms = generateHandlePermutations({ nome: 'Lucas Pereira', limite: 150 });

    assert.ok(perms.includes('lucas.pereira'));
    assert.ok(perms.includes('pereira.lucas'));

    // Should include variants with de/da/do
    const hasDeVariant = perms.some(p => p.includes('.de.') || p.includes('_de_') || p.includes('depereira') || p.includes('de.pereira'));
    assert.ok(hasDeVariant, 'Should generate variants with preposition "de" for names without connective');
  });

  test('generates structural inversions, initials and monograms', () => {
    const perms = generateHandlePermutations({ nome: 'Carlos Eduardo da Silva', limite: 200 });

    // Initials
    assert.ok(perms.includes('c.silva') || perms.includes('c_silva') || perms.includes('csilva'));
    assert.ok(perms.includes('silva.c') || perms.includes('silva_c'));
    assert.ok(perms.includes('carlos.s') || perms.includes('carlos_s'));

    // Monograms with middle initial (carlos.e.silva, ce.silva)
    assert.ok(perms.includes('carlos.e.silva') || perms.includes('carlos_e_silva'));
    assert.ok(perms.includes('ce.silva') || perms.includes('cesilva'));
  });

  test('applies professions catalog with dual prefix and suffix positioning', () => {
    const permsAdv = generateHandlePermutations({ nome: 'Carlos Silva', profissao: 'adv', limite: 100 });
    
    // Prefix
    assert.ok(permsAdv.some(p => p.startsWith('adv.') || p.startsWith('adv_') || p.startsWith('adv')), 'Should have adv prefix');
    // Suffix
    assert.ok(permsAdv.some(p => p.endsWith('.adv') || p.endsWith('_adv') || p.endsWith('adv')), 'Should have adv suffix');

    const permsMed = generateHandlePermutations({ nome: 'Ana Costa', profissao: 'medico', limite: 100 });
    assert.ok(permsMed.some(p => p.startsWith('dr.') || p.startsWith('dr_') || p.startsWith('med.') || p.endsWith('.med')), 'Should expand medico to dr / med');
  });

  test('sanitizes Instagram handles strictly according to official limits', () => {
    // Strips accents, lowers case, cleans forbidden chars, avoids consecutive dots
    assert.strictEqual(sanitizeInstagramHandle('..Émerson.Óliver..'), 'emerson.oliver');
    assert.strictEqual(sanitizeInstagramHandle('João_Da_Silva!@#'), 'joao_da_silva');
    assert.strictEqual(sanitizeInstagramHandle('a..b...c'), 'a.b.c');
    assert.strictEqual(sanitizeInstagramHandle('.test.'), 'test');

    // 30 chars truncation
    const long = 'this_is_a_very_long_instagram_username_that_exceeds_limits';
    const sanitizedLong = sanitizeInstagramHandle(long);
    assert.ok(sanitizedLong.length <= 30);
    assert.strictEqual(isValidInstagramHandle(sanitizedLong), true);
  });
});

describe('Instagram Engine: Matcher (Probabilistic Correlation)', () => {
  test('calculates exact email match score (40 points max)', () => {
    const target = { email: 'carlos.silva@gmail.com' };
    
    // Perfect email match: first char 'c', last char 'a', exact user length 12 ('carlos.silva' is 12, 'c**********a' is 12), domain 'g****.com'
    const discovered = {
      maskedEmail: 'c**********a@g****.com'
    };

    const res = calculateMatchScore(target, discovered);
    assert.strictEqual(res.breakdown.email.score, 40);
    assert.strictEqual(res.breakdown.email.passedChecks.length, 4);
  });

  test('calculates partial email match when length differs', () => {
    const target = { email: 'carlos@gmail.com' }; // length 6
    const discovered = { maskedEmail: 'c********s@g****.com' }; // length 10

    const res = calculateMatchScore(target, discovered);
    // first letter 'c' (+10), last letter 's' (+10), domain (+10) -> 30 pts (length failed)
    assert.strictEqual(res.breakdown.email.score, 30);
  });

  test('calculates phone match score (30 points max)', () => {
    const target = { phone: '+55 (11) 98765-4321' };
    const discovered = { maskedPhone: '+55 ** *****-4321' };

    const res = calculateMatchScore(target, discovered);
    // DDI +55 (+8) + Last 4 digits (+22) = 30 pts
    assert.strictEqual(res.breakdown.phone.score, 30);
  });

  test('calculates full name match score (20 points max)', () => {
    const target = { nome: 'Carlos Eduardo da Silva' };
    
    // 100% identical
    const exactMatch = calculateMatchScore(target, { fullName: 'Carlos Eduardo da Silva' });
    assert.strictEqual(exactMatch.breakdown.name.score, 20);

    // First and last match (middle omitted)
    const firstLastMatch = calculateMatchScore(target, { fullName: 'Carlos Silva' });
    assert.strictEqual(firstLastMatch.breakdown.name.score, 16);

    // Only first name match
    const firstOnlyMatch = calculateMatchScore(target, { fullName: 'Carlos Oliveira' });
    assert.strictEqual(firstOnlyMatch.breakdown.name.score, 10);
  });

  test('calculates handle root match score (10 points)', () => {
    const target = { nome: 'Carlos Silva' };
    const res = calculateMatchScore(target, { handle: 'carlos.silva.adv' });
    assert.strictEqual(res.breakdown.handle.score, 10);
  });

  test('classifies certainty correctly: HIGH (>=75%), MEDIUM (45-74%), LOW (<45%)', () => {
    // High match (Email 40 + Phone 30 + Name 16 + Handle 10 = 96%)
    const high = calculateMatchScore(
      { email: 'carlos.silva@gmail.com', phone: '+55 11 98765-4321', nome: 'Carlos Silva' },
      { maskedEmail: 'c**********a@g****.com', maskedPhone: '+55 ** *****-4321', fullName: 'Carlos Silva', handle: 'carlossilva' }
    );
    assert.ok(high.score >= 75);
    assert.strictEqual(high.certainty, 'HIGH');

    // Medium match (Name 16 + Handle 10 + Phone 30 = 56%)
    const medium = calculateMatchScore(
      { phone: '+55 11 98765-4321', nome: 'Carlos Silva' },
      { maskedPhone: '+55 ** *****-4321', fullName: 'Carlos Silva', handle: 'carlossilva' }
    );
    assert.ok(medium.score >= 45 && medium.score < 75);
    assert.strictEqual(medium.certainty, 'MEDIUM');

    // Low match (Only First Name = 10%)
    const low = calculateMatchScore(
      { nome: 'Carlos Silva' },
      { fullName: 'Carlos Drummond', handle: 'carlos_poeta' }
    );
    assert.ok(low.score < 45);
    assert.strictEqual(low.certainty, 'LOW');
  });
});

describe('Instagram Engine: Extractor (Forensic Intelligence)', () => {
  test('estimates account creation age from Meta PK chronological ranges', () => {
    // Early adopter (< 25M)
    const early = estimateAccountAge('1524312');
    assert.strictEqual(early.estimatedYears, '2010 - 2012');
    assert.strictEqual(early.isEarlyAdopter, true);

    // 2013-2014 era (~500M)
    const growth = estimateAccountAge('502419082');
    assert.strictEqual(growth.estimatedYears, '2013 - 2014');

    // 2017-2019 era (~10B)
    const midEra = estimateAccountAge('10500123456');
    assert.strictEqual(midEra.estimatedYears, '2017 - 2019');

    // Recent accounts (> 55B)
    const recent = estimateAccountAge('62000000000');
    assert.strictEqual(recent.estimatedYears, '2023 - 2026');
    assert.strictEqual(recent.isEarlyAdopter, false);
  });

  test('extracts WhatsApp, Pix, commercial emails, and @mentions from bio text', () => {
    const sampleBio = `
      Advogado especialista em Direito Digital.
      WhatsApp: (11) 98765-4321 ou wa.me/5511999998888
      Chave Pix (CPF): 123.456.789-00
      Pix CNPJ: 12.345.678/0001-90
      EVP: a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d
      Contato comercial: contato@carlossilva.adv.br
      Sócio fundador em @escritorio_silva
      Site oficial: https://carlossilva.adv.br e linktr.ee/carlossilva
    `;

    const entities = extractBioEntities(sampleBio);

    // WhatsApp
    assert.ok(entities.whatsapp.includes('5511999998888'));
    assert.ok(entities.whatsapp.includes('5511987654321'));

    // Pix
    assert.ok(entities.pix.cpfs.includes('12345678900'));
    assert.ok(entities.pix.cnpjs.includes('12345678000190'));
    assert.ok(entities.pix.evp.includes('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'));

    // Emails
    assert.ok(entities.emails.includes('contato@carlossilva.adv.br'));

    // Mentions
    assert.ok(entities.mentions.includes('escritorio_silva'));

    // External links
    assert.ok(entities.links.includes('https://carlossilva.adv.br'));
    assert.ok(entities.links.includes('https://linktr.ee/carlossilva'));
  });

  test('generates 1-click reverse image search URLs', () => {
    const avatar = 'https://scontent.cdninstagram.com/v/t51/avatar.jpg';
    const rev = generateReverseImageSearchUrls(avatar);

    assert.ok(rev.googleLens.includes('lens.google.com/uploadbyurl'));
    assert.ok(rev.yandex.includes('yandex.com/images/search'));
    assert.ok(rev.bing.includes('bing.com/images/search'));
    assert.ok(rev.tineye.includes('tineye.com/search'));
  });

  test('generates cross-social verification links', () => {
    const links = generateCrossSocialLinks('torvalds');
    assert.strictEqual(links.threads, 'https://www.threads.net/@torvalds');
    assert.strictEqual(links.tiktok, 'https://www.tiktok.com/@torvalds');
    assert.strictEqual(links.twitter, 'https://x.com/torvalds');
    assert.strictEqual(links.github, 'https://github.com/torvalds');
    assert.strictEqual(links.linkedin, 'https://www.linkedin.com/in/torvalds');
    assert.strictEqual(links.youtube, 'https://www.youtube.com/@torvalds');
  });
});

describe('Instagram Engine: Full Investigation Pipeline', () => {
  test('executes end-to-end investigation with mocked reconnaissance profiles', async () => {
    const mockData = {
      'carlos.silva.adv': {
        id: '1520034',
        username: 'carlos.silva.adv',
        fullName: 'Carlos Eduardo da Silva',
        biography: 'Advogado OAB/SP 12345. Contato: (11) 98765-4321',
        avatarUrl: 'https://cdn.instagram.com/avatar1.jpg',
        isPrivate: false,
        isVerified: true,
        followers: 12500,
        following: 430,
        postsCount: 154,
        externalUrl: 'https://carlossilva.adv.br'
      }
    };

    const mockRecovery = {
      'carlos.silva.adv': {
        maskedEmail: 'c**********a@g****.com',
        maskedPhone: '+55 ** *****-4321'
      }
    };

    const investigation = await investigateInstagram({
      nome: 'Carlos Eduardo da Silva',
      profissao: 'adv',
      email: 'carlos.silva@gmail.com',
      telefone: '+55 11 98765-4321',
      limitePermutacoes: 25
    }, {
      concurrency: 5,
      timeout: 1000,
      mockData,
      mockRecovery
    });

    assert.strictEqual(investigation.target.nome, 'Carlos Eduardo da Silva');
    assert.ok(investigation.totalPermutations > 0);
    assert.strictEqual(investigation.foundCount, 1);

    const hit = investigation.matches[0];
    assert.strictEqual(hit.handle, 'carlos.silva.adv');
    assert.strictEqual(hit.match.certainty, 'HIGH');
    assert.ok(hit.match.score >= 90);
    assert.strictEqual(hit.forensics.estimatedAge.isEarlyAdopter, true);
    assert.ok(hit.forensics.bioEntities.whatsapp.includes('5511987654321'));
    assert.ok(hit.forensics.reverseImageSearch.googleLens.length > 0);
  });

  test('InstagramEngine class provides structured OOP access', () => {
    const engine = new InstagramEngine({ timeout: 5000 });
    const perms = engine.generatePermutations({ nome: 'Ana Paula Souza' });
    assert.ok(perms.length > 0);
    assert.ok(perms.includes('ana.souza'));
  });

  test('parses Instagram HTML markup accurately without false negatives', async () => {
    const { parseInstagramHtml, generateInstagramSignature } = await import('../src/modules/instagram/recon.js');

    const sampleHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="og:title" content="National Geographic (&#064;natgeo) &#x2022; Instagram photos and videos" />
        <meta property="og:description" content="268M Followers, 196 Following, 32K Posts - See Instagram photos and videos from National Geographic (&#064;natgeo)" />
        <meta property="og:image" content="https://scontent.cdninstagram.com/avatar_hd.jpg" />
      </head>
      <body>
        <script>{"props":{"id":"787132"},"biography":"Step into wonder \\ud83c\\udf0e","is_verified":true,"is_private":false}</script>
      </body>
      </html>
    `;

    const parsed = parseInstagramHtml(sampleHtml, 'natgeo');
    assert.strictEqual(parsed.exists, true);
    assert.strictEqual(parsed.profile.fullName, 'National Geographic');
    assert.strictEqual(parsed.profile.followers, 268000000);
    assert.strictEqual(parsed.profile.following, 196);
    assert.strictEqual(parsed.profile.postsCount, 32000);
    assert.strictEqual(parsed.profile.id, '787132');
    assert.strictEqual(parsed.profile.avatarUrl, 'https://scontent.cdninstagram.com/avatar_hd.jpg');
    assert.ok(parsed.profile.biography.includes('Step into wonder'));
    assert.strictEqual(parsed.profile.isVerified, true);
    assert.strictEqual(parsed.profile.isPrivate, false);

    // Test signature generation
    const sig = generateInstagramSignature(JSON.stringify({ q: 'natgeo' }));
    assert.ok(sig.startsWith('ig_sig_key_version=4&signed_body='));
  });

  test('probes direct handle/nick immediately with 1 single candidate when username is specified', async () => {
    const mockData = {
      'rafaeltoniato.adv': {
        id: '54088204289',
        username: 'rafaeltoniato.adv',
        fullName: 'Rafael Toniato',
        biography: 'Advocacia e Consultoria Juridica contato@toniato.adv.br',
        avatarUrl: 'https://cdn.instagram.com/avatar.jpg',
        followers: 796,
        following: 1453,
        postsCount: 116,
        isPrivate: false,
        isVerified: true
      }
    };

    const res = await investigateInstagram({
      username: 'rafaeltoniato.adv',
      email: 'contato@toniato.adv.br'
    }, {
      mockData
    });

    assert.strictEqual(res.totalPermutations, 1);
    assert.strictEqual(res.checkedCount, 1);
    assert.strictEqual(res.foundCount, 1);
    assert.strictEqual(res.matches[0].handle, 'rafaeltoniato.adv');
    assert.strictEqual(res.matches[0].profile.fullName, 'Rafael Toniato');
    assert.ok(res.matches[0].forensics.bioEntities.emails.includes('contato@toniato.adv.br'));
    // Email match with bio
    assert.ok(res.matches[0].match.breakdown.email.score === 40);
    assert.strictEqual(res.emailFilterActive, true);
    assert.strictEqual(res.emailFilteredMatches.length, 1);
  });

  test('matcher correlates public bio email and handles correctly', () => {
    const score = calculateMatchScore(
      { email: 'advogado@justica.com.br' },
      {
        handle: 'advogado.silva',
        bioEmails: ['advogado@justica.com.br'],
        fullName: 'Dr Silva'
      }
    );

    assert.strictEqual(score.breakdown.email.score, 40);
    assert.ok(score.score >= 50);
    assert.ok(score.certainty === 'MEDIUM' || score.certainty === 'HIGH');
  });
});

