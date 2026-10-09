#!/usr/bin/env node
// Repository defaults around the unmodified upstream CLI. See ../UPSTREAM.md.
import { randomBytes } from 'node:crypto';
import { homedir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const args = process.argv.slice(2);
let command;
let parsed;
try {
  parsed = parseArgs({
    args,
    tokens: true,
    allowPositionals: true,
    strict: false,
    options: {
      out: { type: 'string', short: 'o' },
      ...Object.fromEntries(['theme', 'template', 'style', 'mode', 'voice', 'panel', 'from', 'days']
        .map((name) => [name, { type: 'string' }])),
    },
  });
  command = parsed.positionals[0];
} catch {
  // Let the upstream CLI report malformed arguments with its normal exit code and usage.
}

// Keep this implementation's settings and cache separate from a global upstream install.
const home = join(homedir(), '.answer-me');
process.env.AM_HOME ||= join(home, 'html-renderer');
// Updates are distributed by Plasticine-Yang/skills, not the upstream installer.
process.env.AM_NO_UPDATE_CHECK = '1';

if (command === 'render' || command === 'video') {
  const directory = command === 'render' ? 'html' : 'videos';
  const requested = parsed.values.out;
  const expanded = requested?.startsWith('~/') ? join(homedir(), requested.slice(2)) : requested;
  const target = expanded ? resolve(expanded) : join(home, directory, 'renderer.html');
  const extension = extname(target);
  const stem = extension ? target.slice(0, -extension.length) : target;
  const output = `${stem}-${randomBytes(6).toString('hex')}${extension || '.html'}`;
  // Replace every output option, preserving positional arguments after --.
  const removed = new Set();
  for (const token of parsed.tokens) {
    if (token.kind === 'option' && token.name === 'out') {
      removed.add(token.index);
      if (!token.inlineValue) removed.add(token.index + 1);
    }
  }
  process.argv.splice(2, args.length, '--out', output, ...args.filter((_, index) => !removed.has(index)));
}

if (!args.length || command === 'help' || args.includes('--help') || args.includes('-h')) {
  console.log('answer-me-with-html-renderer：HTML 默认写入 ~/.answer-me/html/，视频写入 ~/.answer-me/videos/。');
  console.log('新产物的文件名自动追加 12 位随机 hash；-o / --out 保留指定目录，patch 保留原路径。');
  console.log('配置与缓存默认在 ~/.answer-me/html-renderer/；以下为上游通用帮助，目录以本移植版为准。\n');
}

await import('./upstream/am.mjs');
