import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { inspect, applyPlan } from '../.agents/skills/sync-html-renderer/scripts/sync-upstream.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const hash = (text) => createHash('sha256').update(text).digest('hex');

async function fixture(t, { dependencyChange = false } = {}) {
  await mkdir(join(root, '.agent-tmp'), { recursive: true });
  const directory = await mkdtemp(join(root, '.agent-tmp/html-renderer-sync-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const checkout = join(directory, 'upstream');
  const target = join(directory, 'target');
  const renderer = join(target, 'skills/answer-me/answer-me-with-html-renderer');
  await mkdir(checkout, { recursive: true });
  await mkdir(join(renderer, 'scripts/upstream'), { recursive: true });
  await mkdir(join(renderer, 'references'), { recursive: true });
  const git = (...args) => execFileSync('git', args, { cwd: checkout, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '-b', 'main');
  git('config', 'user.name', 'Sync test');
  git('config', 'user.email', 'sync-test@example.invalid');
  const lock = (version, dependency) => JSON.stringify({ packages: {
    '': { version }, 'node_modules/marked': { version: dependency, integrity: `sha512-${dependency}`, license: 'MIT' },
    'node_modules/build-tool': { version: '1.0.0', dev: true },
  } });
  async function source(version, bundle, example, dependency) {
    const files = {
      'package.json': JSON.stringify({ version }), 'package-lock.json': lock(version, dependency),
      'skills/answer-me-with-html/scripts/am.mjs': bundle,
      'examples/tcp.md': example, 'examples/video-tcp.md': '# 视频示例\n', 'LICENSE': 'MIT License\n',
    };
    for (const [path, text] of Object.entries(files)) {
      await mkdir(join(checkout, path, '..'), { recursive: true });
      await writeFile(join(checkout, path), text);
    }
    git('add', '.'); git('commit', '-m', `release ${version}`);
    git('tag', `v${version}`);
    return git('rev-parse', 'HEAD');
  }
  const oldBundle = 'console.log("0.4.3");\n';
  const oldCommit = await source('0.4.3', oldBundle, '# 原示例\n', '18.0.14');
  await writeFile(join(renderer, 'UPSTREAM.md'), [
    `固定 commit：\`${oldCommit}\``, '上游 package 版本：`0.4.3`', `CLI SHA-256：\`${hash(oldBundle)}\``, '',
  ].join('\n'));
  await writeFile(join(target, 'THIRD_PARTY_NOTICES.md'), `Upstream commit: \`${oldCommit}\` (upstream package version \`0.4.3\`)\n`);
  await writeFile(join(renderer, 'scripts/upstream/am.mjs'), oldBundle);
  await writeFile(join(renderer, 'scripts/am.mjs'), 'local wrapper\n');
  await writeFile(join(renderer, 'SKILL.md'), 'local instructions\n');
  await writeFile(join(renderer, 'references/example.md'), '# 原示例\n');
  await writeFile(join(renderer, 'references/video-example.md'), '# 视频示例\n');
  await writeFile(join(renderer, 'LICENSE'), 'MIT License\n');
  const newCommit = await source('0.4.9', 'console.log("0.4.9");\n', '# 新示例\n', dependencyChange ? '19.0.0' : '18.0.14');
  return { target, checkout, renderer, newCommit, git };
}

test('同步精确版本、示例和来源，保留本地包装与说明；再次同步无变化', async (t) => {
  const f = await fixture(t);
  const plan = await inspect(f.target, f.checkout, 'v0.4.9');
  assert.equal(plan.to.commit, f.newCommit);
  assert.equal(plan.dependenciesChanged, false);
  assert.equal(await readFile(join(f.renderer, 'scripts/upstream/am.mjs'), 'utf8'), 'console.log("0.4.3");\n');
  await applyPlan(f.target, f.checkout, plan);
  assert.equal(await readFile(join(f.renderer, 'scripts/upstream/am.mjs'), 'utf8'), 'console.log("0.4.9");\n');
  assert.equal(await readFile(join(f.renderer, 'references/example.md'), 'utf8'), '# 新示例\n');
  assert.equal(await readFile(join(f.renderer, 'scripts/am.mjs'), 'utf8'), 'local wrapper\n');
  assert.equal(await readFile(join(f.renderer, 'SKILL.md'), 'utf8'), 'local instructions\n');
  assert((await readFile(join(f.target, 'THIRD_PARTY_NOTICES.md'), 'utf8')).includes(f.newCommit));
  const repeat = await inspect(f.target, f.checkout, 'v0.4.9');
  assert.equal(repeat.unchanged, true);
  assert.deepEqual(await applyPlan(f.target, f.checkout, repeat), []);
});

test('示例有本地定制时，全部交付文件保持原样', async (t) => {
  const f = await fixture(t);
  const plan = await inspect(f.target, f.checkout, 'v0.4.9');
  await writeFile(join(f.renderer, 'references/example.md'), '# 用户定制\n');
  const before = await readFile(join(f.renderer, 'UPSTREAM.md'), 'utf8');
  await assert.rejects(applyPlan(f.target, f.checkout, plan), /本地定制/);
  assert.equal(await readFile(join(f.renderer, 'UPSTREAM.md'), 'utf8'), before);
  assert.equal(await readFile(join(f.renderer, 'scripts/upstream/am.mjs'), 'utf8'), 'console.log("0.4.3");\n');
  assert.equal(await readFile(join(f.renderer, 'references/example.md'), 'utf8'), '# 用户定制\n');
});

test('运行依赖变更进入许可核对路径，不部分替换 CLI', async (t) => {
  const f = await fixture(t, { dependencyChange: true });
  const plan = await inspect(f.target, f.checkout, 'v0.4.9');
  assert.equal(plan.dependenciesChanged, true);
  await assert.rejects(applyPlan(f.target, f.checkout, plan), /运行依赖变化/);
  assert.equal(await readFile(join(f.renderer, 'scripts/upstream/am.mjs'), 'utf8'), 'console.log("0.4.3");\n');
});

test('已准备 tag 移动或本地 CLI 损坏时阻止旧计划应用', async (t) => {
  const f = await fixture(t);
  const plan = await inspect(f.target, f.checkout, 'v0.4.9');
  await writeFile(join(f.checkout, 'examples/tcp.md'), '# 新增说明\n');
  f.git('add', '.'); f.git('commit', '-m', 'move tag'); f.git('tag', '-f', 'v0.4.9');
  await assert.rejects(applyPlan(f.target, f.checkout, plan), /重新 prepare/);
  await writeFile(join(f.renderer, 'scripts/upstream/am.mjs'), 'local edits');
  await assert.rejects(inspect(f.target, f.checkout, 'v0.4.9'), /本地 CLI/);
});

test('同步说明字段冲突时不写任何导入文件；预发布 tag 被拒绝', async (t) => {
  const f = await fixture(t);
  const plan = await inspect(f.target, f.checkout, 'v0.4.9');
  await writeFile(join(f.target, 'THIRD_PARTY_NOTICES.md'), '用户改写的来源声明\n');
  await assert.rejects(applyPlan(f.target, f.checkout, plan), /THIRD_PARTY_NOTICES/);
  assert.equal(await readFile(join(f.renderer, 'scripts/upstream/am.mjs'), 'utf8'), 'console.log("0.4.3");\n');
  await assert.rejects(inspect(f.target, f.checkout, 'v0.5.0-beta.1'), /正式版本 tag/);
});
