#!/usr/bin/env node
const fs = require('fs');
const { appendLogs, readInput, readMode, writeStatusFlag } = require('./runtime');
function strings(value, result) {
  if (typeof value === 'string') result.push(value);
  else if (Array.isArray(value)) value.forEach((item) => strings(item, result));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => strings(item, result));
}
function markers(text) {
  const found = [];
  const pattern = /<!--\s*learning-mode-log\s*:\s*(\{[\s\S]*?\})\s*-->/g;
  for (const match of text.matchAll(pattern)) { try { found.push(JSON.parse(match[1])); } catch (_) { /* Ignore malformed model output. */ } }
  return found;
}
const input = readInput();
if (readMode(input.cwd) !== 'off' && input.transcript_path) {
  try {
    const all = [];
    const raw = fs.readFileSync(input.transcript_path, 'utf8');
    try {
      strings(JSON.parse(raw), all);
    } catch (_) {
      for (const line of raw.split('\n').filter(Boolean)) {
        try { strings(JSON.parse(line), all); } catch (_) { all.push(line); }
      }
    }
    appendLogs(input.cwd, all.flatMap(markers));
    writeStatusFlag(input.cwd, 'default');
  } catch (_) { /* transcript_path is optional and host-owned. */ }
}
