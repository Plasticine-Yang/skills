import assert from 'node:assert/strict';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { command, finishRelease, mergeCheckedPr, validateVersion, waitFor } from './release.mjs';

function boundedWait() {
  let time = 0;
  return (label, probe) => waitFor(label, probe, {
    timeout: 20, interval: 5, now: () => time, sleep: async (ms) => { time += ms; }, log: () => {},
  });
}

function openPr() {
  return { number: 2, state: 'OPEN', headRefOid: 'head', baseRefName: 'main', headRefName: 'changeset-release/main',
    isDraft: false, isCrossRepository: false, mergeStateStatus: 'CLEAN', title: 'chore: 更新技能版本' };
}

function githubFixture() {
  const events = [];
  let pr = openPr();
  return {
    events,
    pr: async () => ({ ...pr }),
    checks: async () => [{ name: 'check', bucket: 'pass' }],
    merge: async (number, head) => { events.push(['merge', number, head]); pr = { ...pr, state: 'MERGED', mergeCommit: { oid: 'version-merge' } }; },
    releaseRun: async (sha) => { events.push(['workflow', sha]); },
    versionPr: async () => ({ ...pr }),
    validate: async () => { events.push(['validate']); },
    requestChecks: async () => { events.push(['edit']); },
    release: async () => ({ url: 'https://github.com/example/repo/releases/tag/v1.0.1', isDraft: false, isPrerelease: false }),
    tagCommit: async () => 'version-merge',
  };
}

test('missing and pending checks must finish before merging the tested SHA', async () => {
  const github = githubFixture();
  let calls = 0;
  github.checks = async () => {
    calls++;
    assert.equal(github.events.length, 0);
    return calls === 1 ? [] : [{ name: 'check', bucket: calls === 2 ? 'pending' : 'pass' }];
  };
  assert.equal(await mergeCheckedPr(github, 2, 'head', '发布', boundedWait()), 'version-merge');
  assert.equal(calls, 3);
  assert.deepEqual(github.events, [['merge', 2, 'head']]);
});

test('failed, cancelled and skipped required check never authorize merging', async () => {
  for (const bucket of ['fail', 'cancel', 'skipping']) {
    const github = githubFixture();
    github.checks = async () => [{ name: 'check', bucket }];
    await assert.rejects(mergeCheckedPr(github, 2, 'head', '发布', boundedWait()));
    assert.deepEqual(github.events, []);
  }
});

test('changed PR head, fork and wrong target stop before a merge', async () => {
  for (const change of [{ headRefOid: 'new-head' }, { isCrossRepository: true }, { baseRefName: 'other' }]) {
    const github = githubFixture();
    github.pr = async () => ({ ...openPr(), ...change });
    await assert.rejects(mergeCheckedPr(github, 2, 'head', '发布', boundedWait()));
    assert.deepEqual(github.events, []);
  }
});

test('passing checks do not bypass branch protections', async () => {
  const github = githubFixture();
  github.pr = async () => ({ ...openPr(), mergeStateStatus: 'BLOCKED' });
  await assert.rejects(mergeCheckedPr(github, 2, 'head', '发布', boundedWait()), /超时/);
  assert.deepEqual(github.events, []);
});

test('gh exit 8 and 1 with check JSON remain observable, other errors stop', async () => {
  for (const code of [8, 1]) {
    const args = ['-e', `process.stdout.write('[{"bucket":"pending"}]'); process.exit(${code})`];
    assert.deepEqual(JSON.parse(await command(process.execPath, args, { allowCheckResult: true })), [{ bucket: 'pending' }]);
    await assert.rejects(command(process.execPath, args));
  }
  await assert.rejects(command(process.execPath, ['-e', 'console.error("auth failed"); process.exit(1)'], { allowCheckResult: true }), /auth failed/);
});

function versionFiles() {
  return {
    'package.json': '{"version":"1.0.1"}',
    'package-lock.json': '{"version":"1.0.1","packages":{"":{"version":"1.0.1"}}}',
    '.claude-plugin/marketplace.json': '{"metadata":{"version":"1.0.1"},"plugins":[{"version":"1.0.1"}]}',
    'CHANGELOG.md': '# package\n\n## 1.0.1\n\n修正。',
  };
}

test('version PR validates all version metadata and rejects extra implementation changes', () => {
  const files = versionFiles();
  validateVersion('1.0.1', files, [...Object.keys(files), '.changeset/fix.md']);
  assert.throws(() => validateVersion('1.0.1', files, ['skills/engineering/setup-project/SKILL.md']), /元数据以外/);
  assert.throws(() => validateVersion('1.0.1', { ...files, 'package.json': '{"version":"1.0.2"}' }, Object.keys(files)), /未统一/);
  assert.throws(() => validateVersion('1.0.1', { ...files, 'CHANGELOG.md': '# old' }, Object.keys(files)), /未统一/);
});

test('successful release edits the version PR, checks it, then waits for the matching tag', async () => {
  const github = githubFixture();
  const source = { state: 'MERGED', mergeCommit: { oid: 'source-merge' } };
  const release = await finishRelease(github, source, '1.0.1', boundedWait());
  assert(release.url.endsWith('/v1.0.1'));
  assert.deepEqual(github.events, [['workflow', 'source-merge'], ['validate'], ['edit'], ['merge', 2, 'head'], ['workflow', 'version-merge']]);
});

