# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Learning Mode (v0.3.0) — Portable learning-oriented guidance plugin for coding agents. Captures insights during sessions, builds knowledge maps, and delivers pedagogical tours.

## Commands

```sh
# Tests
python3 -B -m pytest -q                              # Python test suite
node scripts/learning-map/collect-facets.test.js      # Data collection seam
node scripts/learning-map/schema-validate.test.js     # Schema validation seam
node scripts/learning-map/dashboard-load.test.js      # Dashboard transform seam
node scripts/learning-map/plugin-eval.test.js         # Plugin structural checks
node scripts/plugin-sync.test.js                      # Config sync consistency

# Config sync
node scripts/sync-plugin-configs.js                   # Dry-run
node scripts/sync-plugin-configs.js --apply           # Write all 15 platform configs

# Validation
node scripts/check-rule-copies.js                     # AGENTS.md matches all adapters
node scripts/check-versions.js                        # Version consistency across manifests
```

## Architecture

### Data Pipeline
```
Session Stop hook → record-insights.js → ~/.learning-mode/insight-index.jsonl
                → auto-collect-learning-map.js → collect-facets.js
                → ~/.learning-mode/session-maps/<project-id>-<date>.json
```

### Agent Pipeline (learning-map skill)
```
insight-collector → relationship-builder → map-generator
  (5 sources)       (5 edge types)        (nodes + edges + tour → session map)
```

### Plugin Config System
`plugin-source.json` is single source of truth. `scripts/sync-plugin-configs.js` generates:
- `plugin.json` × 7 (Claude, Codex, GitHub, Devin, Grok, Qoder, root)
- `marketplace.json` × 3
- `hooks.json` × 2 + `.cursor/hooks.json`
- `opencode.json`, `gemini-extension.json`
- `plugin.yaml` maintained separately (Pi/Hermes)

### Hook Events
| Event | Script | Purpose |
|-------|--------|---------|
| SessionStart | session-start.js | Load state, inject AGENTS.md |
| UserPromptSubmit | mode-tracker.js | Track $learning-mode on/off |
| SubagentStart | subagent-start.js | Configure subagent context |
| Stop | record-insights.js | Extract ★ Insight blocks |
| Stop | auto-collect-learning-map.js | Create session map |

## Key Files

- `AGENTS.md` — Canonical context injected into all agent adapters (must match `.cursor/rules/`, `.github/copilot-instructions.md`)
- `plugin-source.json` — Source of truth for version, hooks, author, keywords across all platforms
- `schemas/session-map.schema.json` — JSON Schema draft 2020-12 for session maps
- `schemas/plugin.schema.json` — JSON Schema draft-07 for plugin manifests (`additionalProperties: false`)
- `hooks/runtime.js` — Shared hook utilities: `readInput`, `appendLogs`, `emit`, `readMode`
- `scripts/learning-map/config.js` — Vault path resolution (`LEARNING_MODE_VAULT` env → `~/.learning-mode/config.json` → default)

## Conventions

- **Thai** in UI labels, comments, session map views (`ทั้งหมด`, `ลำดับการเรียนรู้`)
- Node IDs: `<type>:<slugified-name>` (e.g., `insight:context-building-pattern`)
- Edge types: `builds_on`, `related_to`, `contradicts`, `prerequisite_of`, `applies_to`
- Session map source: `oneOf: [string, {type, id, file, line}]`
- Colors: oklch (not hex) — `--primary: oklch(0.765 0.149 162.5)`
- No external npm dependencies (stdlib only)
- Every insight needs `file:line` evidence
- Every edge needs description

## File Locations

- Vault: `~/.learning-mode/` (override: `LEARNING_MODE_VAULT`)
- Session maps: `~/.learning-mode/session-maps/<id>-YYYY-MM-DD.json`
- Insight index: `~/.learning-mode/insight-index.jsonl`
- Per-project: `<project>/.learning-mode/insights.jsonl`
