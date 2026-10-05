#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { parseDocument } from 'yaml';

const execute = promisify(execFile);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const prFields = 'number,url,state,title,body,headRefName,headRefOid,baseRefName,isCrossRepository,isDraft,mergeStateStatus,mergeCommit';

export async function command(binary, args, { allowCheckResult = false } = {}) {
  try {
    const { stdout } = await execute(binary, args, { cwd: root, timeout: 120_000, maxBuffer: 4 * 1024 * 1024 });
    return stdout.trim();
  } catch (error) {
    if (allowCheckResult && [1, 8].includes(error.code) && error.stdout?.trim().startsWith('[')) {
      return error.stdout.trim();
    }
    throw new Error(`${binary} ${args.join(' ')}\n${error.stderr || error.message}`);
  }
}

export function checksFromRollup(checks) {
  if (!Array.isArray(checks)) throw new Error('GitHub 未返回检查列表。');
  const buckets = { SUCCESS: 'pass', FAILURE: 'fail', ERROR: 'fail', TIMED_OUT: 'fail',
    ACTION_REQUIRED: 'fail', STARTUP_FAILURE: 'fail', STALE: 'fail', CANCELLED: 'cancel',
    SKIPPED: 'skipping', NEUTRAL: 'skipping', PENDING: 'pending', EXPECTED: 'pending' };
  return checks.map((check) => {
    const name = check.name ?? check.context;
    const state = check.__typename === 'CheckRun'
      ? check.status === 'COMPLETED' ? check.conclusion : 'PENDING'
      : check.state;
    const bucket = buckets[state];
    if (!name || !bucket) throw new Error(`GitHub 检查状态无法识别：${name ?? ''} ${state ?? ''}`);
    return { name, bucket };
  });
}

export async function readChecks(repo, number, run = command) {
  try {
    return JSON.parse(await run('gh', ['pr', 'checks', String(number), '--required', '--json', 'name,bucket',
      '--repo', repo], { allowCheckResult: true }));
  } catch (error) {
    if (error.message.includes('no checks reported')) return [];
    if (!error.message.includes('unknown flag: --json')) throw error;
    // Older gh still exposes both Actions and legacy statuses through pr view.
    const pr = JSON.parse(await run('gh', ['pr', 'view', String(number), '--json', 'statusCheckRollup', '--repo', repo]));
    return checksFromRollup(pr.statusCheckRollup);
  }
}

export async function waitFor(label, probe, {
  timeout = 600_000, interval = 3_000, now = Date.now,
  sleep = (ms) => new Promise((done) => setTimeout(done, ms)), log = console.log,
} = {}) {
  const deadline = now() + timeout;
  log(label);
  while (true) {
    const result = await probe();
    if (result) return result;
    if (now() >= deadline) throw new Error(`${label}超时；修复后重跑同一命令继续。`);
    await sleep(Math.min(interval, deadline - now()));
  }
}

export async function mergeCheckedPr(github, number, head, title, wait = waitFor) {
  const pr = await wait(`等待 PR #${number} 的检查`, async () => {
    const current = await github.pr(number);
    if (current.headRefOid !== head) throw new Error(`PR #${number} 的提交已变化，停止合并。`);
    if (current.state !== 'OPEN' || current.isDraft || current.baseRefName !== 'main' || current.isCrossRepository) {
      throw new Error(`PR #${number} 必须是本仓库面向 main 的普通开放 PR。`);
    }
    const checks = await github.checks(number);
    if (checks.some((check) => ['fail', 'cancel'].includes(check.bucket))) {
      throw new Error(`PR #${number} 检查失败，停止发布。`);
    }
    if (!checks.some((check) => check.name === 'check' && check.bucket === 'pass')) return null;
    if (checks.some((check) => !['pass', 'skipping'].includes(check.bucket))) return null;
    if (current.mergeStateStatus === 'DIRTY') throw new Error(`PR #${number} 存在合并冲突。`);
    if (current.mergeStateStatus !== 'CLEAN') return null;
    return current;
  });
  await github.merge(pr.number, head, title);
  const merged = await github.pr(number);
  if (merged.state !== 'MERGED' || !merged.mergeCommit?.oid) throw new Error(`PR #${number} 未完成合并。`);
  return merged.mergeCommit.oid;
}

