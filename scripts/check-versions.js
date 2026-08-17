#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const manifests = [
  '.codex-plugin/plugin.json', '.claude-plugin/plugin.json',
  '.devin-plugin/plugin.json', '.github/plugin/plugin.json',
  '.qoder-plugin/plugin.json', 'gemini-extension.json', 'plugin.json', 'plugin.yaml',
];

function version(file) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  return file.endsWith('.json') ? JSON.parse(text).version : text.match(/^version:\s*(\S+)$/m)?.[1];
}

const expected = version('.codex-plugin/plugin.json');
const stale = manifests.filter((file) => version(file) !== expected);
if (stale.length || !expected) {
  process.stderr.write(`Expected version ${expected || 'missing'}; mismatches:\n${stale.map((file) => `- ${file}: ${version(file) || 'missing'}`).join('\n')}\n`);
  process.exit(1);
}