test('version validation failure and failed CI cannot publish', async () => {
  const source = { state: 'MERGED', mergeCommit: { oid: 'source-merge' } };
  for (const scenario of ['metadata', 'ci']) {
    const github = githubFixture();
    if (scenario === 'metadata') github.validate = async () => { throw new Error('wrong version'); };
    else github.checks = async () => [{ name: 'check', bucket: 'fail' }];
    await assert.rejects(finishRelease(github, source, '1.0.1', boundedWait()));
    assert(!github.events.some(([event]) => event === 'merge'));
  }
});

test('draft releases and mismatched tags cannot report success', async () => {
  const source = { state: 'MERGED', mergeCommit: { oid: 'source-merge' } };
  const draft = githubFixture();
  draft.release = async () => ({ isDraft: true });
  await assert.rejects(finishRelease(draft, source, '1.0.1', boundedWait()), /超时/);
  const mismatch = githubFixture();
  mismatch.tagCommit = async () => 'old-commit';
  await assert.rejects(finishRelease(mismatch, source, '1.0.1', boundedWait()), /不匹配/);
});

test('resuming a merged version PR does not edit or merge it again', async () => {
  const github = githubFixture();
  await github.merge(2, 'head');
  github.events.length = 0;
  await finishRelease(github, { state: 'MERGED', mergeCommit: { oid: 'source-merge' } }, '1.0.1', boundedWait());
  assert.deepEqual(github.events, [['workflow', 'source-merge'], ['validate'], ['workflow', 'version-merge']]);
});

test('CLI dry run has no side effects; a failed local check preserves main and resumes without another commit', async () => {
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  const temporary = join(root, '.agent-tmp/release-command-tests');
  await mkdir(temporary, { recursive: true });
  const sandbox = await mkdtemp(join(temporary, 'case-'));
  const project = join(sandbox, 'project');
  const remote = join(sandbox, 'remote.git');
  const bin = join(sandbox, 'bin');
  const run = promisify(execFile);
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`,
    GIT_AUTHOR_NAME: 'Release check', GIT_AUTHOR_EMAIL: 'release-check@example.invalid',
    GIT_COMMITTER_NAME: 'Release check', GIT_COMMITTER_EMAIL: 'release-check@example.invalid' };
  const git = async (...args) => (await run('git', args, { cwd: project, env })).stdout.trim();
  const cli = (...args) => run(process.execPath, [join(project, 'scripts/release.mjs'), 'patch', '--summary', '修正目录规则', ...args], { cwd: project, env });
  try {
    await mkdir(join(project, 'scripts'), { recursive: true });
    await mkdir(join(project, '.changeset'));
    await mkdir(bin);
    await cp(join(root, 'scripts/release.mjs'), join(project, 'scripts/release.mjs'));
    await symlink(join(root, 'node_modules'), join(project, 'node_modules'), 'dir');
    await writeFile(join(project, '.gitignore'), '.agent-tmp/\nnode_modules\n');
    await writeFile(join(project, 'package.json'), '{"name":"plasticine-skills","version":"1.0.0"}\n');
    await writeFile(join(project, '.changeset/README.md'), '# Changesets\n');
    await writeFile(join(bin, 'gh'), '#!/usr/bin/env node\nif (process.argv[2] !== "repo") { console.error("unexpected GitHub mutation"); process.exit(1); } console.log(JSON.stringify({nameWithOwner:"example/repo"}));\n', { mode: 0o755 });
    await writeFile(join(bin, 'npm'), '#!/usr/bin/env node\nconsole.error("fixture check failed"); process.exit(1);\n', { mode: 0o755 });
    await git('init', '-q', '--initial-branch=main');
    await git('add', '--', '.gitignore', 'package.json', 'scripts/release.mjs', '.changeset/README.md');
    await git('commit', '-qm', '初始化发布检查项目');
    await run('git', ['init', '-q', '--bare', remote], { env });
    await git('remote', 'add', 'origin', remote);
    await git('push', '-q', 'origin', 'main');
    const initial = await git('rev-parse', 'HEAD');
    assert.equal(await git('status', '--porcelain'), '');
    await assert.rejects(run(process.execPath, [join(project, 'scripts/release.mjs'), 'patch', '--summary', '--dry-run'], { cwd: project, env }), /--summary/);
    assert((await cli('--dry-run')).stdout.includes('1.0.1'));
    assert.equal(await git('status', '--porcelain'), '');
    assert.equal(await git('branch', '--show-current'), 'main');
    await assert.rejects(cli(), /fixture check failed/);
    assert.equal(await git('rev-parse', 'main'), initial);
    assert.equal(await git('branch', '--show-current'), 'codex/release-v1.0.1');
    const releaseHead = await git('rev-parse', 'HEAD');
    assert.notEqual(releaseHead, initial);
    assert.equal(await git('status', '--porcelain'), '');
    const state = JSON.parse(await readFile(join(project, '.agent-tmp/release/v1.0.1/state.json'), 'utf8'));
    assert.equal(state.branch, 'codex/release-v1.0.1');
    await assert.rejects(cli(), /fixture check failed/);
    assert.equal(await git('rev-parse', 'HEAD'), releaseHead);
    assert.equal(await git('ls-remote', 'origin', 'refs/heads/codex/release-v1.0.1'), '');
    assert.equal((await git('ls-remote', 'origin', 'refs/heads/main')).split(/\s/)[0], initial);
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
});
