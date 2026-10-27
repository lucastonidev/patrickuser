#!/usr/bin/env node

/**
 * @file bin/patrickuser.js - CLI Executable Entrypoint
 */
import { runCli } from '../src/cli/index.js';

runCli().catch((err) => {
  console.error('[!] Fatal error:', err);
  process.exit(1);
});
