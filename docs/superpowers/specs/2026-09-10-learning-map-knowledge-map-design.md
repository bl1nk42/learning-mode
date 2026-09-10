# Learning Map Knowledge Map — End-to-end Pipeline Design

**Date:** 2026-09-10
**Status:** Approved
**Scope:** Script + Dashboard + Skill (full pipeline)

---

## 1. Problem Statement

The Learning Mode system has:
- A complete `session-map.schema.json` (nodes, edges, views)
- Detailed agent definitions (insight-collector, relationship-builder, map-generator)
- A hook-triggered collection flow (`auto-update-session-map.md`)

But the implementation has gaps:
- `collect-facets.js` produces flat markdown/JSON, not schema-valid output
- The hook doesn't invoke agents — it runs a simple script
- The dashboard shows sample data, doesn't consume session-map.json
- Agent definitions exist as markdown but aren't wired into the pipeline

**Goal:** Wire everything together so the full pipeline works end-to-end.

---

## 2. Architecture

```
record-insights.js → insight-index.jsonl
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   insight-collector   insight-wiki       teach
   (5 sources)         (curate)          (records)
         │                                   │
         ▼                                   ▼
      nodes.json                         records
         │                                   │
         ▼                                   │
   relationship-builder ◄───────────────────┘
         │
         ▼
      edges.json
         │
         ▼
    map-generator
         │
    ┌────┴────┐
    ▼         ▼
session-map.json  learning-map.md
    │
    ▼
dashboard.html
```

---

## 3. Components

### 3.1 Script Layer: `collect-facets.js`

**Current state:** Reads insight-index.jsonl, produces flat markdown + flat JSON.