export function validateVersion(version, files, paths) {
  const allowed = /^(?:package(?:-lock)?\.json|CHANGELOG\.md|\.claude-plugin\/marketplace\.json|\.changeset\/(?!README\.md$)[^/]+\.md)$/;
  if (paths.some((path) => !allowed.test(path))) throw new Error('版本 PR 包含版本元数据以外的改动，停止发布。');
  const pkg = JSON.parse(files['package.json']);
  const lock = JSON.parse(files['package-lock.json']);
  const marketplace = JSON.parse(files['.claude-plugin/marketplace.json']);
  const versions = [pkg.version, lock.version, lock.packages?.['']?.version, marketplace.metadata?.version,
    ...marketplace.plugins.map((plugin) => plugin.version)];
  if (versions.some((value) => value !== version) || !files['CHANGELOG.md'].includes(`\n## ${version}\n`)) {
    throw new Error(`版本 PR 未统一为 ${version}，停止发布。`);
  }
}

export async function finishRelease(github, source, version, wait = waitFor) {
  if (source.state !== 'MERGED') throw new Error('修正 PR 尚未合并。');
  await github.releaseRun(source.mergeCommit.oid, wait);
  const pr = await wait('等待 Changesets 版本 PR', () => github.versionPr());
  const title = `chore: 发布 v${version}`;
  await github.validate(pr, version);
  if (pr.state === 'OPEN') {
    // An edit made with the user's gh identity triggers the normal pull_request check.
    await github.requestChecks(pr, title);
    const merge = await mergeCheckedPr(github, pr.number, pr.headRefOid, title, wait);
    await github.releaseRun(merge, wait);
  } else if (pr.state !== 'MERGED') {
    throw new Error('版本 PR 已关闭，停止发布。');
  } else {
    await github.releaseRun(pr.mergeCommit.oid, wait);
  }
  return wait(`等待 v${version} Release`, async () => {
    const release = await github.release(version);
    if (!release || release.isDraft || release.isPrerelease) return null;
    const tagCommit = await github.tagCommit(version);
    const versionPr = await github.pr(pr.number);
    if (tagCommit !== versionPr.mergeCommit?.oid) throw new Error('版本 tag 与版本 PR 的合并提交不匹配。');
    return release;
  });
}

