#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const [wikiDir, indexFile, ...args] = process.argv.slice(2);
const jsonOutput = args.includes('--json');

if (!wikiDir || !indexFile) {
  if (jsonOutput) {
    console.log(JSON.stringify({
      code: 'INVALID_ARGS',
      severity: 'error',
      subject: 'cli',
      evidence: { received: process.argv.slice(2) },
      supportedFixes: [{ action: 'provide_args', args: ['<wikiDir>', '<indexFile>', '[--json]'] }]
    }));
  }
  process.exit(2);
}

const index = new Map(fs.readFileSync(indexFile, 'utf8').trim().split('\n').map((line) => {
  const entry = JSON.parse(line);
  return [entry.id, entry];
}));

const required = ['README.md', 'evidence.md', 'beats.md', 'sources.md'];
let phaseChain;
try {
  phaseChain = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'schemas', 'learning-plan-canvas.schema.json'), 'utf8'))['x-learning-mode-phase-chain'];
} catch (e) {
  fail({ code: 'INVALID_PHASE_CHAIN_SCHEMA', severity: 'error', subject: 'schema', evidence: { error: e.message }, supportedFixes: [] });
}
if (!phaseChain || !Array.isArray(phaseChain.nodes) || !Array.isArray(phaseChain.edges)) {
  fail({ code: 'INVALID_PHASE_CHAIN_SCHEMA', severity: 'error', subject: 'schema', evidence: { phaseChain }, supportedFixes: [] });
}

// Helper to emit diagnostics and exit
function fail(diag) {
  if (jsonOutput) {
    console.log(JSON.stringify(diag));
  }
  process.exit(1);
}

function ok() {
  if (jsonOutput) {
    console.log(JSON.stringify({ ok: true }));
  }
  process.exit(0);
}

for (const name of required) {
  if (!fs.existsSync(path.join(wikiDir, name))) {
    fail({
      code: 'MISSING_REQUIRED_FILE',
      severity: 'error',
      subject: 'wiki.files',
      evidence: { missing: name, required },
      supportedFixes: [{ action: 'create_file', file: name }]
    });
  }
}

let canvas;
try {
  canvas = JSON.parse(fs.readFileSync(path.join(wikiDir, 'learning-plan.canvas'), 'utf8'));
} catch (e) {
  fail({
    code: 'INVALID_CANVAS_JSON',
    severity: 'error',
    subject: 'canvas',
    evidence: { error: e.message },
    supportedFixes: [{ action: 'regenerate_canvas', command: 'node scripts/generate-learning-plan-canvas.js <wikiDir>' }]
  });
}

if (!Array.isArray(canvas.nodes) || !Array.isArray(canvas.edges)) {
  fail({
    code: 'INVALID_CANVAS_STRUCTURE',
    severity: 'error',
    subject: 'canvas',
    evidence: { hasNodes: Array.isArray(canvas.nodes), hasEdges: Array.isArray(canvas.edges) },
    supportedFixes: [{ action: 'regenerate_canvas', command: 'node scripts/generate-learning-plan-canvas.js <wikiDir>' }]
  });
}

const canvasFiles = new Set(canvas.nodes.filter((node) => node.type === 'file').map((node) => node.file));
if (required.some((name) => !canvasFiles.has(name))) {
  const missing = required.filter((name) => !canvasFiles.has(name));
  fail({
    code: 'CANVAS_MISSING_REQUIRED_FILES',
    severity: 'error',
    subject: 'canvas.nodes',
    evidence: { missing, required, present: Array.from(canvasFiles) },
    supportedFixes: [{ action: 'regenerate_canvas', command: 'node scripts/generate-learning-plan-canvas.js <wikiDir>' }]
  });
}

const nodeIds = new Set(canvas.nodes.map((node) => node.id));
if (nodeIds.size !== canvas.nodes.length) {
  fail({
    code: 'DUPLICATE_NODE_IDS',
    severity: 'error',
    subject: 'canvas.nodes',
    evidence: { total: canvas.nodes.length, unique: nodeIds.size },
    supportedFixes: [{ action: 'regenerate_canvas', command: 'node scripts/generate-learning-plan-canvas.js <wikiDir>' }]
  });
}

const requiredPhases = phaseChain.nodes;
const missingPhases = requiredPhases.filter((id) => !nodeIds.has(id));
if (missingPhases.length > 0) {
  fail({
    code: 'MISSING_PHASE_NODE',
    severity: 'error',
    subject: 'canvas.nodes',
    evidence: { missing: missingPhases, required: requiredPhases, found: Array.from(nodeIds) },
    supportedFixes: [
      { action: 'regenerate_canvas', command: 'node scripts/generate-learning-plan-canvas.js <wikiDir>' },
      { action: 'add_nodes', nodes: missingPhases.map(id => ({ id, type: 'text', text: id.charAt(0).toUpperCase() + id.slice(1) })) }
    ]
  });
}

