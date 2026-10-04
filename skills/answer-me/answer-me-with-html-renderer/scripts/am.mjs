#!/usr/bin/env node
// Repository defaults around the unmodified upstream CLI. See ../UPSTREAM.md.
import { randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const args = process.argv.slice(2);
let command;
let hasOutput = false;
try {
  const parsed = parseArgs({
    args,
    allowPositionals: true,
    strict: false,
    options: {
      out: { type: 'string', short: 'o' },
      ...Object.fromEntries(['theme', 'template', 'style', 'mode', 'voice', 'panel', 'from', 'days']
        .map((name) => [name, { type: 'string' }])),
    },
  });
  command = parsed.positionals[0];
  hasOutput = Object.hasOwn(parsed.values, 'out');
} catch {
  // Let the upstream CLI report malformed arguments with its normal exit code and usage.
}

// Keep this implementation's settings and cache separate from a global upstream install.
process.env.AM_HOME ||= resolve('.answer-me/html-renderer');
// Updates are distributed by Plasticine-Yang/skills, not the upstream installer.
process.env.AM_NO_UPDATE_CHECK = '1';

if ((command === 'render' || command === 'video') && !hasOutput) {
  const directory = command === 'render' ? 'html' : 'videos';
  const filename = `renderer-${Date.now()}-${randomUUID().slice(0, 8)}.html`;
  process.argv.splice(2, 0, '--out', resolve(join('.answer-me', directory, filename)));
}

if (!args.length || command === 'help' || args.includes('--help') || args.includes('-h')) {
  console.log('answer-me-with-html-renderer：HTML 默认写入 .answer-me/html/，视频写入 .answer-me/videos/。');
  console.log('配置与缓存默认在 .answer-me/html-renderer/；以下为上游通用帮助，目录以本移植版为准。\n');
}

await import('./upstream/am.mjs');
