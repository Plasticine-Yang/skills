#!/usr/bin/env node
// Exercise the actual installer in disposable project directories, never globally.
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cli = join(root, 'node_modules/skills/bin/cli.mjs');
const marketplace = JSON.parse(await readFile(join(root, '.claude-plugin/marketplace.json'), 'utf8'));
const sandbox = await mkdtemp(join(tmpdir(), 'plasticine-skills-install-'));

function run(args, cwd) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    env: { ...process.env, CI: '1', NO_COLOR: '1', DISABLE_TELEMETRY: '1' },
    encoding: 'utf8',
    timeout: 60_000,
  });
  assert(!result.error, result.error?.message);
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.replace(/\u001b\[[0-9;]*m/g, '');
  assert.equal(result.status, 0, `Installer failed:\n${output}`);
  return output;
}

async function compareTree(source, installed) {
  const sourceEntries = await readdir(source, { withFileTypes: true });
  assert.deepEqual((await readdir(installed)).sort(), sourceEntries.map((e) => e.name).sort());
  for (const entry of sourceEntries) {
    const from = join(source, entry.name);
    const to = join(installed, entry.name);
    if (entry.isDirectory()) await compareTree(from, to);
    else assert.deepEqual(await readFile(to), await readFile(from), `Installed file differs: ${to}`);
  }
}

try {
  const listed = run(['add', root, '--list'], sandbox);
  for (const plugin of marketplace.plugins) {
    const title = plugin.name.split('-').map((s) => s[0].toUpperCase() + s.slice(1)).join(' ');
    assert(listed.includes(title), `Installer omitted group ${title}`);
    for (const skillPath of plugin.skills) {
      const source = resolve(root, plugin.source, skillPath);
      const name = basename(source);
      assert(listed.includes(name), `Installer omitted ${name}`);
      const project = await mkdtemp(join(sandbox, 'project-'));
      run(['add', root, '--skill', name, '--agent', 'codex', '--copy', '--yes'], project);
      const installedRoot = join(project, '.agents/skills');
      assert.deepEqual(await readdir(installedRoot), [name], 'Single-skill install included unexpected skills');
      await compareTree(source, join(installedRoot, name));
      console.log(`Installed ${name}: all files and license match.`);
    }
  }
  console.log('Installer grouping and independent skill installs passed.');
} finally {
  await rm(sandbox, { recursive: true, force: true });
}
