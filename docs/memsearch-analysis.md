# Memsearch Analysis → Learning Mode Adaptation

## Memsearch Architecture

```
SessionStart → inject recent memory (2 daily journals, max 1800 bytes)
UserPromptSubmit → capability hint ("recall available if needed")
Stop → parse transcript → summarize with claude -p → append to daily .md
SessionEnd → (cleanup)
```

**Memory format** (flat daily files):
```
## Session HH:MM
### HH:MM
<!-- session:<uuid> turn:<uuid> transcript:<path> -->
- Bullet 1
- Bullet 2
```

## ปัญหาที่พบ

### 1. Path Resolution Bug

ไฟล์ memory มี path ซ้อน:
```
D:/01work/Active/workspace/learning-mode/D:/01work/Active/workspace/learning-mode/.memsearch/memory/2026-09-15.md
```

**Root cause:** `_PROJECT_DIR` resolve ผิด — ใช้ `pwd` แทน `git rev-parse --show-toplevel` แล้ว append path ซ้ำ

** Lesson for learning mode:** ใช้ `path.resolve()` เสมอ ห้าม string concat กับ relative path

### 2. Structure Too Deep

```
## Session 02:16        ← heading 1
### 02:16               ← heading 2 (ซ้ำกัน)
<!-- session:... -->     ← metadata block
- Bullet 1              ← actual content
- Bullet 2
```

**ปัญหา:**
- Session heading กับ Turn heading ระบุเวลาเดียวกัน — ซ้ำ
- Transcript anchor comment เป็น metadata ที่ไม่ได้ใช้ประโยชน์ในการอ่าน
- Nested headings ทำให้ difficult ในการ query/filter

** Lesson for learning mode:** Flat structure — 1 heading ต่อ entry, metadata เป็น inline tags

### 3. Summarizer Quality

memsearch ใช้ `claude -p` กับ haiku model เพื่อ summarize transcript:
- ผลลัพธ์เป็น generic bullet points ("User asked...", "Claude did...")
- ไม่มี evidence (file:line)
- ไม่มี actionable output

** Lesson for learning mode:** Summary ต้องมี evidence, ต้อง actionable

## Learning Mode Adaptation

### Architecture

```
SessionStart → load learning profile (from config)
UserPromptSubmit → detect learning triggers ($learning-mode, /teach, etc.)
Stop → extract ★ Insight blocks → validate file:line → append to insight index
learn → analyze patterns → recommend profile → write config
```

### Memory Format (Flat, Evidence-Based)

```markdown
<!-- session:<uuid> date:2026-09-15 -->
- ★ insight: path.resolve() จำเป็นสำหรับ relative path `scripts/learning-map/config.js:25`
- ★ insight: slug dedup guard ป้องกัน insight ซ้ำ `scripts/learning-map/collect-facets.js:45`
- ★ insight: edge description ไม่ควร truncate `.slice(0,30)` ทำให้ประโยคหาย `scripts/learning-map/collect-facets.js:67`
- learning_event: subagent พบ 3 bugs ที่ unit tests ไม่จับ
- teaching: quiz exercise 8 ข้อ ผ่าน 5 ข้อ (63%)
```

**ต่างจาก memsearch:**
- 1 heading ต่อ session (ไม่มี turn subheading)
- Metadata เป็น inline tags (`session:<uuid>`, `date:`)
- ทุก insight มี `file:line` evidence
- ใช้ `★` prefix เพื่อ consistency กับ existing insight blocks
- Learning events และ teaching records แยก tag

### `learn` Command Output

```
============================================================
Learning Profile — learning-mode
Path: D:\01work\Active\workspace\learning-mode
============================================================
  Sessions: 12  insights: 47  well-formed: 31 (66%)
  Reuse: wiki 12, teaching 8, exercise 3 (49%)
  Cross-project: 5 links across 3 projects
  Teaching: 3 sessions, 63% completion

  Source: heuristic
  Good quality (66%); moderate reuse; active teaching.

  >> Profile: balanced (confidence: high)
  >> Sensitivity: normal
  >> Deep trigger: 20+ unused insights
  >> Exercise difficulty: intermediate

  [WROTE] ~/.learning-mode/config.json
```

### Config Schema

```json
{
  "profile": "balanced",
  "insight_sensitivity": "normal",
  "capture_frequency": "auto",
  "deep_learning_trigger": 20,
  "exercise_difficulty": "intermediate",
  "cross_project_threshold": 3
}
```

### Files

| File | Purpose |
|------|---------|
| `scripts/learning-mode-learn.js` | Analyze patterns, recommend profile |
| `scripts/learning-mode-learn.test.js` | Tests |
| `docs/learn-feature-design.md` | Detailed feature spec |

### Key Differences from Memsearch

| Aspect | Memsearch | Learning Mode |
|--------|-----------|---------------|
| Memory format | Generic bullets | Evidence-based insights |
| Summarizer | claude -p (haiku) | ★ Insight blocks (already in session) |
| Structure | Nested headings | Flat with inline tags |
| Query | Vector search (embedding) | File:line grep + tag filter |
| Profiles | None | 5 learning profiles |
| Output | Daily journal | Insight index + learning map |
