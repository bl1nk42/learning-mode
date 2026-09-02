# Learning Mode Improvement Plan

Based on analysis of baseline commit f515acc and 4 reference repositories:
- archify (interactive diagram patterns)
- obsidian-mind (wiki/vault structure)
- sim (workflow/agent graph schema)
- ECC (multi-host plugin capabilities)

---

## Implementation checklist

- [x] Phase 0.1 — CI runs the Python regression suite.
- [x] Phase 0.2 — CI pins Node 20.
- [x] Phase 0.3–0.5 — Validator emits JSON diagnostics and covers required failure modes.
- [ ] Phase 1 — Canvas delivery (schema, receipt, and layout complete; validation, evidence pinning, and comparison remain).
  - [x] 1.1 Canvas JSON Schema
  - [x] 1.2 Schema-backed phase-chain validation
  - [x] 1.3 Atomic delivery and receipt
  - [x] 1.4 Evidence-aware grid layout
  - [x] 1.5 Evidence revision pinning
  - [ ] 1.6 Wiki comparison
  - [ ] 1.7 Guided views sidecar (optional)
- [ ] Phase 2 — Insight-store migration and visibility rules.
- [ ] Phase 3 — Workflow graph execution.
- [ ] Phase 4 — Multi-host hardening.
- [ ] Phase 5 — Long-term extensions.

---

## Phase 0 — Baseline + CI + Diagnostics (Quick Wins)

### 0.1 Add pytest to CI
**File**: `.github/workflows/test.yml`
**Action**: Add job that runs `python3 -B -m pytest -q`
**Why**: pytest passes locally (7/7) but CI never runs it → regression risk

```yaml
jobs:
  consistency:
    # ... existing ...
  tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install pytest
        run: pip install pytest
      - name: Run tests
        run: python3 -B -m pytest -q
```

### 0.2 Pin Node version in CI
**File**: `.github/workflows/test.yml:19`
**Current**: `node-version: '22'`
**Issue**: Sandbox runs Node 20.20.1
**Fix**: Use matrix or pin to `'20'`

### 0.3 Structured Diagnostics for Validator
**File**: `scripts/check-insight-wiki.js`
**Current**: All failures → `process.exit(1)` with no detail
**Target**: Emit JSON `{ code, severity, subject, evidence, supportedFixes }`
**Reference**: archify's `renderers/shared/diagnostics.mjs`

Example output:
```json
{
  "code": "MISSING_PHASE_NODE",
  "severity": "error",
  "subject": "canvas.nodes",
  "evidence": { "missing": ["observed", "practice"] },
  "supportedFixes": [
    { "action": "add_node", "node": { "id": "observed", "type": "text", ... } }
  ]
}
```

### 0.4 Add `--json` Flag to Validator
**File**: `scripts/check-insight-wiki.js`
**Action**: Parse `--json` arg → output structured diagnostics instead of exit codes

### 0.5 Test Cases for Canvas Validation Failures
**File**: `tests/test_insight_wiki_eval.py` (add cases)
**Cases**: missing phase, broken edge, invalid coordinate, missing required file, stale evidence ID

**Acceptance**: CI runs pytest + validator emits structured JSON with `supportedFixes` on failure

---

## Phase 1 — Canvas Schema + Atomic Delivery (from archify)

