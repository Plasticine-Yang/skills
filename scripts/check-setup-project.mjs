#!/usr/bin/env node
// Verify preservation, idempotency and Git behavior in disposable repositories.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

export async function checkSetupProject(skillDir) {
  const { scaffoldProject } = await import(pathToFileURL(join(skillDir, 'scripts/scaffold.mjs')));
  const sandbox = await mkdtemp(join(tmpdir(), 'setup-project-check-'));
  function git(project, args) {
    const result = spawnSync('git', ['-C', project, ...args], { encoding: 'utf8', timeout: 10_000 });
    assert(!result.error, result.error?.message);
    assert.equal(result.status, 0, `git ${args.join(' ')} failed: ${result.stderr}`);
    return result.stdout;
  }
  async function project(name) {
    const path = join(sandbox, name);
    await mkdir(path);
    git(path, ['init', '-q']);
    return path;
  }
  async function put(project, path, text) {
    await mkdir(dirname(join(project, path)), { recursive: true });
    await writeFile(join(project, path), text);
  }
  async function configuration(project) {
    return Promise.all(['AGENTS.md', 'docs/agents/issue-tracker.md', 'docs/agents/triage-labels.md',
      'docs/agents/domain.md', '.gitignore'].map((path) => readFile(join(project, path), 'utf8')));
  }
  function ignored(project, path, expected) {
    const result = spawnSync('git', ['-C', project, 'check-ignore', '-q', '--no-index', path], { encoding: 'utf8' });
    assert(!result.error, result.error?.message);
    assert([0, 1].includes(result.status), result.stderr);
    assert.equal(result.status === 0, expected, `Unexpected ignore behavior: ${path}`);
  }
  try {
    const fresh = await project('fresh');
    const plan = await scaffoldProject(fresh);
    assert.equal(plan.changed.length, 0);
    assert.deepEqual(await readdir(fresh), ['.git'], 'Read-only planning wrote project files');
    const created = await scaffoldProject(fresh, { write: true });
    assert.equal(created.changed.length, 5);
    const before = await configuration(fresh);
    const rerun = await scaffoldProject(fresh, { write: true });
    assert.deepEqual(rerun.changed, []);
    assert.deepEqual(await configuration(fresh), before, 'Second run changed configuration');
    const [agents, tracker, triage] = before;
    assert(agents.includes('不为 UI 添加任何单元测试'));
    assert(agents.includes('Commit 描述与正文使用中文'));
    assert(tracker.includes('Status: done'));
    assert(tracker.includes('同时接受 `resolved` 与 `done`'));
    assert(triage.includes('| `done` | `done` |'));
    for (const spelling of ['.scratch', '.Scratch']) {
      for (const path of ['feature/spec.md', 'feature/map.md', 'feature/issues/01-build.md']) ignored(fresh, `${spelling}/${path}`, false);
      for (const path of ['feature/screenshot.png', 'feature/debug.md', 'feature/issues/debug.md',
        'feature/artifacts/trace.zip', 'feature/issues/sub/01-build.md', 'loose.md']) ignored(fresh, `${spelling}/${path}`, true);
    }
    ignored(fresh, '.agent-tmp/feature/debug.md', true);
    ignored(fresh, '.worktrees/feature/AGENTS.md', true);

    // Agent-specific skill directories can be symlinks to the canonical installation.
    const cliProject = await project('cli');
    const skillLink = join(sandbox, 'skill-link');
    await symlink(skillDir, skillLink, 'dir');
    function cli(args) {
      const result = spawnSync(process.execPath, [join(skillLink, 'scripts/scaffold.mjs'), '--repo', cliProject, ...args], {
        encoding: 'utf8', timeout: 10_000,
      });
      assert(!result.error, result.error?.message);
      assert.equal(result.status, 0, result.stderr);
      return JSON.parse(result.stdout);
    }
    assert.deepEqual(cli([]).changed, []);
    assert.deepEqual(await readdir(cliProject), ['.git']);
    assert.equal(cli(['--write']).changed.length, 5);
    assert.deepEqual(cli(['--write']).changed, []);

    // An installed project can be configured without replacing its installed skills.
    const installed = await project('installed');
    const installedSkill = '---\nname: triage\n---\nProject-specific version.\n';
    await put(installed, '.agents/skills/triage/SKILL.md', installedSkill);
    const installedReport = await scaffoldProject(installed, { write: true });
    assert.deepEqual(installedReport.installedSkills, ['triage']);
    assert.equal(await readFile(join(installed, '.agents/skills/triage/SKILL.md'), 'utf8'), installedSkill);

    // Existing setup and additions inside managed regions remain byte-for-byte intact.
    const legacy = await project('legacy');
    const originals = {
      'AGENTS.md': '# 项目\n\n## Agent skills\n自定义命令。\n\n<!-- setup-project:workflow:start -->\n项目增加的发布约定。\n<!-- setup-project:workflow:end -->\n',
      'CLAUDE.md': '# 项目专属说明\n必须阅读 docs/custom.md。\n',
      'docs/agents/issue-tracker.md': '# Tracker\n现有项目的补充说明。\n',
      'docs/agents/triage-labels.md': '# States\n额外状态：paused。\n',
      'docs/agents/domain.md': '# Domain\n读取 domains/payments/GLOSSARY.md。\n',
      '.gitignore': 'build/\r\n!.scratch/feature/research.md\r\n',
    };
    for (const [path, content] of Object.entries(originals)) await put(legacy, path, content);
    const legacyReport = await scaffoldProject(legacy, { write: true });
    assert.deepEqual(legacyReport.changed, ['.gitignore']);
    for (const [path, content] of Object.entries(originals)) {
      const actual = await readFile(join(legacy, path), 'utf8');
      if (path === '.gitignore') assert(actual.startsWith(content));
      else assert.equal(actual, content, `Existing content overwritten: ${path}`);
    }
    // Custom exceptions need to follow the default whitelist, and survive subsequent runs.
    await put(legacy, '.gitignore', await readFile(join(legacy, '.gitignore'), 'utf8') + '\r\n!.scratch/feature/research.md\r\n');
    ignored(legacy, '.scratch/feature/research.md', false);
    const merged = await configuration(legacy);
    assert.deepEqual((await scaffoldProject(legacy, { write: true })).changed, []);
    assert.deepEqual(await configuration(legacy), merged);

    // Incomplete/customized ignore markers require merging, never a duplicate block.
    await put(legacy, '.gitignore', '# setup-project:start\nProject-owned unfinished block.\n');
    const incomplete = await scaffoldProject(legacy, { write: true });
    assert.equal(incomplete.files.find((file) => file.path === '.gitignore').action, 'merge-required');
    assert.equal(await readFile(join(legacy, '.gitignore'), 'utf8'), '# setup-project:start\nProject-owned unfinished block.\n');

    // Already tracked files remain tracked and on disk until the agent classifies them.
    const tracked = await project('tracked');
    await put(tracked, '.scratch/feature/screenshot.png', 'local screenshot fixture');
    await put(tracked, '.scratch/feature/research.md', 'durable research fixture');
    await put(tracked, '.scratch/feature/issues/01-build.md', 'Status: ready-for-agent\n');
    git(tracked, ['add', '--', '.scratch']);
    const trackedReport = await scaffoldProject(tracked, { write: true });
    assert.deepEqual(trackedReport.reviewTracked.sort(), ['.scratch/feature/research.md', '.scratch/feature/screenshot.png']);
    assert(git(tracked, ['ls-files']).includes('screenshot.png'));
    assert.equal(await readFile(join(tracked, '.scratch/feature/screenshot.png'), 'utf8'), 'local screenshot fixture');

    // Preflight rejects symlinked outputs before creating any other configuration.
    const linked = await project('linked');
    const outside = join(sandbox, 'outside');
    await mkdir(outside);
    await symlink(outside, join(linked, 'docs'), 'dir');
    await assert.rejects(scaffoldProject(linked, { write: true }), /symlinked target/);
    assert.deepEqual(await readdir(linked), ['.git', 'docs']);
    assert.deepEqual(await readdir(outside), []);

    console.log('Setup project: planning, fresh/installed/legacy projects, symlinked CLI, preservation, idempotency, ignore rules and tracked-file review passed.');
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await checkSetupProject(join(root, 'skills/engineering/setup-project'));
}
