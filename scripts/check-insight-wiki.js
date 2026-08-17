#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const [wikiDir, indexFile] = process.argv.slice(2);
if (!wikiDir || !indexFile) process.exit(2);
const index = new Map(fs.readFileSync(indexFile, 'utf8').trim().split('\n').map((line) => {
  const entry = JSON.parse(line); return [entry.id, entry];
}));
const required = ['README.md', 'evidence.md', 'beats.md', 'sources.md'];
for (const name of required) if (!fs.existsSync(path.join(wikiDir, name))) process.exit(1);
const evidence = fs.readFileSync(path.join(wikiDir, 'evidence.md'), 'utf8');
const beats = fs.readFileSync(path.join(wikiDir, 'beats.md'), 'utf8');
const sources = fs.readFileSync(path.join(wikiDir, 'sources.md'), 'utf8');
const ids = [...evidence.matchAll(/\b[a-f0-9]{16}\b/g)].map((m) => m[0]);
if (!ids.length || ids.some((id) => !index.has(id))) process.exit(1);
if (!/Requires:/i.test(beats) || !/Grounds:/i.test(beats) || !/Evidence:/i.test(beats)) process.exit(1);
if (ids.some((id) => !sources.includes(id))) process.exit(1);
process.exit(0);