### 1.1 JSON Schema for Canvas
**New file**: `schemas/learning-plan-canvas.schema.json` (draft 2020-12)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["nodes", "edges", "meta"],
  "properties": {
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "type", "x", "y", "width", "height"],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-zA-Z][a-zA-Z0-9_-]*$" },
          "type": { "enum": ["file", "text", "group"] },
          "x": { "type": "number", "finite": true },
          "y": { "type": "number", "finite": true },
          "width": { "type": "number", "finite": true, "minimum": 1 },
          "height": { "type": "number", "finite": true, "minimum": 1 },
          "file": { "type": "string" },
          "text": { "type": "string" }
        }
      }
    },
    "edges": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "fromNode", "toNode"],
        "properties": {
          "id": { "type": "string" },
          "fromNode": { "type": "string" },
          "toNode": { "type": "string" }
        }
      }
    },
    "meta": {
      "type": "object",
      "required": ["title", "locale", "repository"],
      "properties": {
        "title": { "type": "string" },
        "locale": { "type": "string" },
        "repository": {
          "type": "object",
          "required": ["url", "revision"],
          "properties": {
            "url": { "type": "string" },
            "revision": { "type": "string" }
          }
        }
      }
    }
  }
}
```

### 1.2 Move Phase Chain Validation to Schema
**Current**: Imperative check at `check-insight-wiki.js:22-25`
**Action**: Add to schema as `required` edges pattern or custom keyword

### 1.3 Atomic Delivery with Receipt
**File**: `scripts/generate-learning-plan-canvas.js`
**Current**: `writeCanvas` writes directly to target
**New flow**:
```
write temp candidate → validate against schema → replace target → emit receipt.json
```

Receipt structure:
```json
{
  "canvasPath": ".../learning-plan.canvas",
  "sourceBundleSha256": "...",
  "canvasSha256": "...",
  "generatedAt": "2026-09-02T...",
  "schemaVersion": "1.0.0"
}
```

### 1.4 Auto-Layout (Replace Hardcoded)
**File**: `scripts/generate-learning-plan-canvas.js:17-26`
**Current**: `x: 0, y: 140 + index * 220`
**New**: Force-directed or grid layout based on evidence count

### 1.5 Pin Evidence to Revision
**Add to canvas nodes**: `evidenceRefs: [{ id, path, line, revision }]`
**Reference**: Each evidence ID in `evidence.md` gets pinned to git revision

### 1.6 Compare Wiki Script
**New file**: `scripts/compare-wiki.js`
**Function**: Diff old vs new wiki → added/removed/changed evidence IDs, moved beats sections, missing sources

### 1.7 Optional: Guided Views Sidecar
**Add to canvas meta**: `views: [{ id, label, nodeSequence[] }]` (max 5)

**Acceptance**: Canvas passes JSON Schema + receipt verifies source match + compare-wiki reports diffs

---

## Phase 2 — Insight Store / Wiki Vault (from obsidian-mind)

### 2.1 Markdown + Frontmatter Store
**New structure**: `.learning-mode/insights/YYYY/MM/YYYY-MM-DD-<slug>.md`

Frontmatter:
```yaml
---
date: "2026-09-02T14:30:00Z"
description: "One-line summary"
tags: ["rust", "async", "error-handling"]
source:
  project: "my-project"
  file: "src/error.rs"
  line: 42
