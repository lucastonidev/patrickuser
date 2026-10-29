/**
 * @file cli/index.js - CLI Command Handler
 */
import { parseArgs } from 'node:util';
import { huntUsername, getSites, getCategories } from '../core/engine.js';
import { investigateInstagram } from '../modules/instagram/index.js';
import { getBanner, appVersion } from './banner.js';
import { c } from './colors.js';
import { ProgressBar } from './progress.js';
import { printHit, printSummary, printInstagramHit, printInstagramSummary } from './table.js';
import { formatJson, formatCsv, formatMarkdown, saveToFile } from './exporter.js';
import { startServer } from '../server/index.js';

const HELP_TEXT = `
${c.gold('Usage:')}
  patrickuser <username> [options]
  rimuuser insta --nome <name> [options]
  npx patrickuser <username> [options]

${c.gold('General OSINT Options:')}
  -c, --category <list>     Filter by comma-separated categories (e.g. tech,social,brasil)
  -s, --site <list>         Filter by specific platform names (e.g. github,reddit,steam)
  -e, --exclude <list>      Exclude specific platform names
  --concurrency <number>    Max simultaneous network requests (default: 20)
  --timeout <ms>            Request timeout in milliseconds (default: 10000)
  --no-metadata             Disable OpenGraph and profile metadata extraction
  -o, --output <file>       Save report to file (.json, .csv, .md, .txt)
  --json                    Output pure JSON to stdout
  --csv                     Output CSV format
  --md                      Output Markdown report
  --server                  Start micro-API server with Server-Sent Events (SSE)
  -p, --port <number>       Server port when running --server (default: 3000)
  --list-sites              List all available platforms and exit
  --list-categories         List all platform categories and exit
  -h, --help                Show this mentalist guide and exit
  -v, --version             Show version and exit

${c.gold('Instagram Engine Options (insta / instagram):')}
  --nome, -n <string>       Target full or partial name (e.g. "Carlos Silva")
  --prof <string>           Profession or segment (e.g. adv, med, psi, dev)
  --email, -m <email>       Suspected email to correlate with obfuscated mask
  --telefone, -t <phone>    Suspected phone to correlate with obfuscated mask
  --username, -u <handle>   Direct Instagram username to probe
  --ano <year>              Birth year for permutation generation (e.g. 1990)
  --cidade <city>           City or state abbreviation (e.g. SP, Rio)
  --limit, -l <number>      Max permutations to scan (default: 40)
  --session <id>            Optional Instagram sessionid cookie

${c.gold('Examples:')}
  npx patrickuser john_doe
  npx patrickuser lucas --category tech,brasil
  rimuuser insta --nome "Carlos Silva" --prof adv --email "carlos@gmail.com"
  rimuuser insta --nome "Lucas Pereira" --telefone "+55 11 98765-4321" --json
  npx patrickuser --server -p 8080
`;

