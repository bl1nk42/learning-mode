#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { appendLogs, readInput, readMode, writeStatusFlag } = require('./runtime');

function strings(value, result) {
  if (typeof value === 'string') result.push(value);
  else if (Array.isArray(value)) value.forEach((item) => strings(item, result));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => strings(item, result));
}

function references(block, cwd) {
  const root = path.resolve(cwd || process.cwd());
  return [...block.matchAll(/`([^`\n]+):(\d+)`/g)].flatMap((match) => {
    const file = match[1];
    const absolute = path.resolve(root, file);
    const relative = path.relative(root, absolute);
    if (relative.startsWith('..') || path.isAbsolute(relative)) return [];
    try {
      const line = Number(match[2]);
      if (line > fs.readFileSync(absolute, 'utf8').split('\n').length) return [];
      return [{ file, line }];
    } catch (_) {
      return [];
    }
  });
}

function insights(text, cwd) {
  const found = [];
  const unquoted = text.replace(/^>\s?/gm, '');
  const pattern = /★\s*Insight[^\n]*\n([\s\S]*?)(?:\n[─—-]{8,}(?:\n|$)|$)/g;
  for (const match of unquoted.matchAll(pattern)) {
    const bullets = match[1].split('\n')
      .map((line) => line.trim().replace(/^[-*]\s+/, ''))
      .filter(Boolean);
    const refs = references(match[1], cwd);
    if (bullets.length && refs.length) found.push({ insights: bullets, references: refs });
  }
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
    appendLogs(input.cwd, all.flatMap((text) => insights(text, input.cwd)));
    writeStatusFlag(input.cwd, 'default');
  } catch (_) { /* transcript_path is optional and host-owned. */ }
}