origin: "session"  # session | teach | manual
scope: "project"   # general | project | platform
projects: ["my-project"]
platforms: []
confidence: "observed"  # observed | inferred | hypothesized
flags: []
superseded_by: null     # ID of newer insight that corrects this
---
```

### 2.2 Migration Script (Atomic + Dual-Read)
**New file**: `scripts/migrate-insights.js`
**Requirements**:
- Convert `insights.jsonl` → `.md` files atomically
- Preserve dual-read: runtime reads BOTH formats (no breaking change)
- Emit migration receipt

### 2.3 Scope + Visibility Rules
**Cross-project index filter**:
| scope | visibility |
|-------|------------|
| general | all callers |
| project | only named projects |
| platform | only projects on same platform |
| (default) | deny |

**File**: `hooks/runtime.js` → `userIndexPath` filtering logic

### 2.4 Epistemic Contract (Write-Time Validation)
**Reject**: Transcript-shaped insights, generalizations ("always/never"), volatile numbers without date anchor
**Cap confidence**: `inferred` for generalizations
**Flag**: `volatile-number` for metrics without timestamp

### 2.5 Supersession Mechanism
**New field**: `superseded_by` in frontmatter
**Behavior**: Old insight stays but sinks in ranking; not deleted

### 2.6 Improved Deduplication
**Current**: SHA-256 of insights + references
**New**: Lexical Jaccard (title 0.6 + body 0.4, threshold 0.75 dup / 0.35 related) + sharesFacet pre-filter

### 2.7 Health Check Script
**New file**: `scripts/health.js`
**Checks**:
- Store location verified
- Index consistency (no orphan entries)
- Derived state matches declared (not assumed)

### 2.8 Tiered Loading with Budget
**SessionStart inject**: Byte budget + meter → degrade to pointer if over ceiling
**File**: `hooks/session-start.js`

### 2.9 Write Validation Gate (PostToolUse Hook)
**New hook**: Validates frontmatter schema + requires ≥1 link to topic note

### 2.10 Topic Wiki as MOC (Map of Content)
**Current**: Wiki stores all content in single files
**New**: `README.md` links to atomic `.md` insight files (wikilinks)
**Reference**: Obsidian Bases view pattern

**Acceptance**: Insights editable/linkable in Obsidian + scope filters correctly + migration non-breaking

---

## Phase 3 — Workflow/Agent Graph Schema (from sim)

### 3.1 Pipeline Schema (Design-Time vs Compiled)
**Design-time**: `PipelineState { blocks, edges }`
**Compiled**: `SerializedPipeline { flatGraph }`

### 3.2 StageHandler Interface
**New directory**: `pipeline/stages/`
```
pipeline/
├── schema.json
├── compiler.js
├── executor.js
└── stages/
    ├── insight-wiki.js
    ├── teach.js
    ├── scaffold-exercises.js
    ├── writing-beats.js
    └── writing-shape.js