export async function runCli(argv = process.argv.slice(2)) {
  const optionsConfig = {
    category: { type: 'string', short: 'c' },
    site: { type: 'string', short: 's' },
    exclude: { type: 'string', short: 'e' },
    concurrency: { type: 'string' },
    timeout: { type: 'string' },
    'no-metadata': { type: 'boolean' },
    output: { type: 'string', short: 'o' },
    json: { type: 'boolean' },
    csv: { type: 'boolean' },
    md: { type: 'boolean' },
    server: { type: 'boolean' },
    port: { type: 'string', short: 'p' },
    'list-sites': { type: 'boolean' },
    'list-categories': { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },

    // Instagram Engine flags
    nome: { type: 'string', short: 'n' },
    name: { type: 'string' },
    prof: { type: 'string' },
    profissao: { type: 'string' },
    profession: { type: 'string' },
    email: { type: 'string', short: 'm' },
    telefone: { type: 'string', short: 't' },
    phone: { type: 'string' },
    username: { type: 'string', short: 'u' },
    handle: { type: 'string' },
    limit: { type: 'string', short: 'l' },
    ano: { type: 'string' },
    year: { type: 'string' },
    cidade: { type: 'string' },
    city: { type: 'string' },
    session: { type: 'string' }
  };

  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: optionsConfig,
      allowPositionals: true
    });
  } catch (err) {
    console.error(`${c.redJohn('Error:')} ${err.message}`);
    console.log(HELP_TEXT);
    process.exit(1);
  }

  const { values, positionals } = parsed;

  if (values.help) {
    console.log(getBanner());
    console.log(HELP_TEXT);
    return;
  }

  if (values.version) {
    console.log(`patrickuser v${appVersion} (Native ESM)`);
    return;
  }

  if (values['list-categories']) {
    console.log(c.gold('\nSupported Investigation Categories:'));
    for (const cat of getCategories()) {
      console.log(`  ${c.cyan('•')} ${cat}`);
    }
    console.log();
    return;
  }

  if (values['list-sites']) {
    console.log(c.gold('\nSupported Investigation Platforms:'));
    const sites = getSites();
    for (const s of sites) {
      console.log(`  ${c.cyan('•')} ${c.bold(s.name.padEnd(20, ' '))} ${c.dim(`[${s.category}]`)} ${s.hasAdapter ? c.neonGreen('(Rich Adapter)') : ''}`);
    }
    console.log(`\nTotal: ${sites.length} platforms\n`);
    return;
  }

  // Server mode
  if (values.server) {
    const port = values.port ? parseInt(values.port, 10) : 3000;
    startServer(port);
    return;
  }

  // Instagram Engine Subcommand Mode (insta / instagram or --nome flag)
  const isInsta = positionals[0] === 'insta' || positionals[0] === 'instagram' || Boolean(values.nome || values.name);
  if (isInsta) {
    const isSilentJson = Boolean(values.json && !values.output);
    const targetNome = values.nome || values.name || (positionals[0] !== 'insta' && positionals[0] !== 'instagram' ? positionals[0] : (positionals[1] || ''));
    const targetProf = values.prof || values.profissao || values.profession || '';
    const targetEmail = values.email || '';
    const targetPhone = values.telefone || values.phone || '';
    const targetUsername = values.username || values.handle || '';
    const targetLimit = values.limit ? parseInt(values.limit, 10) : 40;
    const concurrency = values.concurrency ? parseInt(values.concurrency, 10) : 10;
    const timeout = values.timeout ? parseInt(values.timeout, 10) : 6000;

    if (!targetNome && !targetUsername && !targetEmail && !targetPhone) {
      if (!isSilentJson) console.log(getBanner());
      console.error(`\n${c.redJohn('Parâmetros insuficientes:')} Forneça ao menos --nome, --username, --email ou --telefone para investigar no Instagram.`);
      console.log(`\n${c.gold('Exemplo:')}\n  rimuuser insta --nome "Carlos Silva" --prof adv --email "carlos@gmail.com"\n`);
      process.exit(1);
    }

    if (!isSilentJson) {
      console.log(getBanner());
      console.log(`\n ${c.badgeGold('INSTAGRAM RECON (YESITSME ENGINE)')} ${c.bold(c.white(targetNome || targetUsername))} ${c.dim('— Gerando permutações e coletando dados públicos...')}\n`);
      if (targetProf) console.log(`   ${c.dim('• Profissão/Segmento:')} ${c.amber(targetProf)}`);
      if (targetEmail) console.log(`   ${c.dim('• Email Alvo:')} ${c.cyan(targetEmail)}`);
      if (targetPhone) console.log(`   ${c.dim('• Telefone Alvo:')} ${c.gold(targetPhone)}`);
      console.log();
    }

    let progressBar = null;
    try {
      const result = await investigateInstagram({
        nome: targetNome,
        profissao: targetProf,
        email: targetEmail,
        telefone: targetPhone,
        username: targetUsername,
        anoNascimento: values.ano || values.year,
        cidade: values.cidade || values.city,
        limitePermutacoes: targetLimit
      }, {
        concurrency,
        timeout,
        sessionId: values.session,
        onCandidateChecked: (item, stats) => {
          if (!isSilentJson) {
            if (!progressBar) progressBar = new ProgressBar(stats.total);
            progressBar.update(stats, `@${item.handle}`);
          }
        },
        onMatchFound: (hit) => {
          if (!isSilentJson) {
            if (progressBar) progressBar.clear();
            printInstagramHit(hit);
          }
        }
      });

      if (progressBar && !isSilentJson) progressBar.clear();

      if (isSilentJson) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printInstagramSummary(result);
      }

      if (values.output) {
        await saveToFile(values.output, JSON.stringify(result, null, 2));
        if (!isSilentJson) {
          console.log(` ${c.neonGreen('✔')} ${c.dim('Relatório forense salvo em:')} ${c.bold(c.white(values.output))}\n`);
        }
      }
    } catch (err) {
      if (progressBar) progressBar.clear();
      console.error(`\n${c.redJohn('Error:')} ${err.message}`);
      process.exit(1);
    }

    return;
  }

  const username = positionals[0];
  if (!username) {
    console.log(getBanner());
    console.error(`\n${c.redJohn('Missing target:')} Please specify a username to observe.`);
    console.log(HELP_TEXT);
    process.exit(1);
  }

  const isSilentJson = Boolean(values.json && !values.output);

  if (!isSilentJson) {
    console.log(getBanner());
    console.log(`\n ${c.badgeGold('TARGET')} ${c.bold(c.white(username))} ${c.dim('— Initiating observation pool...')}\n`);
  }

  const categories = values.category ? values.category.split(',').map((s) => s.trim()) : undefined;
  const siteFilter = values.site ? values.site.split(',').map((s) => s.trim()) : undefined;
  const excludeFilter = values.exclude ? values.exclude.split(',').map((s) => s.trim()) : undefined;
  const concurrency = values.concurrency ? parseInt(values.concurrency, 10) : 20;
  const timeout = values.timeout ? parseInt(values.timeout, 10) : 10000;
  const extractMetadata = !values['no-metadata'];

  let progressBar = null;

  try {
    const huntPromise = huntUsername(username, {
      concurrency,
      timeout,
      categories,
      sites: siteFilter,
      exclude: excludeFilter,
      extractMetadata,
      onFound: (hit) => {
        if (!isSilentJson) {
          if (progressBar) progressBar.clear();
          printHit(hit);
        }
      },
      onChecked: (res, stats) => {
        if (!isSilentJson) {
          if (!progressBar) {
            progressBar = new ProgressBar(stats.total);
          }
          progressBar.update(stats, res.site);
        }
      }
    });

    const result = await huntPromise;

    if (progressBar && !isSilentJson) {
      progressBar.clear();
    }

    if (isSilentJson) {
      console.log(formatJson(username, result.results, result.durationMs));
    } else {
      printSummary(username, result.results, result.durationMs);
    }

    // Export handlers
    if (values.output) {
      const outPath = values.output;
      let content = '';
      if (outPath.endsWith('.json') || values.json) {
        content = formatJson(username, result.results, result.durationMs);
      } else if (outPath.endsWith('.csv') || values.csv) {
        content = formatCsv(username, result.results);
      } else if (outPath.endsWith('.md') || values.md) {
        content = formatMarkdown(username, result.results, result.durationMs);
      } else {
        // Plain text list of URLs
        const found = result.results.filter((r) => r.exists);
        content = found.map((r) => `${r.site}: ${r.url}`).join('\n') + '\n';
      }

      await saveToFile(outPath, content);
      if (!isSilentJson) {
        console.log(` ${c.neonGreen('✔')} ${c.dim('Report saved to:')} ${c.bold(c.white(outPath))}\n`);
      }
    } else {
      if (values.csv && !isSilentJson) {
        console.log(formatCsv(username, result.results));
      }
      if (values.md && !isSilentJson) {
        console.log(formatMarkdown(username, result.results, result.durationMs));
      }
    }
  } catch (err) {
    if (progressBar) progressBar.clear();
    console.error(`\n${c.redJohn('Error:')} ${err.message}`);
    process.exit(1);
  }
}