class Github {
  constructor(repo, state, save, directory) { this.repo = repo; this.state = state; this.save = save; this.directory = directory; }
  run(args) { return command('gh', [...args, '--repo', this.repo]); }
  async json(args) { return JSON.parse(await this.run(args)); }
  pr(number) { return this.json(['pr', 'view', String(number), '--json', prFields]); }
  async checks(number) {
    return readChecks(this.repo, number);
  }
  merge(number, head, title) {
    return this.run(['pr', 'merge', String(number), '--squash', '--match-head-commit', head, '--subject', title,
      '--body', '检查通过后发布，保留 Changesets 版本记录。']);
  }
  async requestChecks(pr, title) {
    if (pr.title !== title) return this.run(['pr', 'edit', String(pr.number), '--title', title]);
    if ((await this.checks(pr.number)).length) return;
    const body = join(this.directory, 'version-pr.md');
    const marker = `<!-- release-check: ${pr.headRefOid} ${Date.now()} -->`;
    await writeFile(body, (pr.body ?? '').replace(/\n?<!-- release-check: .*? -->/g, '') + `\n${marker}\n`);
    await this.run(['pr', 'edit', String(pr.number), '--body-file', body]);
  }
  async releaseRun(commit, wait) {
    return wait(`等待提交 ${commit.slice(0, 7)} 的 Release workflow`, async () => {
      const runs = await this.json(['run', 'list', '--workflow', 'release.yml', '--event', 'push', '--commit', commit,
        '--limit', '1', '--json', 'databaseId,status,conclusion,url']);
      const run = runs[0];
      if (!run) return null;
      if (run.status === 'action_required') throw new Error(`Workflow 需要处理：${run.url}`);
      if (run.status !== 'completed') return null;
      if (run.conclusion !== 'success') throw new Error(`Release workflow 失败：${run.url}`);
      return run;
    });
  }
  async versionPr() {
    if (this.state.versionPr) return this.pr(this.state.versionPr);
    const prs = await this.json(['pr', 'list', '--head', 'changeset-release/main', '--base', 'main', '--state', 'all',
      '--limit', '1', '--json', prFields]);
    if (prs[0]) {
      this.state.versionPr = prs[0].number;
      await this.save();
      console.log(prs[0].url);
    }
    return prs[0];
  }
  async validate(pr, version) {
    if (pr.isCrossRepository || pr.baseRefName !== 'main' || pr.headRefName !== 'changeset-release/main') {
      throw new Error('版本 PR 来源不匹配。');
    }
    await command('git', ['fetch', 'origin', 'changeset-release/main']);
    const paths = (await this.run(['pr', 'diff', String(pr.number), '--name-only'])).split('\n').filter(Boolean);
    const files = {};
    for (const path of ['package.json', 'package-lock.json', '.claude-plugin/marketplace.json', 'CHANGELOG.md']) {
      files[path] = await command('git', ['show', `${pr.headRefOid}:${path}`]);
    }
    validateVersion(version, files, paths);
  }
  async release(version) {
    try { return await this.json(['release', 'view', `v${version}`, '--json', 'url,isDraft,isPrerelease']); }
    catch (error) {
      if (error.message.includes('release not found')) return null;
      throw error;
    }
  }
  async tagCommit(version) {
    const ref = JSON.parse(await command('gh', ['api', `repos/${this.repo}/git/ref/tags/v${version}`]));
    if (ref.object.type === 'commit') return ref.object.sha;
    const tag = JSON.parse(await command('gh', ['api', `repos/${this.repo}/git/tags/${ref.object.sha}`]));
    return tag.object.sha;
  }
}

