#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, basename, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const marketplace = JSON.parse(await readFile(join(root, '.claude-plugin/marketplace.json'), 'utf8'));
const names = new Set();
const declared = new Set();
const groups = new Set();
const rootLicensedSkills = new Set([
  'align-first',
  'setup-project',
  'answer-me-with-text',
]);
let referenceCount = 0;

function insideRoot(path) {
  assert(path.startsWith(`${root}${sep}`), `Path escapes repository: ${path}`);
  return path;
}

function parseYaml(text, path) {
  const doc = parseDocument(text, { uniqueKeys: true });
  assert.equal(doc.errors.length, 0, `${path}: ${doc.errors.map((e) => e.message).join('; ')}`);
  return doc.toJS();
}

async function filesUnder(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    assert(!entry.isSymbolicLink(), `Unexpected symlink: ${relative(root, path)}`);
    if (entry.isDirectory()) files.push(...await filesUnder(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

assert(Array.isArray(marketplace.plugins) && marketplace.plugins.length > 0, 'No installation groups');
for (const plugin of marketplace.plugins) {
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(plugin.name), 'Invalid group name');
  assert(!groups.has(plugin.name), `Duplicate group: ${plugin.name}`);
  groups.add(plugin.name);
  assert(typeof plugin.source === 'string' && plugin.source.startsWith('./'), `${plugin.name}: source must be local`);
  assert(Array.isArray(plugin.skills) && plugin.skills.length > 0, `${plugin.name}: no skills declared`);
  const base = resolve(root, plugin.source);
  assert(base === root || base.startsWith(`${root}${sep}`), 'Group source escapes repository');
  for (const skillPath of plugin.skills) {
    assert(skillPath.startsWith('./'), `Invalid skill path: ${skillPath}`);
    const dir = insideRoot(resolve(base, skillPath));
    assert(!declared.has(dir), `Skill belongs to multiple groups: ${skillPath}`);
    declared.add(dir);
    const path = join(dir, 'SKILL.md');
    const text = await readFile(path, 'utf8');
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    assert(frontmatter, `${skillPath}: missing YAML frontmatter`);
    const metadata = parseYaml(frontmatter[1], relative(root, path));
    assert.equal(metadata.name, basename(dir), `${skillPath}: name must match directory`);
    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.name), `${skillPath}: invalid name`);
    assert(typeof metadata.description === 'string' && metadata.description.trim(), `${skillPath}: missing description`);
    assert(!names.has(metadata.name), `Duplicate skill name: ${metadata.name}`);
    names.add(metadata.name);
    if (metadata.name === 'setup-project') {
      assert.equal(metadata['disable-model-invocation'], true, `${metadata.name} must be manually invoked`);
      const agentConfig = parseYaml(await readFile(join(dir, 'agents/openai.yaml'), 'utf8'), `${metadata.name}/agents/openai.yaml`);
      assert.equal(agentConfig.policy?.allow_implicit_invocation, false, `${metadata.name} must disable implicit invocation in Codex`);
    }
    if (metadata.name === 'setup-project') {
      assert((await readFile(join(dir, 'licenses/mattpocock-skills.txt'), 'utf8')).includes('Copyright (c) 2026 Matt Pocock'));
    }
    // Original skills inherit the root license; imports retain their own copy.
    const licensePath = join(rootLicensedSkills.has(metadata.name) ? root : dir, 'LICENSE');
    assert((await readFile(licensePath, 'utf8')).includes('MIT License'), `${skillPath}: license missing`);
    for (const file of await filesUnder(dir)) {
      const contents = await readFile(file, 'utf8');
      if (/\.ya?ml$/.test(file)) parseYaml(contents, relative(root, file));
      if (!file.endsWith('.md')) continue;
      // These upstream templates refer to references relative to the skill root.
      const references = new Set([
        ...Array.from(contents.matchAll(/`(references\/[^`\s]+)`/g), (m) => m[1]),
        ...Array.from(contents.matchAll(/\]\((references\/[^)\s]+)\)/g), (m) => m[1]),
      ]);
      for (const reference of references) {
        if (reference.includes('<')) continue; // Deliberate template placeholder.
        const target = resolve(dir, reference.split('#')[0]);
        assert(target.startsWith(`${dir}${sep}`), `${file}: reference escapes skill`);
        assert((await stat(target)).isFile(), `${relative(root, file)}: missing ${reference}`);
        referenceCount++;
      }
    }
  }
}

// Prevent undisclosed skills from appearing in the CLI's automatic discovery.
for (const file of await filesUnder(join(root, 'skills'))) {
  if (basename(file) === 'SKILL.md') {
    assert(declared.has(dirname(file)), `Skill missing from marketplace: ${relative(root, file)}`);
  }
}
// The repository maintenance skill stays locally available and hidden from installation.
const syncDir = join(root, '.agents/skills/sync-html-renderer');
assert(!declared.has(syncDir), 'Internal sync skill must not appear in marketplace');
const syncText = await readFile(join(syncDir, 'SKILL.md'), 'utf8');
const syncFrontmatter = syncText.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
assert(syncFrontmatter, 'Internal sync skill: missing YAML frontmatter');
const syncMetadata = parseYaml(syncFrontmatter[1], '.agents/skills/sync-html-renderer/SKILL.md');
assert.equal(syncMetadata.name, 'sync-html-renderer');
assert.equal(syncMetadata.metadata?.internal, true, 'Internal sync skill must be hidden from CLI discovery');
assert.equal(syncMetadata['disable-model-invocation'], true, 'Internal sync skill must be manually invoked');
const syncAgentConfig = parseYaml(await readFile(join(syncDir, 'agents/openai.yaml'), 'utf8'), '.agents/skills/sync-html-renderer/agents/openai.yaml');
assert.equal(syncAgentConfig.policy?.allow_implicit_invocation, false, 'Internal sync skill must disable implicit invocation in Codex');
for (const file of await filesUnder(join(root, '.github/workflows'))) {
  if (/\.ya?ml$/.test(file)) parseYaml(await readFile(file, 'utf8'), relative(root, file));
}
console.log(`Checked ${names.size} skills in ${groups.size} group(s), ${referenceCount} local references, and workflow YAML.`);
