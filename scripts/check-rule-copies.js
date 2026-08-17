#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const canonical = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8').trim();
const adapters = [
  '.agents/rules/learning-mode.md', '.clinerules/learning-mode.md',
  '.cursor/rules/learning-mode.mdc', '.github/copilot-instructions.md',
  '.junie/guidelines.md', '.kiro/steering/learning-mode.md',
  '.openclaw/skills/learning-mode/SKILL.md', '.qoder/rules/learning-mode.md',
  '.swival/skills/learning-mode/SKILL.md', '.windsurf/rules/learning-mode.md',
];

function body(text) {
  if (!text.startsWith('---\n')) return text.trim();
  const end = text.indexOf('\n---\n', 4);
  return end === -1 ? '' : text.slice(end + 5).trim();
}

const stale = adapters.filter((file) => body(fs.readFileSync(path.join(root, file), 'utf8')) !== canonical);
if (stale.length) {
  process.stderr.write(`Rule adapters differ from AGENTS.md:\n${stale.map((file) => `- ${file}`).join('\n')}\n`);
  process.exit(1);
}
