#!/usr/bin/env node
// Exercise the actual installer in disposable project directories, never globally.
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkSetupProject } from './check-setup-project.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cli = join(root, 'node_modules/skills/bin/cli.mjs');
const marketplace = JSON.parse(await readFile(join(root, '.claude-plugin/marketplace.json'), 'utf8'));
const tempRoot = join(root, '.agent-tmp/check-install');
await mkdir(tempRoot, { recursive: true });
const sandbox = await mkdtemp(join(tempRoot, 'install-'));

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

async function checkHtmlRenderer(installed, project) {
  project = await realpath(project);
  const renderer = join(installed, 'scripts/am.mjs');
  const home = join(project, 'user-home');
  await mkdir(home);
  const artifacts = join(home, '.answer-me');
  const env = { ...process.env, HOME: home, USERPROFILE: home, AM_NO_OPEN: '1' };
  // Exercise launcher defaults, including disabling upstream network checks outside CI.
  delete env.AM_HOME;
  delete env.AM_NO_UPDATE_CHECK;
  delete env.CI;
  function invoke(args, input, overrides = {}, cwd = project) {
    const result = spawnSync(process.execPath, [renderer, ...args], {
      cwd,
      env: { ...env, ...overrides },
      input,
      encoding: 'utf8',
      timeout: 30_000,
    });
    assert(!result.error, result.error?.message);
    return result;
  }
  function success(args, input, overrides, cwd) {
    const result = invoke(args, input, overrides, cwd);
    assert.equal(result.status, 0, args.join(' ') + ' failed:\n' + result.stdout + '\n' + result.stderr);
    return result.stdout;
  }
  function outputPath(stdout) {
    const match = stdout.match(/^✓ (.+)$/m);
    assert(match, 'Renderer did not report its output:\n' + stdout);
    return match[1];
  }
  const draft = [
    '---', 'title: 安装验证', '---',
    '## A 流程', '```flow LR', '输入 -> 输出: 渲染', '```',
    '## B 结论', '安装后可以生成页面。', '',
  ].join('\n');
  success(['config', 'set', 'theme', 'shadcn']);
  success(['config', 'set', 'mode', 'dark']);
  const dataDir = join(artifacts, 'html-renderer');
  const config = JSON.parse(await readFile(join(dataDir, 'config.json'), 'utf8'));
  assert.equal(config.theme, 'shadcn');
  assert.equal(config.mode, 'dark');

  const page = outputPath(success(['render', '-'], draft));
  assert.equal(dirname(page), join(artifacts, 'html'));
  assert.match(basename(page), /^renderer-[a-f0-9]{12}\.html$/);
  const html = await readFile(page, 'utf8');
  assert(html.includes('<h1>安装验证</h1>'));
  assert(html.includes('class="am-node '), 'Installed CLI did not render the flow chart');
  assert(html.includes('data-theme="shadcn" data-mode="dark"'));
  assert(html.includes('id="am-source"'), 'Rendered page lost its embedded draft');
  const state = JSON.parse(await readFile(join(dataDir, 'state.json'), 'utf8'));
  assert.equal(state.lastUpdateCheck, undefined, 'Launcher contacted the upstream updater');

  const secondPage = outputPath(success(['render', '-'], draft));
  assert.notEqual(secondPage, page, 'Default output overwrote a previous page');
  assert.equal(await readFile(page, 'utf8'), html);

  for (const args of [['--theme', 'blueprint', 'render', '-'], ['render', '--', '-']]) {
    assert.equal(dirname(outputPath(success(args, draft))), join(artifacts, 'html'));
  }

  // A different working directory shares home defaults while resolving project references locally.
  const otherProject = await mkdtemp(join(sandbox, 'other-project-'));
  await writeFile(join(otherProject, 'example.js'), 'export const shared = 7;\n');
  const otherDraft = draft + '\n## C 代码\n```js src=example.js\n```\n';
  const otherPage = outputPath(success(['render', '-'], otherDraft, {}, otherProject));
  assert.equal(dirname(otherPage), join(artifacts, 'html'));
  assert((await readFile(otherPage, 'utf8')).includes('shared'));
  assert(success(['config'], undefined, {}, otherProject).includes('shadcn'));
  assert(!(await readdir(project)).includes('.answer-me'), 'Launcher wrote artifacts into the project');
  assert(!(await readdir(otherProject)).includes('.answer-me'), 'Launcher wrote artifacts into another project');

  assert.equal(outputPath(success(['patch', page, '--panel', 'A'], '## A 流程\n只改这个面板。\n')), page);
  const patched = await readFile(page, 'utf8');
  assert(patched.includes('只改这个面板'));
  assert(patched.includes('安装后可以生成页面'), 'Patch changed an unrelated panel');
  const rejected = invoke(['patch', page, '--panel', '不存在'], '## 新面板\n内容。\n');
  assert.notEqual(rejected.status, 0, 'Patch accepted a missing panel');
  assert.equal(await readFile(page, 'utf8'), patched, 'Failed patch changed the page');

  await writeFile(join(project, 'chosen.html'), '已有成品');
  const outputs = [
    { option: ['-o', 'chosen.html'], directory: project, stem: 'chosen' },
    { option: ['--out=chosen-long.html'], directory: project, stem: 'chosen-long' },
    { option: ['-ochosen-short.html'], directory: project, stem: 'chosen-short' },
    { option: ['-o', 'without-extension'], directory: project, stem: 'without-extension' },
    { option: ['-o', '~/exports/chosen.html'], directory: join(home, 'exports'), stem: 'chosen' },
    { option: ['-o', join(artifacts, 'html/topic.html')], directory: join(artifacts, 'html'), stem: 'topic' },
    { option: ['-o', 'ignored.html', '--out=chosen-last.html'], directory: project, stem: 'chosen-last' },
  ];
  for (const { option, directory, stem } of outputs) {
    const explicit = outputPath(success(['render', '-', ...option], draft));
    assert.equal(dirname(explicit), directory);
    assert.match(basename(explicit), new RegExp(`^${stem}-[a-f0-9]{12}\\.html$`));
    assert.notEqual(outputPath(success(['render', '-', ...option], draft)), explicit);
  }
  assert.equal(await readFile(join(project, 'chosen.html'), 'utf8'), '已有成品');
  const videoDraft = [
    '---', 'title: 字幕验证', '---', '## A 流程',
    '```flow', '输入 -> 输出', '```', '> 从输入得到输出。', '',
  ].join('\n');
  success(['config', 'set', 'style', 'off']);
  const video = outputPath(success(['video', '-', '--voice', 'off'], videoDraft));
  assert.equal(dirname(video), join(artifacts, 'videos'));
  assert.match(basename(video), /^renderer-[a-f0-9]{12}\.html$/);
  assert((await readFile(video, 'utf8')).includes('data-video>'));
  const explicitVideo = outputPath(success(['video', '-', '--voice', 'off', '-o', join(artifacts, 'videos/topic.html')], videoDraft));
  assert.match(basename(explicitVideo), /^topic-[a-f0-9]{12}\.html$/);

  // A later config change must not turn a silent video patch into TTS or reset its appearance.
  success(['config', 'set', 'theme', 'blueprint']);
  success(['config', 'set', 'mode', 'light']);
  success(['config', 'set', 'style', 'strict']);
  success(['config', 'set', 'voice', 'local']);
  assert.equal(outputPath(success(['patch', video, '--panel', 'A'], '## A 流程\n```flow\n输入 -> 新输出\n```\n> 从输入得到新输出。\n')), video);
  const patchedVideo = await readFile(video, 'utf8');
  const videoRoot = patchedVideo.match(/<html\b[^>]*>/)[0];
  assert(videoRoot.includes('data-video'));
  assert(videoRoot.includes('data-theme="shadcn" data-mode="dark" data-style="off"'));
  assert(!patchedVideo.includes('<audio id="amv-audio"'), 'Silent patch started voice-over');
  success(['config', 'set', 'theme', 'shadcn']);

  const customDataDir = join(project, 'custom-renderer-state');
  success(['config', 'set', 'theme', 'blueprint'], undefined, { AM_HOME: customDataDir });
  assert.equal(JSON.parse(await readFile(join(customDataDir, 'config.json'), 'utf8')).theme, 'blueprint');
  assert.equal(JSON.parse(await readFile(join(dataDir, 'config.json'), 'utf8')).theme, 'shadcn');
  assert.equal(dirname(outputPath(success(['render', '-'], draft, { AM_HOME: customDataDir }))), join(artifacts, 'html'));
  assert(success(['help']).includes('~/.answer-me/html/'));
  console.log('HTML renderer: standalone render, home configuration, cross-project output paths, random suffixes, patch, and silent video settings passed.');
}

try {
  const listed = run(['add', root, '--list'], sandbox);
  assert(!listed.includes('sync-html-renderer'), 'Installer exposed the internal maintenance skill');
  for (const name of ['answer-me-with-diagram', 'answer-me-with-html', 'answer-me-with-video']) {
    assert(!new RegExp(`\\b${name}\\b(?!-)`).test(listed), `Installer exposed removed skill ${name}`);
  }
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
      if (name === 'answer-me-with-html-renderer') {
        await checkHtmlRenderer(join(installedRoot, name), project);
      }
      if (name === 'setup-project') {
        await checkSetupProject(join(installedRoot, name));
      }
      console.log(`Installed ${name}: all packaged files match.`);
    }
  }
  console.log('Installer grouping and independent skill installs passed.');
} finally {
  await rm(sandbox, { recursive: true, force: true });
}
