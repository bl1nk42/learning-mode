#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateCanvas } = require('./validate-learning-plan-canvas');

const required = ['README.md', 'evidence.md', 'beats.md', 'sources.md'];
const phaseChain = ['observed', 'practice', 'demonstrated', 'transfer'];
const templatePath = path.join(__dirname, '..', 'dashboard', 'learning-mode-dashboard.html');

function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return fallback; } }
function readText(file) { try { return fs.readFileSync(file, 'utf8'); } catch (_) { return ''; } }
function unique(values) { return [...new Set(values)]; }
function evidenceIds(text) { return unique([...text.matchAll(/\b[a-f0-9]{16}\b/g)].map((m) => m[0])); }
function sourceBundle(wikiDir) { return required.map((name) => name + '\0' + readText(path.join(wikiDir, name))).join('\0'); }

function collect(wikiDir, indexFile) {
  const evidence = readText(path.join(wikiDir, 'evidence.md'));
  const beats = readText(path.join(wikiDir, 'beats.md'));
  const sources = readText(path.join(wikiDir, 'sources.md'));
  const ids = evidenceIds(evidence);
  const index = readText(indexFile).split('\n').filter(Boolean).flatMap((line) => { try { return [JSON.parse(line)]; } catch (_) { return []; } });
  const indexIds = new Set(index.map((entry) => entry.id));
  const canvasPath = path.join(wikiDir, 'learning-plan.canvas');
  const canvas = readJson(canvasPath, null);
  const receipt = readJson(path.join(wikiDir, 'learning-plan.receipt.json'), null);
  const canvasText = readText(canvasPath);
  const sourceHash = sha256(sourceBundle(wikiDir));
  const canvasHash = sha256(canvasText);
  const schema = canvas ? validateCanvas(canvas) : { ok: false, errors: [{ message: 'Canvas file is missing or invalid JSON' }] };
  const nodeIds = new Set(canvas?.nodes?.map((node) => node.id) || []);
  const edgeKeys = new Set(canvas?.edges?.map((edge) => `${edge.fromNode}->${edge.toNode}`) || []);
  const invalidIds = ids.filter((id) => !indexIds.has(id));
  const missingSources = ids.filter((id) => !sources.includes(id));
  const phases = phaseChain.map((phase) => ({ name: phase, present: nodeIds.has(phase) }));
  const phaseEdges = phaseChain.slice(0, -1).map((from, i) => ({ from, to: phaseChain[i + 1], present: edgeKeys.has(`${from}->${phaseChain[i + 1]}`) }));
  const receiptCurrent = Boolean(receipt && receipt.sourceBundleSha256 === sourceHash && receipt.canvasSha256 === canvasHash);
  const validationIssues = [
    ...invalidIds.map((id) => ({ severity: 'error', code: 'EVIDENCE_ID_NOT_IN_INDEX', subject: id })),
    ...missingSources.map((id) => ({ severity: 'error', code: 'EVIDENCE_ID_MISSING_FROM_SOURCES', subject: id })),
    ...(schema.ok ? [] : [{ severity: 'error', code: 'INVALID_CANVAS_SCHEMA', subject: 'learning-plan.canvas' }]),
    ...(!receiptCurrent ? [{ severity: 'error', code: 'STALE_CANVAS_RECEIPT', subject: 'learning-plan.receipt.json' }] : []),
    ...phases.filter((phase) => !phase.present).map((phase) => ({ severity: 'error', code: 'MISSING_PHASE_NODE', subject: phase.name })),
    ...phaseEdges.filter((edge) => !edge.present).map((edge) => ({ severity: 'error', code: 'MISSING_PHASE_EDGE', subject: `${edge.from}->${edge.to}` })),
  ];
  const beatSections = [...beats.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
  const projectCounts = {};
  for (const entry of index) { const project = entry.source?.project || 'unknown'; projectCounts[project] = (projectCounts[project] || 0) + 1; }
  return {
    generatedAt: new Date().toISOString(),
    wiki: { title: (readText(path.join(wikiDir, 'README.md')).match(/^#\s+(.+)$/m) || [])[1] || path.basename(wikiDir), path: wikiDir },
    metrics: { evidenceIds: ids.length, indexedInsights: index.length, sourceLinks: missingSources.length === 0 ? ids.length : ids.length - missingSources.length, beatSections: beatSections.length, validationIssues: validationIssues.length },
    validation: { ok: validationIssues.length === 0, issues: validationIssues, schemaOk: schema.ok, receiptCurrent, sourceBundleSha256: sourceHash, canvasSha256: canvasHash },
    phases, phaseEdges, beatSections, projectCounts,
  };
}

function render(data) {
  const json = JSON.stringify(data).replace(/<\/script/gi, '<\\/script');
  return readText(templatePath).replace('__DATA__', json);
}

if (require.main === module) {
  const [wikiDir, indexFile, output = 'learning-mode-dashboard.html'] = process.argv.slice(2);
  if (!wikiDir || !indexFile) { console.error('Usage: node scripts/generate-learning-mode-dashboard.js <wikiDir> <indexFile> [output]'); process.exit(2); }
  fs.writeFileSync(output, render(collect(path.resolve(wikiDir), path.resolve(indexFile))), 'utf8');
  console.log(JSON.stringify({ output: path.resolve(output), template: templatePath }));
}

module.exports = { collect, render, templatePath };
