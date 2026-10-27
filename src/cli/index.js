/**
 * @file cli/index.js - CLI Command Handler
 */
import { parseArgs } from 'node:util';
import { huntUsername, getSites, getCategories } from '../core/engine.js';
import { getBanner } from './banner.js';
import { c } from './colors.js';
import { ProgressBar } from './progress.js';
import { printHit, printSummary } from './table.js';
import { formatJson, formatCsv, formatMarkdown, saveToFile } from './exporter.js';
import { startServer } from '../server/index.js';

const HELP_TEXT = `
${c.gold('Usage:')}
  patrickuser <username> [options]
  npx patrickuser <username> [options]

${c.gold('Options:')}
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

${c.gold('Examples:')}
  npx patrickuser john_doe
  npx patrickuser lucas --category tech,brasil
  npx patrickuser alice -o alice-report.md
  npx patrickuser target --json > target.json
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
    version: { type: 'boolean', short: 'v' }
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
    console.log('patrickuser v1.0.0 (Native ESM)');
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