async function main(args) {
  if (args.includes('--help')) {
    console.log('用法：./scripts/project release patch --summary "面向用户的改动" [--dry-run]\n修复失败后重跑同一命令，复用已有 Changeset 和 PR。');
    return;
  }
  if (args.shift() !== 'patch') throw new Error('目前只支持 patch 发布。');
  let summary;
  let dryRun = false;
  while (args.length) {
    const option = args.shift();
    if (option === '--summary') {
      summary = args.shift()?.trim();
      if (!summary || summary.startsWith('--')) throw new Error('--summary 需要非空的改动说明。');
    } else if (option === '--dry-run') dryRun = true;
    else throw new Error(`未知参数：${option}`);
  }
  const status = await command('git', ['status', '--porcelain']);
  if (status) throw new Error(`请先提交当前改动，保持工作区与暂存区干净。\n${status}`);
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const match = pkg.version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) throw new Error('patch 发布需要正式的三段版本号。');
  const version = `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
  let branch = await command('git', ['branch', '--show-current']);
  if (!branch) throw new Error('请在本地分支上运行发布命令。');
  const directory = join(root, '.agent-tmp/release', `v${version}`);
  const statePath = join(directory, 'state.json');
  let state;
  try { state = JSON.parse(await readFile(statePath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!summary && !state) throw new Error('首次发布需要 --summary。');
  if (state && (state.branch !== branch || (summary && state.summary !== summary))) {
    throw new Error(`已有 v${version} 发布记录；请回到 ${state.branch} 并使用原 summary 继续。`);
  }
  summary ??= state?.summary;
  if (dryRun) {
    console.log(`v${pkg.version} → v${version}\n${summary}\n检查 → patch Changeset → 修正 PR → 版本 PR → 确认 Release\n发布后保留当前分支。`);
    return;
  }
  const repo = JSON.parse(await command('gh', ['repo', 'view', '--json', 'nameWithOwner'])).nameWithOwner;
  const save = () => writeFile(statePath, JSON.stringify(state, null, 2) + '\n');
  await mkdir(directory, { recursive: true });
  if (!state) {
    await command('git', ['fetch', 'origin', 'main']);
    const remote = JSON.parse(await command('git', ['show', 'origin/main:package.json']));
    if (remote.version !== pkg.version) throw new Error('本地版本落后于 main；先执行 git pull --ff-only，或回到待发布分支。');
    await command('git', ['merge-base', '--is-ancestor', 'origin/main', 'HEAD']);
    if (branch === 'main') {
      branch = `codex/release-v${version}`;
      await command('git', ['switch', '-c', branch]);
    }
    state = { version, branch, summary, repo };
    await save();
  }
  if (state.repo !== repo) throw new Error('仓库与已有发布记录不匹配。');
  const github = new Github(repo, state, save, directory);
  let source = state.sourcePr ? await github.pr(state.sourcePr) : null;
  if (!source || source.state === 'OPEN') {
    const changesets = (await readdir(join(root, '.changeset'))).filter((name) => name.endsWith('.md') && name !== 'README.md');
    for (const name of changesets) {
      const text = await readFile(join(root, '.changeset', name), 'utf8');
      const doc = parseDocument(text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '');
      const metadata = doc.toJS();
      if (doc.errors.length || JSON.stringify(metadata) !== JSON.stringify({ [pkg.name]: 'patch' })) {
        throw new Error(`.changeset/${name} 不是本包的 patch 记录，停止发布。`);
      }
    }
    if (!changesets.length) {
      const path = '.changeset/release-patch.md';
      await writeFile(join(root, path), `---\n"${pkg.name}": patch\n---\n\n${summary}\n`, { flag: 'wx' });
      await command('git', ['add', '--', path]);
      console.log(await command('git', ['diff', '--cached', '--name-status']));
      console.log(await command('git', ['diff', '--cached']));
      await command('git', ['diff', '--cached', '--check']);
      await command('git', ['commit', '-m', `chore: 添加 v${version} 的 patch 发布记录`]);
    }
    const head = await command('git', ['rev-parse', 'HEAD']);
    if (state.checkedHead !== head) {
      console.log(await command('npm', ['run', 'check']));
      console.log(await command('npm', ['run', 'check-install']));
      state.checkedHead = head;
      await save();
    }
    await command('git', ['push', '--set-upstream', 'origin', branch]);
    const prs = await github.json(['pr', 'list', '--head', branch, '--base', 'main', '--state', 'all', '--limit', '1', '--json', prFields]);
    if (!prs.length) {
      const body = join(directory, 'source-pr.md');
      await writeFile(body, `## Summary\n\n${summary}\n\n\`\`\`diff\n- ${pkg.version}\n+ ${version}（patch）\n\`\`\`\n\n## Evidence\n\n- **Before:** 改动尚未纳入版本记录。\n- **After:** 添加 patch Changeset；项目检查和独立安装检查通过。\n\n## Merge Danger\n\n**Door:** two-way\n\n**Blast Radius:** release\n\n合并后生成 Changesets 版本 PR，正式发布由版本 PR 完成。\n`);
      console.log(await github.run(['pr', 'create', '--base', 'main', '--head', branch, '--title', `fix: ${summary}`,
        '--body-file', body]));
      source = (await github.json(['pr', 'list', '--head', branch, '--base', 'main', '--state', 'open', '--json', prFields]))[0];
    } else source = prs[0];
    if (!source) throw new Error('未找到修正 PR。');
    state.sourcePr = source.number;
    await save();
    if (source.state === 'OPEN') {
      if (source.isDraft) await github.run(['pr', 'ready', String(source.number)]);
      await mergeCheckedPr(github, source.number, head, `fix: ${summary}`);
      source = await github.pr(source.number);
    }
  }
  const release = await finishRelease(github, source, version);
  console.log(`已发布 v${version}：${release.url}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