**Target state:** Reads from 5 sources (matching insight-collector's Phase 1), normalizes, produces `raw-data.json`.

#### Input Sources (matching insight-collector.md)

| Source | Path | What to extract |
|--------|------|-----------------|
| Insight Index | `$LEARNING_MODE_HOME/insight-index.jsonl` | id, text, source, timestamp, references |
| Teaching Records | `$LEARNING_MODE_HOME/teach/learning-records/*.md` | concept demonstrated, how, right/wrong |
| Exercises | `$LEARNING_MODE_HOME/teach/exercises/*.md` | skill practiced, struggles, mastery |
| Insight Wikis | `$LEARNING_MODE_HOME/insight-wikis/*/README.md` | topics explored, connections, gaps |
| Session Context | (passed as argument) | conversation metadata |

#### Output Format: `raw-data.json`

```json
{
  "project": {
    "id": "<md5-first-8>",
    "name": "<from package.json or pyproject.toml>",
    "root": "<absolute path>"
  },
  "session": {
    "date": "2026-09-10",
    "mode": "incremental|full",
    "start_time": "...",
    "end_time": "..."
  },
  "sources": {
    "insight_entries": [...],
    "learning_records": [...],
    "exercises": [...],
    "wiki_entries": [...],
    "session_context": { "conversation_summary": "..." }
  },
  "stats": {
    "total_items": 15,
    "by_source": { "insight_index": 8, "learning_records": 3, "exercises": 2, "wikis": 2 }
  }
}
```

#### Session Modes

- **Incremental (default):** Filter entries by session start time (last session boundary)
- **Full (`--full`):** Read all entries across all sessions

#### Validation

- Skip entries with empty content
- Skip entries without source.project match
- Report skipped entries in stats

---

### 3.2 Agent 1: `insight-collector`

**Definition:** `skills/learning-map/agents/insight-collector.md`

**Input:** `raw-data.json`

**Output:** `nodes.json`

#### What it does

1. **Phase 1 — Evidence Gathering:** Reads all 5 sources from raw-data.json, cross-references
2. **Phase 2 — Semantic Enrichment:**
   - Classifies each evidence into node type (insight, exercise, lesson, concept)
   - Writes 1-2 sentence summary (quality standards from agent def)
   - Assigns difficulty (beginner/intermediate/advanced)
   - Assigns 2-4 tags
   - Validates: grounded evidence, specific summaries, no duplicates

#### Output Format

```json
{
  "nodes": [
    {
      "id": "insight:context-building-pattern",
      "type": "insight",
      "name": "Context Building Pattern",
      "content": "Understanding that effective context building requires searching relevant nodes first, then expanding 1-hop to connected nodes.",
      "tags": ["context-building", "agent-design", "fundamentals"],
      "difficulty": "intermediate",
      "source": {
        "type": "insight-index",
        "id": "abc123",
        "file": "src/context-builder.ts",
        "line": 45
      },
      "created_at": "2026-09-10T10:30:00Z"
    }
  ],
  "stats": {
    "total": 5,
    "by_type": { "insight": 3, "exercise": 1, "lesson": 1 },
    "by_difficulty": { "beginner": 2, "intermediate": 2, "advanced": 1 }
  }
}
```

---

### 3.3 Agent 2: `relationship-builder`

**Definition:** `skills/learning-map/agents/relationship-builder.md`

**Input:** `nodes.json`

**Output:** `edges.json`

#### What it does

Analyzes all nodes and identifies genuine relationships:

| Type | Meaning | When to use |
|------|---------|-------------|
| `builds_on` | B requires understanding A | Learner understood B because they first understood A |
| `prerequisite_of` | A must come before B | Logical learning order |
| `related_to` | A and B share a concept | Same topic, neither depends on other |
| `contradicts` | A and B conflict | Different perspectives on same topic |
| `applies_to` | A applied in context B | Theory → practice connection |

#### Validation Rules

- Every edge has specific description (not generic)
- No self-loops
- No duplicate edges
- Max 5 edges per node
- `builds_on`/`prerequisite_of` ordered correctly (A before B)

#### Output Format

```json
{
  "edges": [
    {
      "source": "insight:graph-search",
      "target": "insight:context-building",
      "type": "builds_on",
      "description": "Understanding context building required first understanding how graph search expands 1-hop neighbors"
    }
  ],
  "stats": {
    "total": 8,
    "by_type": { "builds_on": 3, "prerequisite_of": 2, "related_to": 2, "applies_to": 1 }
  }
}
```

---

### 3.4 Agent 3: `map-generator`

**Definition:** `skills/learning-map/agents/map-generator.md`

**Input:** `nodes.json` + `edges.json`

**Output:** `session-map.json` + `learning-map.md`

#### What it does

1. Generate metadata (session info, views, locale)
2. Validate nodes against schema
3. Validate edges against schema
4. Assemble final session-map.json conforming to `session-map.schema.json`
5. Render learning-map.md (human-readable)
6. Write to `~/.learning-mode/session-maps/YYYY-MM-DD.json`
7. Report to user

#### Views Generated

- `all` — all nodes and edges
- `flow` — learning order (prerequisite → builds_on → applies_to)
- `by-type` — grouped by node type

#### Merge Behavior (Incremental)

If session-map.json exists for this date:
- Add new nodes (skip duplicates by id)
- Add new edges (skip duplicates by source+target+type)
- Preserve existing
- Update session metadata

---

### 3.5 Hook Integration

**File:** `hooks/auto-collect-learning-map.js`

**Current state:** Runs collect-facets.js via execSync, produces flat output.

**Target state:**

1. Run `collect-facets.js` → produce `raw-data.json`
2. Invoke learning-map skill → skill orchestrates 3 agents via subagent dispatch
3. Skill passes raw-data.json between agents sequentially

#### Execution Flow

```
Stop hook triggers
  → auto-collect-learning-map.js
    → collect-facets.js <project-root> --output raw-data.json
    → invoke learning-map skill with raw-data.json
      → Agent 1 (insight-collector): raw-data.json → nodes.json
      → Agent 2 (relationship-builder): nodes.json → edges.json
      → Agent 3 (map-generator): nodes.json + edges.json → session-map.json + learning-map.md
    → report to user
```

#### Error Handling

- If any agent fails → report error, don't fail the hook
- If no insights found → skip silently
- If learning mode is off → skip

---

### 3.6 Dashboard

**File:** `dashboard/learning-map-dashboard.html`

**Current state:** Shows hardcoded sample data.

**Target state:** Consumes `session-map.json` dynamically.

#### Data Flow

```
session-map.json (from ~/.learning-mode/session-maps/)
  → dashboard loads via URL param ?data=path/to/session-map.json
  → renders: stats, topics, connections, learning path
```

#### UI Sections

1. **Stats Bar:** nodes count, edges count, views count
2. **Topics:** render nodes grouped by active view
3. **Connections:** render edges as a list or simple graph
4. **Learning Path:** prerequisite chain from prerequisite_of + builds_on edges
5. **View Switcher:** tabs for each view in meta.views

#### Session Mode

- Default: load current session's map
- `--full` mode: merge all session maps, show cumulative view

---

## 4. Data Contract Between Components

```
collect-facets.js
  output → raw-data.json
  format: { project, session, sources: { insight_entries[], learning_records[], exercises[], wiki_entries[], session_context }, stats }

insight-collector
  input ← raw-data.json
  output → nodes.json
  format: { nodes: [{ id, type, name, content, tags, difficulty, source, created_at }], stats }

relationship-builder
  input ← nodes.json
  output → edges.json
  format: { edges: [{ source, target, type, description }], stats }

map-generator
  input ← nodes.json + edges.json
  output → session-map.json + learning-map.md
  format: session-map.schema.json conformant
```

---

## 5. File Changes

| File | Action | Description |
|------|--------|-------------|
| `scripts/learning-map/collect-facets.js` | Refactor | Read 5 sources, produce raw-data.json |
| `scripts/learning-map/collect-facets.py` | Update | Mirror JS changes |
| `scripts/learning-map/config.js` | Update | Add source paths config |
| `scripts/learning-map/config.py` | Update | Mirror JS changes |
| `hooks/auto-collect-learning-map.js` | Refactor | Wire to agent pipeline |
| `dashboard/learning-map-dashboard.html` | Refactor | Consume session-map.json |
| `skills/learning-map/SKILL.md` | Update | Reference agent defs, clarify pipeline |

---

## 6. Testing

- Unit: collect-facets.js produces valid raw-data.json
- Unit: each agent produces valid output format
- Integration: full pipeline from raw-data.json → session-map.json
- Validation: session-map.json passes schema validation
- Dashboard: renders session-map.json correctly

---

## 7. Success Criteria

1. `collect-facets.js` produces raw-data.json conforming to data contract
2. 3 agents execute sequentially and produce valid intermediate outputs
3. Final session-map.json validates against session-map.schema.json
4. Dashboard renders real session-map data (not sample data)
5. Hook triggers full pipeline on session end
6. Incremental mode works (merge with existing session map)
7. Full mode works (cumulative view across sessions)
