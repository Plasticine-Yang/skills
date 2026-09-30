#!/usr/bin/env node
// Changesets owns package.json's version; every installation group shares it.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const path = join(root, '.claude-plugin/marketplace.json');
const manifest = JSON.parse(readFileSync(path, 'utf8'));
const lockPath = join(root, 'package-lock.json');
const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
if (!Array.isArray(manifest.plugins) || manifest.plugins.length === 0) {
  throw new Error('marketplace.json must declare at least one installation group');
}

const mismatches = [];
if (lock.version !== version || lock.packages?.['']?.version !== version) {
  mismatches.push('package-lock.json version');
}
if (manifest.metadata?.version !== version) mismatches.push('metadata.version');
for (const plugin of manifest.plugins) {
  if (plugin.version !== version) mismatches.push(`${plugin.name}.version`);
}
if (mismatches.length === 0) {
  console.log(`Marketplace and group versions match package.json (${version}).`);
} else if (process.argv.includes('--check')) {
  console.error(`Version mismatch: ${mismatches.join(', ')}. Run node scripts/sync-plugin-version.mjs.`);
  process.exitCode = 1;
} else {
  manifest.metadata ??= {};
  manifest.metadata.version = version;
  for (const plugin of manifest.plugins) plugin.version = version;
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
  lock.version = version;
  lock.packages[''].version = version;
  writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  console.log(`Synchronized marketplace, group, and lockfile versions to ${version}.`);
}
