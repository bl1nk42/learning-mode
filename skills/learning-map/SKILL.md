---
name: learning-map
description: |
  Use when the user asks to see what they learned this session, create a session summary,
  or visualize learning progress. Also runs automatically at session end via Stop hook.
argument-hint: "[--full|--incremental|--view <view-id>]"
---

# Learning Map

> [!info] Format
> All Markdown output uses Obsidian Flavored Markdown — see the `obsidian-markdown` skill for frontmatter, wikilinks, callouts, and tags.

Collect the small pieces Learning Mode created throughout a session and assemble them into a learning map for PEOPLE to read. This uses agents to analyze and connect insights, not just group them.

## When to use

- User asks: "เรียนอะไรไปบ้าง", "สรุป session นี้", "ดู learning progress"
- User explicitly calls `/learning-map`
- Automatically at session end via Stop hook (if configured)

## What this is NOT

- Not an insight generator — it collects, not creates
- Not a replacement for `insight-wiki` — that curates insights into topics
- Not a replacement for `teach` — that delivers lessons
- Not a JSON data dump — output is Markdown for people to read

## Procedure

### Phase 1 — Collect (Agent: insight-collector)

1. Read `$LEARNING_MODE_HOME/insight-index.jsonl`
2. Filter to current project
3. Read `$LEARNING_MODE_HOME/teach/learning-records/` for this project
4. Agent analyzes each insight:
   - What was learned
   - How it connects to other insights
   - What difficulty level
5. Output: structured nodes with analysis

### Phase 2 — Relate (Agent: relationship-builder)

1. Agent reads all nodes from Phase 1
2. Agent analyzes relationships:
   - `builds_on`: This insight builds on that one
   - `related_to`: These insights share a concept
   - `applies_to`: Theory → practice connection
3. Agent validates relationships (no guessing)
4. Output: edges with descriptions

### Phase 3 — Map (Agent: map-generator)

1. Agent reads nodes + edges
2. Agent creates human-readable Markdown:
   - Topics with descriptions
   - Learning path (what to learn first)
   - Connections between insights
   - Summary of what was learned
3. Agent writes `learning-map.md` to project directory
4. Agent also writes `learning-map.json` for agents

## Output

```
~/.learning-mode/session-maps/<project-id>-YYYY-MM-DD.json  ← Session map (schema-valid)
~/.learning-mode/projects/<project-id>/learning-map.md      ← Human-readable summary
```

## Example Output (learning-map.md)

```markdown
# Learning Map: my-project

**วันที่:** 2026-09-10
**สรุป:** เรียนรู้ context building pattern และ graph search

## Topics

### 1. Context Building Pattern

การทำความเข้าใจ context building ต้องเข้าใจ graph search ก่อน

- Context building คือการสร้างบริบทเฉพาะส่วนที่เกี่ยวข้อง
  - อ้างอิง: `src/context.ts:42`
- Graph search ช่วยหา nodes ที่เกี่ยวข้อง
  - อ้างอิง: `src/search.ts:15`

**เชื่อมกับ:** Graph Search (ดูด้านล่าง)

### 2. Graph Search

Graph search ช่วยขยายความสัมพันธ์ 1-hop

- ค้นหา nodes ที่ตรงกับคําถาม
- ขยายไป connected nodes
- ส่งให้ LLM เฉพาะส่วนที่เกี่ยวข้อง

**เป็นพื้นฐานของ:** Context Building Pattern

## Learning Path

1. **Graph Search** — เข้าใจวิธีค้นหาข้อมูล
2. **Context Building** — เอา graph search มาใช้สร้างบริบท

## Summary

Session นี้เรียนรู้:

- 2 insights
- 2 topics
- 1 connection (builds_on)
```

## Quality Rules

- Every insight must have evidence (file:line reference)
- Every relationship must have description explaining the connection
- Output must be readable by humans, not just structured data
- Learning path must be in correct order (prerequisites first)
