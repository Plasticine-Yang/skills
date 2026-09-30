#!/usr/bin/env node
// Audit the initial migration snapshot. Intentional later edits may differ from it.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const upstream = JSON.parse(await readFile(join(root, 'docs/upstream.json'), 'utf8'));
let identical = 0;
let adapted = 0;
for (const entry of upstream.files) {
  const hash = createHash('sha256').update(await readFile(join(root, entry.path))).digest('hex');
  assert.equal(hash, entry.importedSha256, `Changed since initial migration: ${entry.path}`);
  if (hash === entry.upstreamSha256) identical++;
  else {
    adapted++;
    console.log(`Adapted: ${entry.path}`);
  }
}
console.log(`Initial migration from ${upstream.commit}: ${identical} byte-identical files, ${adapted} adapted files.`);