if (canvas.nodes.some((node) => !node.id || !Number.isFinite(node.x) || !Number.isFinite(node.y) || !Number.isFinite(node.width) || !Number.isFinite(node.height))) {
  const badNodes = canvas.nodes.filter((node) => !node.id || !Number.isFinite(node.x) || !Number.isFinite(node.y) || !Number.isFinite(node.width) || !Number.isFinite(node.height));
  fail({
    code: 'INVALID_NODE_GEOMETRY',
    severity: 'error',
    subject: 'canvas.nodes',
    evidence: { badNodes: badNodes.map(n => ({ id: n.id, x: n.x, y: n.y, width: n.width, height: n.height })) },
    supportedFixes: [{ action: 'regenerate_canvas', command: 'node scripts/generate-learning-plan-canvas.js <wikiDir>' }]
  });
}


const evidenceNode = canvas.nodes.find((node) => node.id === "evidence");
if (!Array.isArray(evidenceNode?.evidenceRefs) || !evidenceNode.evidenceRefs.length) {
  fail({
    code: "EVIDENCE_NOT_PINNED",
    severity: "error",
    subject: "canvas.nodes[evidence].evidenceRefs",
    evidence: { present: Array.isArray(evidenceNode?.evidenceRefs), count: evidenceNode?.evidenceRefs?.length || 0 },
    supportedFixes: [{ action: "regenerate_canvas", command: "node scripts/generate-learning-plan-canvas.js <wikiDir> --index <insight-index.jsonl>" }]
  });
}

const links = new Set(canvas.edges.map((edge) => `${edge.fromNode}->${edge.toNode}`));
const requiredLinks = phaseChain.edges;
const missingLinks = requiredLinks.filter((link) => !links.has(link));
if (missingLinks.length > 0) {
  fail({
    code: 'MISSING_PHASE_EDGE',
    severity: 'error',
    subject: 'canvas.edges',
    evidence: { missing: missingLinks, required: requiredLinks, present: Array.from(links) },
    supportedFixes: [{ action: 'regenerate_canvas', command: 'node scripts/generate-learning-plan-canvas.js <wikiDir>' }]
  });
}

if (canvas.edges.some((edge) => !edge.id || !nodeIds.has(edge.fromNode) || !nodeIds.has(edge.toNode))) {
  const badEdges = canvas.edges.filter((edge) => !edge.id || !nodeIds.has(edge.fromNode) || !nodeIds.has(edge.toNode));
  fail({
    code: 'INVALID_EDGE_REFERENCE',
    severity: 'error',
    subject: 'canvas.edges',
    evidence: { badEdges: badEdges.map(e => ({ id: e.id, from: e.fromNode, to: e.toNode, fromExists: nodeIds.has(e.fromNode), toExists: nodeIds.has(e.toNode) })) },
    supportedFixes: [{ action: 'regenerate_canvas', command: 'node scripts/generate-learning-plan-canvas.js <wikiDir>' }]
  });
}

const evidence = fs.readFileSync(path.join(wikiDir, 'evidence.md'), 'utf8');
const beats = fs.readFileSync(path.join(wikiDir, 'beats.md'), 'utf8');
const sources = fs.readFileSync(path.join(wikiDir, 'sources.md'), 'utf8');

const ids = [...evidence.matchAll(/\b[a-f0-9]{16}\b/g)].map((m) => m[0]);
if (!ids.length) {
  fail({
    code: 'NO_EVIDENCE_IDS',
    severity: 'error',
    subject: 'evidence.md',
    evidence: { contentLength: evidence.length },
    supportedFixes: [{ action: 'add_evidence_ids', hint: 'Evidence must contain 16-char hex IDs from index' }]
  });
}

const missingFromIndex = ids.filter((id) => !index.has(id));
if (missingFromIndex.length > 0) {
  fail({
    code: 'EVIDENCE_ID_NOT_IN_INDEX',
    severity: 'error',
    subject: 'evidence.md',
    evidence: { missing: missingFromIndex, totalInEvidence: ids.length, indexSize: index.size },
    supportedFixes: [
      { action: 'rebuild_index', command: 'node hooks/record-insights.js (via Stop hook)' },
      { action: 'remove_stale_ids', ids: missingFromIndex }
    ]
  });
}

if (!/Requires:/i.test(beats) || !/Grounds:/i.test(beats) || !/Evidence:/i.test(beats)) {
  fail({
    code: 'INVALID_BEATS_FORMAT',
    severity: 'error',
    subject: 'beats.md',
    evidence: { hasRequires: /Requires:/i.test(beats), hasGrounds: /Grounds:/i.test(beats), hasEvidence: /Evidence:/i.test(beats) },
    supportedFixes: [{ action: 'regenerate_beats', command: 'Invoke writing-beats skill on evidence.md' }]
  });
}

const missingFromSources = ids.filter((id) => !sources.includes(id));
if (missingFromSources.length > 0) {
  fail({
    code: 'EVIDENCE_ID_MISSING_FROM_SOURCES',
    severity: 'error',
    subject: 'sources.md',
    evidence: { missing: missingFromSources, totalInEvidence: ids.length },
    supportedFixes: [{ action: 'regenerate_sources', command: 'Invoke writing-beats/writing-shape to refresh sources.md' }]
  });
}

ok();
