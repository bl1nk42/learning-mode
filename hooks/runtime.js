const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

function readInput() {
  try { return JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch (_) { return {}; }
}
function workspaceDir(cwd) { return path.join(path.resolve(cwd || process.cwd()), '.learning-mode'); }
function modePath(cwd) { return path.join(workspaceDir(cwd), 'config.json'); }
function readMode(cwd) {
  try { return JSON.parse(fs.readFileSync(modePath(cwd), 'utf8')).mode === 'off' ? 'off' : 'default'; } catch (_) { return 'default'; }
}
function setMode(cwd, mode) {
  fs.mkdirSync(workspaceDir(cwd), { recursive: true });
  fs.writeFileSync(modePath(cwd), JSON.stringify({ mode }, null, 2) + '\n');
}
function logPath(cwd) { return path.join(workspaceDir(cwd), 'insights.jsonl'); }
function userHome() { return process.env.LEARNING_MODE_HOME || path.join(os.homedir(), '.learning-mode'); }
function userIndexPath() { return path.join(userHome(), 'insight-index.jsonl'); }
function readLogs(cwd) {
  try { return fs.readFileSync(logPath(cwd), 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line)); } catch (_) { return []; }
}
function normalize(value) { return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
function appendLogs(cwd, entries) {
  if (!entries.length || readMode(cwd) === 'off') return 0;
  const existing = new Set(readLogs(cwd).map((entry) => entry.id));
  const additions = [];
  for (const entry of entries) {
    if (!Array.isArray(entry.insights) || !entry.insights.length || !entry.references?.length) continue;
    const id = crypto.createHash('sha256')
      .update(`${entry.insights.map(normalize).join('\n')}\n${JSON.stringify(entry.references)}`)
      .digest('hex').slice(0, 16);
    if (existing.has(id)) continue;
    existing.add(id);
    additions.push({ id, recordedAt: new Date().toISOString(), insights: entry.insights, references: entry.references });
  }
  if (!additions.length) return 0;
  fs.mkdirSync(workspaceDir(cwd), { recursive: true });
  fs.appendFileSync(logPath(cwd), additions.map((entry) => JSON.stringify(entry)).join('\n') + '\n');
  try {
    fs.mkdirSync(userHome(), { recursive: true });
    const project = path.resolve(cwd || process.cwd());
    const indexed = additions.map((entry) => ({ ...entry, source: { project, log: logPath(cwd) } }));
    fs.appendFileSync(userIndexPath(), indexed.map((entry) => JSON.stringify(entry)).join('\n') + '\n');
  } catch (_) { /* The local project log remains authoritative if the user index is unavailable. */ }
  return additions.length;
}
function emit(eventName, additionalContext) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: eventName, additionalContext } }));
}
function writeStatusFlag(cwd, mode) {
  const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  try {
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(path.join(claudeDir, '.learning-mode-active'), JSON.stringify({ cwd: path.resolve(cwd || process.cwd()), mode, insights: readLogs(cwd).length }));
  } catch (_) { /* A badge must never make a hook fail. */ }
}
module.exports = { appendLogs, emit, readInput, readLogs, readMode, setMode, userIndexPath, writeStatusFlag };
