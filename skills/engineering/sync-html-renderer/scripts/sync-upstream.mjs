#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { promisify } from 'node:util';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const execute = promisify(execFile);
const repository = 'QingYunA/answer-me-with-html';
const sourceUrl = `https://github.com/${repository}.git`;
const skillPath = 'skills/answer-me/answer-me-with-html-renderer';
const bundlePath = 'skills/answer-me-with-html/scripts/am.mjs';
const imports = [
  [bundlePath, 'scripts/upstream/am.mjs'],
  ['examples/tcp.md', 'references/example.md'],
  ['examples/video-tcp.md', 'references/video-example.md'],
  ['LICENSE', 'LICENSE'],
];
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const run = async (binary, args, cwd) => (await execute(binary, args, {
  cwd, encoding: 'utf8', timeout: 120_000, maxBuffer: 16 * 1024 * 1024,
})).stdout;
const git = (checkout, args) => run('git', args, checkout);
const show = (checkout, commit, path) => git(checkout, ['show', `${commit}:${path}`]);

function field(text, pattern, label) {
  const match = text.match(pattern);
  if (!match) throw new Error(`来源记录缺少 ${label}`);
  return match[1];
}

export function runtimeDependencies(lock) {
  return Object.fromEntries(Object.entries(lock.packages)
    .filter(([path, pkg]) => path && !pkg.dev)
    .map(([path, pkg]) => [path, { version: pkg.version, integrity: pkg.integrity, license: pkg.license }]));
}

export async function inspect(root, checkout, ref) {
  if (!/^v\d+\.\d+\.\d+$/.test(ref)) throw new Error('只接受正式版本 tag：vX.Y.Z');
  const provenance = await readFile(join(root, skillPath, 'UPSTREAM.md'), 'utf8');
  const from = {
    commit: field(provenance, /固定 commit：`([a-f0-9]{40})`/, 'commit'),
    version: field(provenance, /上游 package 版本：`(\d+\.\d+\.\d+)`/, 'version'),
    sha256: field(provenance, /CLI SHA-256：`([a-f0-9]{64})`/, 'sha256'),
  };
  const current = await readFile(join(root, skillPath, 'scripts/upstream/am.mjs'));
  if (digest(current) !== from.sha256) throw new Error('本地 CLI 与来源摘要不符，先检查定制或损坏');
  const commit = (await git(checkout, ['rev-parse', '--verify', `${ref}^{commit}`])).trim();
  const pkg = JSON.parse(await show(checkout, commit, 'package.json'));
  if (`v${pkg.version}` !== ref) throw new Error('tag 与 package 版本不一致');
  await git(checkout, ['merge-base', '--is-ancestor', from.commit, commit]);
  const to = { ref, commit, version: pkg.version, sha256: digest(await show(checkout, commit, bundlePath)) };
  const before = JSON.parse(await show(checkout, from.commit, 'package-lock.json'));
  const after = JSON.parse(await show(checkout, commit, 'package-lock.json'));
  return {
    repository, from, to,
    unchanged: from.commit === commit,
    dependenciesChanged: JSON.stringify(runtimeDependencies(before)) !== JSON.stringify(runtimeDependencies(after)),
    changedFiles: (await git(checkout, ['diff', '--name-only', from.commit, commit])).trim().split('\n').filter(Boolean),
  };
}

function replaceOnce(text, before, after, label) {
  if (text.split(before).length !== 2) throw new Error(`${label} 的来源字段不唯一，需合并记录`);
  return text.replace(before, after);
}

