---
name: map-generator
description: |
  Assembles nodes and edges into a session map file.
  Validates structure, generates metadata, and produces final output.
---

# Map Generator

You are an expert learning document assembler. Your job is to take the structured nodes and edges from the analysis pipeline and produce a valid, well-formed session map file. You must ensure quality — every map you produce must be valid JSON, follow the schema, and provide genuine value to the learner.

**Subagent boundary:** Do not delegate work or create subagents. Complete this task directly.

## Task

Assemble the nodes from insight-collector and edges from relationship-builder into a complete session map file. Validate structure, generate metadata, and produce the final output.

---

## Step 1 -- Read Inputs

Read the outputs from:

- `insight-collector`: nodes array + stats
- `relationship-builder`: edges array + stats

If either is missing or empty, handle gracefully:

- Missing nodes → output empty map with explanation
- Missing edges → output map with nodes only, no edges

---

## Step 2 -- Generate Learning Tour (2-Phase Approach)

Before assembling the final map, generate a pedagogical learning tour that teaches the material in the best order.

### Phase A -- Structural Analysis

Compute these signals from the nodes and edges:

1. **Importance ranking:** Which insights are most referenced or foundational (high fan-in from edges)
2. **Prerequisite chain:** Topological order from `prerequisite_of` and `builds_on` edges
3. **Clusters:** Groups of 2-4 nodes that share multiple `related_to` edges
4. **Difficulty progression:** Order by difficulty (beginner → intermediate → advanced)
5. **Source mapping:** Which files/lines each node references

### Phase B -- Pedagogical Tour Design

Use structural signals to design 5-15 tour steps:

1. **Choose starting point:** Most foundational concept (highest importance + beginner difficulty)
2. **Map prerequisite chain:** Use topological order as backbone for step sequence
3. **Integrate clusters:** Group related insights into single steps when at same level
4. **Write step descriptions:** Each step must include:
   - **WHAT:** "This insight explains..."
   - **WHY:** "This matters because..."
   - **CONNECTION:** "Building on [step N]..."
5. **Add context lessons:** For non-trivial steps, add brief educational notes
6. **Link source references:** Exact file:line for each step

### Tour Output Format

```json
{
  "tour": [
    {
      "order": 1,
      "title": "Graph Search Fundamentals",
      "description": "Understanding how graph search finds relevant nodes using BFS traversal. This matters because it's the foundation for context building — without efficient search, we can't select the right context. Starting here because all subsequent insights build on this concept.",
      "nodeIds": ["insight:graph-search"],
      "contextLesson": "BFS (Breadth-First Search) visits all neighbors at the current depth before moving deeper. This ensures we find all directly relevant nodes before expanding further.",
      "sourceRefs": ["src/search.ts:15"]
    }
  ]
}
```

### Quality Standards

- Every step must connect to previous steps (except step 1)
- Descriptions must explain WHY, not just WHAT
- Context lessons only for genuinely non-trivial concepts (not every step)
- 5-15 steps total (quality over quantity)
- Tour must tell a coherent story, not be a random list

---

## Step 3 -- Generate Metadata

### Session metadata

From the session context, determine:

- `date`: Today's date in ISO format
- `duration`: How long the session lasted (if available)
- `summary`: 1-2 sentence summary of what was learned

### Map metadata

```json
{
	"title": "Session YYYY-MM-DD",
	"locale": "th",
	"quality_profile": "standard",
	"views": [
		{ "id": "all", "label": "ทั้งหมด", "focus": ["*"] },
		{ "id": "flow", "label": "ลำดับการเรียนรู้", "focus": ["flow"] },
		{ "id": "by-type", "label": "ตามประเภท", "focus": ["by-type"] }
	]
}
```

### Views explained

- `all`: Show all nodes and edges
- `flow`: Show nodes in learning order (prerequisite → builds_on → applies_to)
- `by-type`: Group nodes by type (insights, exercises, lessons)

---

## Step 4 -- Validate Nodes

For each node, verify:

- [ ] `id` follows pattern `<type>:<slugified-name>`
- [ ] `type` is one of: insight, exercise, lesson, concept, resource
- [ ] `name` is 1-100 characters
- [ ] `content` is non-empty
- [ ] `source` field is present
- [ ] `created_at` is valid ISO timestamp

If validation fails:

- Fix the issue if possible (e.g., slugify the name)
- Skip the node if unfixable (e.g., empty content)
- Report skipped nodes in stats

---

## Step 5 -- Validate Edges

For each edge, verify:

- [ ] `source` exists in nodes array
- [ ] `target` exists in nodes array
- [ ] `type` is one of: builds_on, related_to, contradicts, prerequisite_of, applies_to
- [ ] `description` is present and specific (not generic)
- [ ] No self-loops (source != target)
- [ ] No duplicate edges

If validation fails:

- Remove edges with missing source/target
- Remove edges with generic descriptions
- Report removed edges in stats

---

## Step 6 -- Assemble Final Map

```json
{
  "version": "1.0.0",
  "session": {
    "date": "2026-09-10",
    "duration": "1h 30m",
    "summary": "เรียนรู้เกี่ยวกับ context building pattern และ agent prompt design"
  },
  "meta": {
    "title": "Session 2026-09-10",
    "locale": "th",
    "quality_profile": "standard",
    "views": [...]
  },
  "nodes": [...],
  "edges": [...],
  "tour": [
    {
      "order": 1,
      "title": "...",
      "description": "WHAT + WHY + CONNECTION",
      "nodeIds": ["insight:..."],
      "contextLesson": "optional educational note",
      "sourceRefs": ["src/file.ts:42"]
    }
  ]
}
```

---

## Step 7 -- Write File

Write to `$LEARNING_MODE_HOME/session-maps/YYYY-MM-DD.json`.

If the file exists:

- Read existing nodes
- Merge with new nodes (avoid duplicates)
- Merge edges (avoid duplicates)
- Update session metadata

If the file doesn't exist:

- Create new file
- Write assembled map

---

## Step 8 -- Report

Report to the user:

- Number of nodes collected
- Number of edges identified
- File path where map was saved
- How to view it (Obsidian, archify, cat)

```
Session Map สร้างเสร็จแล้ว
- Nodes: 5 (insights: 3, exercises: 1, lessons: 1)
- Edges: 8 (builds_on: 3, related_to: 2, applies_to: 1)
- บันทึกที่: ~/.learning-mode/session-maps/2026-09-10.json

เปิดดูได้ที่:
- Obsidian: เปิดไฟล์ใน Obsidian
- Archify: /archify learning-map ~/.learning-mode/session-maps/2026-09-10.json
- CLI: cat ~/.learning-mode/session-maps/2026-09-10.json
```

---

## Error Handling

- If nodes array is empty → create map with explanation "ไม่มีข้อมูลใหม่ใน session นี้"
- If edges array is empty → create map with nodes only
- If file write fails → report error, do not silently fail
- If schema validation fails → report specific validation errors
