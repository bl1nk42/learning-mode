#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const required = ['README.md', 'evidence.md', 'beats.md', 'sources.md'];

function titleFor(wikiDir) {
  const readme = fs.readFileSync(path.join(wikiDir, 'README.md'), 'utf8');
  return readme.match(/^#\s+(.+)$/m)?.[1].trim() || path.basename(wikiDir);
}

function buildCanvas(wikiDir) {
  for (const name of required) {
    if (!fs.existsSync(path.join(wikiDir, name))) throw new Error(`Missing ${name}`);
  }
  const title = titleFor(wikiDir);
  const files = required.map((file, index) => ({
    id: file.replace('.md', ''), type: 'file', file,
    x: 0, y: 140 + index * 220, width: 360, height: 180,
  }));
  const phases = [
    ['observed', 'Observed'], ['practice', 'Practice'],
    ['demonstrated', 'Demonstrated'], ['transfer', 'Transfer'],
  ].map(([id, text], index) => ({
    id, type: 'text', text, x: 460, y: 140 + index * 180, width: 220, height: 100,
  }));
  return {
    nodes: [
      { id: 'topic', type: 'text', text: `# ${title}`, x: 0, y: 0, width: 680, height: 80 },
      ...files,
      ...phases,
    ],
    edges: [
      { id: 'evidence-observed', fromNode: 'evidence', toNode: 'observed' },
      { id: 'observed-practice', fromNode: 'observed', toNode: 'practice' },
      { id: 'practice-demonstrated', fromNode: 'practice', toNode: 'demonstrated' },
      { id: 'demonstrated-transfer', fromNode: 'demonstrated', toNode: 'transfer' },
    ],
  };
}

function writeCanvas(wikiDir) {
  fs.writeFileSync(path.join(wikiDir, 'learning-plan.canvas'), `${JSON.stringify(buildCanvas(wikiDir), null, 2)}\n`);
}

if (require.main === module) {
  const [wikiDir] = process.argv.slice(2);
  if (!wikiDir) process.exit(2);
  try {
    writeCanvas(wikiDir);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}

module.exports = { buildCanvas, writeCanvas };