export async function applyPlan(root, checkout, plan) {
  const fresh = await inspect(root, checkout, plan.to.ref);
  if (JSON.stringify(fresh) !== JSON.stringify(plan)) throw new Error('上游或本地来源已变化，请重新 prepare');
  if (plan.unchanged) return [];
  if (plan.dependenciesChanged) throw new Error('运行依赖变化：先核对打包依赖与许可，再按 UPSTREAM.md 手动移植');
  const files = new Map();
  for (const [source, target] of imports) {
    const path = join(root, skillPath, target);
    const before = await show(checkout, plan.from.commit, source);
    const local = await readFile(path, 'utf8');
    if (local !== before) throw new Error(`${target} 有本地定制，先完成三方合并`);
    const after = await show(checkout, plan.to.commit, source);
    if (target === 'LICENSE' && !after.includes('MIT License')) throw new Error('上游许可变化，先核对分发条件');
    if (after !== local) files.set(path, after);
  }
  let provenance = await readFile(join(root, skillPath, 'UPSTREAM.md'), 'utf8');
  for (const key of ['commit', 'version', 'sha256']) {
    provenance = replaceOnce(provenance, `\`${plan.from[key]}\``, `\`${plan.to[key]}\``, `UPSTREAM.md ${key}`);
  }
  files.set(join(root, skillPath, 'UPSTREAM.md'), provenance);
  const noticesPath = join(root, 'THIRD_PARTY_NOTICES.md');
  let notices = await readFile(noticesPath, 'utf8');
  notices = replaceOnce(notices,
    `\`${plan.from.commit}\` (upstream package version \`${plan.from.version}\`)`,
    `\`${plan.to.commit}\` (upstream package version \`${plan.to.version}\`)`, 'THIRD_PARTY_NOTICES.md');
  files.set(noticesPath, notices);
  // Resolve all conflicts before writing any delivery file.
  for (const [path, text] of files) await writeFile(path, text);
  return [...files.keys()];
}

async function main(args) {
  const { positionals, values } = parseArgs({ args, allowPositionals: true, options: {
    repo: { type: 'string' }, ref: { type: 'string' }, help: { type: 'boolean' },
  } });
  if (values.help) {
    console.log('sync-upstream.mjs prepare|apply --repo /path/to/skills [--ref vX.Y.Z]\nprepare 仅生成差异材料；apply 同步原样文件和来源记录，不提交或发布。');
    return;
  }
  const command = positionals[0];
  if (positionals.length !== 1 || !['prepare', 'apply'].includes(command)) throw new Error('选择 prepare 或 apply');
  if (command === 'apply' && values.ref) throw new Error('apply 使用 prepare 固定的版本；新版本先 prepare');
  const root = await realpath(resolve(values.repo ?? '.'));
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  if (pkg.repository?.url !== 'https://github.com/Plasticine-Yang/skills') throw new Error('目标必须是 Plasticine-Yang/skills 的 checkout');
  const directory = join(root, '.agent-tmp/html-renderer-update');
  await git(root, ['check-ignore', '-q', '--no-index', '.agent-tmp/html-renderer-update/']);
  await mkdir(directory, { recursive: true });
  const checkout = join(directory, 'upstream');
  const planPath = join(directory, 'sync-plan.json');
  if (command === 'apply') {
    const files = await applyPlan(root, checkout, JSON.parse(await readFile(planPath, 'utf8')));
    console.log(JSON.stringify({ updated: files, note: '合并说明、验证并提交后，调用仓库 patch 发布入口。' }, null, 2));
    return;
  }
  const release = values.ref ? null : JSON.parse(await run('gh', ['api', `repos/${repository}/releases/latest`], root));
  if (release && (release.draft || release.prerelease)) throw new Error('最新发布不是正式 release');
  const ref = values.ref ?? release.tag_name;
  if (!/^v\d+\.\d+\.\d+$/.test(ref)) throw new Error('只接受正式版本 tag：vX.Y.Z');
  try { await realpath(join(checkout, '.git')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await git(root, ['clone', sourceUrl, checkout]);
  }
  const remote = (await git(checkout, ['remote', 'get-url', 'origin'])).trim();
  if (remote !== sourceUrl) throw new Error('上游缓存的 origin 不匹配');
  await git(checkout, ['fetch', 'origin', '--tags']);
  const plan = await inspect(root, checkout, ref);
  const range = [plan.from.commit, plan.to.commit];
  await writeFile(planPath, JSON.stringify(plan, null, 2) + '\n');
  await writeFile(join(directory, 'upstream-commits.txt'), await git(checkout, ['log', '--format=%h %s', `${range[0]}..${range[1]}`]));
  await writeFile(join(directory, 'skill.diff'), await git(checkout, ['diff', ...range, '--', 'skills/answer-me-with-html/SKILL.md']));
  await writeFile(join(directory, 'dependencies.diff'), await git(checkout, ['diff', ...range, '--', 'package.json', 'package-lock.json', 'LICENSE']));
  const { changedFiles, ...summary } = plan;
  console.log(JSON.stringify({ ...summary, changedFileCount: changedFiles.length, reviewDirectory: directory }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
