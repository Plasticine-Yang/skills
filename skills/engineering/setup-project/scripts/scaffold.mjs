#!/usr/bin/env node
// Create missing configuration only. Existing documents require semantic merging by the agent.
import { lstat, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const skillRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const documents = [
  ['AGENTS.md', 'agents.md'],
  ['docs/agents/issue-tracker.md', 'issue-tracker.md'],
  ['docs/agents/triage-labels.md', 'triage-labels.md'],
  ['docs/agents/domain.md', 'domain.md'],
];

async function readOptional(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function safeTarget(root, path) {
  const target = resolve(root, path);
  if (!target.startsWith(root + sep)) throw new Error(`Target escapes project: ${path}`);
  let current = root;
  for (const part of relative(root, target).split(sep)) {
    current = join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink()) {
        throw new Error(`Merge this symlinked target manually: ${relative(root, current)}`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return target;
}

function git(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], {
    encoding: 'utf8', timeout: 10_000, windowsHide: true,
  });
  if (result.error || result.status !== 0) return null;
  return result.stdout;
}

async function installedSkills(root) {
  const found = new Set();
  for (const base of ['.agents/skills', '.claude/skills', '.codex/skills', '.opencode/skills']) {
    let entries;
    try {
      entries = await readdir(join(root, base), { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
      if (await readOptional(join(root, base, entry.name, 'SKILL.md')) !== null) found.add(entry.name);
    }
  }
  return [...found].sort();
}

export function isTaskRecord(path) {
  return /^\.[sS]cratch\/[^/]+\/(?:spec\.md|map\.md|issues\/\d{2}-[^/]+\.md)$/.test(path);
}

export async function scaffoldProject(projectRoot, { write = false } = {}) {
  const root = await realpath(resolve(projectRoot));
  if (!(await lstat(root)).isDirectory()) throw new Error('Project root must be a directory.');
  const plans = [];
  for (const [path, template] of documents) {
    const target = await safeTarget(root, path);
    const existing = await readOptional(target);
    const content = await readFile(join(skillRoot, 'templates', template), 'utf8');
    plans.push({ path, target, content, action: existing === null ? 'create'
      : existing.replaceAll('\r\n', '\n') === content ? 'present' : 'merge-required' });
  }

  const ignoreTarget = await safeTarget(root, '.gitignore');
  const existingIgnore = await readOptional(ignoreTarget);
  const ignore = await readFile(join(skillRoot, 'templates/gitignore.txt'), 'utf8');
  const normalizedIgnore = (existingIgnore ?? '').replaceAll('\r\n', '\n');
  const markers = normalizedIgnore.match(/^# setup-project:(?:start|end)$/gm) ?? [];
  const ignoreAction = markers.length === 0 ? 'append'
    : markers.length === 2 && normalizedIgnore.includes(ignore.trim()) ? 'present' : 'merge-required';
  const newline = existingIgnore?.includes('\r\n') ? '\r\n' : '\n';
  const prefix = existingIgnore === null || existingIgnore === '' ? ''
    : existingIgnore + (existingIgnore.endsWith('\n') ? newline : newline + newline);
  plans.push({ path: '.gitignore', target: ignoreTarget,
    content: prefix + ignore.replaceAll('\n', newline), action: ignoreAction });

  const gitRoot = git(root, ['rev-parse', '--show-toplevel'])?.trim();
  if (gitRoot && await realpath(gitRoot) !== root) {
    throw new Error(`Use the Git repository root: ${gitRoot}`);
  }
  const tracked = gitRoot ? git(root, ['ls-files', '-z']) : '';
  if (gitRoot && tracked === null) throw new Error('Unable to inspect tracked files.');
  const trackedPaths = (tracked ?? '').split('\0').filter(Boolean);
  const reviewTracked = trackedPaths.filter((path) =>
    (/^\.[sS]cratch\//.test(path) && !isTaskRecord(path))
      || /^(?:\.agent-tmp|\.worktrees)\//.test(path));
  const report = {
    root, gitRepository: Boolean(gitRoot),
    files: plans.map(({ path, action }) => ({ path, action })),
    installedSkills: await installedSkills(root),
    reviewTracked,
    changed: [],
  };

  // All paths and input files are checked before the first write.
  if (write) {
    for (const plan of plans) {
      if (!['create', 'append'].includes(plan.action)) continue;
      await mkdir(dirname(plan.target), { recursive: true });
      await writeFile(plan.target, plan.content, { flag: plan.action === 'create' ? 'wx' : 'w' });
      report.changed.push(plan.path);
    }
  }
  return report;
}

if (process.argv[1] && await realpath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    let projectRoot = process.cwd();
    let write = false;
    for (let index = 0; index < args.length; index++) {
      if (args[index] === '--repo') {
        projectRoot = args[++index];
        if (!projectRoot || projectRoot.startsWith('--')) throw new Error('--repo requires a path.');
      } else if (args[index] === '--write') write = true;
      else if (args[index] === '--help') {
        console.log('Usage: node scaffold.mjs [--repo <project-root>] [--write]\nDefault: report only; --write creates missing files and appends the first ignore block.');
        process.exit(0);
      } else throw new Error(`Unknown option: ${args[index]}`);
    }
    console.log(JSON.stringify(await scaffoldProject(projectRoot, { write }), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