```

Each stage:
```js
{
  canHandle(node) { /* returns boolean */ },
  execute(ctx, node, inputs) { /* returns outputs */ }
}
```

### 3.3 Compile-Time Validation
- Cycle detection (DFS)
- Scope validation (borrow from sim: `wouldCreateCycle()`, `getWorkflowEdgeScopeDropReason()`)

### 3.4 Reference Resolution Syntax
**Syntax**: `<stage.field>` → node references upstream output without hardcoding

### 3.5 Parallel Fan-Out After Teach
**Current**: Sequential `insight-wiki → teach → {scaffold, beats, shape}`
**New**: After `teach`, run 3 stages in parallel with sentinel aggregation

### 3.6 Execution Snapshot + Resume-from-Stage
**Persist**: State per stage
**On failure**: Rerun only failed stage using cached upstream results
**Critical**: Avoids re-running expensive LLM calls

### 3.7 Per-Stage Retry Policy
| Stage Type | Retry | Clamp |
|------------|-------|-------|
| LLM | opt-in | 2-5 |
| Write | never | (side-effects not idempotent) |

### 3.8 Error Branches
**Each stage**: `errorBranch` → fallback stage instead of full pipeline failure

### 3.9 Optional: HITL Pause/Resume
**Borrow**: sim's `_pauseMetadata` + `resume`
**Use case**: Wait for learner confirmation before `teach`

### 3.10 Optional: Teach Agent Block Schema
**Borrow**: sim's agent block → `memoryType`, `conversationId`, dynamic skills markdown

**Acceptance**: Pipeline has real schema, parallel execution, per-stage rerun, no wasted LLM calls

---

## Phase 4 — Multi-Host Plugin Hardening (from ECC)

### 4.1 Bootstrap Root Resolver
**File**: `hooks/runtime.js` (or new `hooks/resolve-root.js`)
**Logic**: Check `CLAUDE_PLUGIN_ROOT` → `~/.learning-mode` → marketplace cache → fallback

### 4.2 Hook Profiles (minimal/standard/strict)
**Manifest addition**: `plugin.yaml` → `hookProfiles` config
**Gate**: `run-with-flags.js` reads profile → enables/disables hooks
**User control**: No JSON editing needed

### 4.3 Consolidated Dispatcher
**Current**: Separate process per hook per event
**New**: Single dispatcher per event → multiple handlers internally

### 4.4 npm Package + Installer
**New**: `package.json` with bin entrypoints
**Manifests**: `.claude-plugin/`, `.codex-plugin/` native manifests
**Installer**: `npm install -g learning-mode && learning-mode install --target <host> --modules <set>`

### 4.5 Status Line as JS + Context Bar
**Current**: `learning-mode-statusline.sh`
**New**: `learning-mode-statusline.js` with color thresholds
**Reference**: ECC's `ecc-statusline.js`

### 4.6 Opt-In: Permission Deny-Rules + Config Protection
**Block reads**: `~/.ssh`, `~/.aws`, `.env*`
**Block writes**: Config files without explicit consent

### 4.7 Opt-In: MCP Health-Check Preflight
**Block calls**: To unhealthy MCP servers

### 4.8 Long-Term: Continuous-Learning Instinct Pipeline
**Confidence scoring** + promote high-confidence (2+ projects) → skill/command
**Guard**: Project-scoped to prevent cross-contamination

**Acceptance**: Hooks work from any install path + user controls profile + npm installable

---

## Phase 5 — Long-Term Extensions

### 5.1 Knowledge Graph Store
- Atomic `.md` + wikilinks
- Obsidian Bases view (database on Markdown)

### 5.2 `learning-mode doctor` Command
Self-healing check: store, index, canvas, pipeline, hook resolver

### 5.3 MCP Server for Cross-Project Recall
**Reference**: obsidian-mind's om pattern

### 5.4 Sub-Pipeline as Callable Tool
**Reference**: sim's `WorkflowBlockHandler`
**Use**: `teach` recursively calls `insight-wiki` for sub-topics

### 5.5 i18n Tuple Catalog
**Reference**: archify's `i18n.mjs`
**Prevents**: Silent English fallback for phase labels/status messages

---

## Priority Order (Quick Wins First)

| Priority | Phase | Item | Effort | Impact |
|----------|-------|------|--------|--------|
| 1 | 0.1 | Add pytest to CI | Low | High (regression prevention) |
| 2 | 0.3-0.4 | Structured diagnostics + `--json` | Low | High (agent can self-repair) |
| 3 | 4.1 | Bootstrap root resolver | Low | High (fixes silent hook death) |
| 4 | 1.1-1.3 | Canvas schema + atomic + receipt | Medium | Medium (foundation) |
| 5 | 2.2 | Migration script for insights | Medium | Medium (non-breaking) |
| 6 | 4.4 | npm package + installer | Medium | Medium (distribution) |
| 7 | 3.x | Workflow graph schema | High | High (core architecture) |

**Phase 3 is largest** — do after Phases 0-2 complete (needs solid foundation)

---

## Risk & Technical Debt

### Breaking Change Risk
- JSONL → Markdown migration **must** have dual-read + migration script
- Never throwaway existing users

### Scope Creep Risk
- **Don't** import entire stacks:
  - sim: No Next.js/Postgres/React Flow
  - ECC: No heavy governance/telemetry by default
- Borrow **patterns only**: schema, execution model, resolver, profiles

### Opt-In, Not Default
- ECC trust/security features → opt-in profiles (minimal/standard/strict)
- Don't force on all users

### Generated-Not-Hand-Edited Philosophy
- Canvas & wiki = generated views **always**
- Never allow hand-editing JSON (aligned with archify + current stance)

### LLM Call Cost
- Phase 3 resume-from-stage critical
- Pipeline has multiple LLM calls; full rerun = waste

---

## Next Steps

1. **Start Phase 0.1** — Add pytest job to CI (15 min)
2. **Phase 0.3** — Convert validator to structured JSON (30 min)
3. **Phase 4.1** — Add bootstrap resolver to runtime.js (20 min)
4. **Phase 1.1** — Write canvas JSON Schema (45 min)
5. **Phase 2.2** — Write migration script (1-2 hours)

Would you like me to implement any of these now? Priority order follows the table above.