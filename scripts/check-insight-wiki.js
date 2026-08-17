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
let canvas;
try {
  canvas = JSON.parse(fs.readFileSync(path.join(wikiDir, 'learning-plan.canvas'), 'utf8'));
} catch {
  process.exit(1);
}
if (!Array.isArray(canvas.nodes) || !Array.isArray(canvas.edges)) process.exit(1);
const canvasFiles = new Set(canvas.nodes.filter((node) => node.type === 'file').map((node) => node.file));
if (required.some((name) => !canvasFiles.has(name))) process.exit(1);
const nodeIds = new Set(canvas.nodes.map((node) => node.id));
if (nodeIds.size !== canvas.nodes.length || ['observed', 'practice', 'demonstrated', 'transfer'].some((id) => !nodeIds.has(id))) process.exit(1);
if (canvas.nodes.some((node) => !node.id || !Number.isFinite(node.x) || !Number.isFinite(node.y) || !Number.isFinite(node.width) || !Number.isFinite(node.height))) process.exit(1);
const links = new Set(canvas.edges.map((edge) => `${edge.fromNode}->${edge.toNode}`));
if (['observed->practice', 'practice->demonstrated', 'demonstrated->transfer'].some((link) => !links.has(link))) process.exit(1);
if (canvas.edges.some((edge) => !edge.id || !nodeIds.has(edge.fromNode) || !nodeIds.has(edge.toNode))) process.exit(1);
const evidence = fs.readFileSync(path.join(wikiDir, 'evidence.md'), 'utf8');
const beats = fs.readFileSync(path.join(wikiDir, 'beats.md'), 'utf8');
const sources = fs.readFileSync(path.join(wikiDir, 'sources.md'), 'utf8');
const ids = [...evidence.matchAll(/\b[a-f0-9]{16}\b/g)].map((m) => m[0]);
if (!ids.length || ids.some((id) => !index.has(id))) process.exit(1);
if (!/Requires:/i.test(beats) || !/Grounds:/i.test(beats) || !/Evidence:/i.test(beats)) process.exit(1);
if (ids.some((id) => !sources.includes(id))) process.exit(1);
process.exit(0);
