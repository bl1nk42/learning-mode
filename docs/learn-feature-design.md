# Learning Mode: `learn` Command

วิเคราะห์พฤติกรรมการเรียนรู้จาก insight history แล้วแนะนำการตั้งค่าที่เหมาะสม — เหมือน `headroom learn --verbosity` แต่สำหรับ learning behavior

## Concept

headroom วิเคราะห์ conversation patterns (interrupts, fast-skips, echo ratio) แล้วแนะนำ verbosity level

`learn` วิเคราะห์ learning patterns (insight quality, reuse rate, session density) แล้วแนะนำ learning profile

## Metrics

### 1. Insight Quality Score (analogous to echo ratio)

```
 insight_count:        47        ← total insights across sessions
 well_formed:          31        ← have file:line reference + non-trivial content
 malformed:            16        ← missing reference, too short, or generic
 quality_ratio:        66%       ← well_formed / insight_count
```

**signals:**
- `file:line` reference present → +1
- insight text > 20 chars → +1
- insight is not generic ("learned about X", "read docs") → +1
- insight references actual code (path exists) → +1

**tunable:** `insight_sensitivity` — how strict the quality filter is

### 2. Learning Density (analogous to session turns)

```
 sessions:             12
 total_insights:       47
 insights_per_session: 3.9
 insights_per_hour:    2.1        ← derived from session timestamps
 most_productive_hour: 14:00-15:00
```

**signals:**
- High density (>5/session) → user is in deep learning mode
- Low density (<1/session) → user is in execution mode, don't interrupt
- Density varies by time → suggest auto-collect schedule

**tunable:** `capture_frequency` — how often to prompt for insight capture

### 3. Insight Reuse Rate (analogous to fast-skip)

```
 total_insights:       47
 reused_in_wiki:       12        ← insights that appeared in insight-wiki
 reused_in_teaching:   8         ← insights used in teach sessions
 reused_in_exercise:   3         ← insights that became quiz/flashcard items
 reuse_rate:           49%       ← (reused_in_wiki + reused_in_teaching + reused_in_exercise) / total
 unused_insights:      24        ← insights never referenced again
```

**signals:**
- High reuse (>60%) → insights are valuable, keep current settings
- Low reuse (<30%) → insights are noise, reduce capture or improve quality
- Most reuse in wiki vs teaching → suggest which deep learning path to prioritize

**tunable:** `deep_learning_trigger` — when to suggest `/insight-wiki` or `/teach`

### 4. Session Learning Pattern (analogous to push-back signal)

```
 projects:             3
 most_active:          learning-mode      (23 insights)
 dormant:              blnk               (0 insights in 14 days)
 cross_project_links:  5                  ← insights linked across projects
```

**signals:**
- One dominant project → suggest cross-project wiki
- Multiple active projects → suggest insight-wiki for synthesis
- Dormant project → suggest archiving or refreshing

**tunable:** `cross_project_threshold` — when to suggest cross-project synthesis

### 5. Teaching Effectiveness (unique to learning mode)

```
 teaching_sessions:    3
 exercises_created:    8
 exercises_completed:  5
 completion_rate:      63%
 learning_records:     4        ← records after demonstrated understanding
```

**signals:**
- High completion (>80%) → exercises are well-calibrated
- Low completion (<40%) → exercises too hard, suggest easier format
- No learning records → teaching not reaching demonstration stage

**tunable:** `exercise_difficulty` — default difficulty for scaffold-exercises

## Recommended Profiles

Like headroom's L1-L5, `learn` recommends a learning profile:

| Profile | Capture | Deep Learning | Exercises | When |
|---------|---------|---------------|-----------|------|
| `stealth` | off | never | never | User wants zero learning overhead |
| `passive` | auto-collect only | on-demand | never | User wants logs but no prompts |
| `balanced` | auto-collect + prompt | suggest wiki when >20 insights | suggest when teach is active | Default |
| `active` | prompt + challenge | auto-suggest wiki | auto-generate quiz | User wants structured learning |
| `immersive` | always prompt | auto-wiki + auto-teach | auto-exercise + spaced repetition | User wants full learning pipeline |

## Output Format

```bash
$ learning-mode learn
```

```
============================================================
Learning Profile — learning-mode
Path: D:\01work\Active\workspace\learning-mode
============================================================
  Sessions: 12  total insights: 47  well-formed: 31 (66%)
  Reuse rate: 49% (wiki: 12, teaching: 8, exercise: 3)
  Cross-project links: 5 across 3 projects
  Teaching: 3 sessions, 63% exercise completion

  Source: heuristic
  Quality is good (66%); moderate reuse; active teaching.

  >> Recommended profile: balanced (confidence: high)
  >> Insight sensitivity: normal (quality_ratio > 50%)
  >> Deep learning trigger: at 20+ unused insights
  >> Exercise difficulty: intermediate (63% completion)

  [WROTE] ~/.learning-mode/config.json — profile: balanced
```

## Implementation

### Data sources

1. `~/.learning-mode/insight-index.jsonl` — all insights across projects
2. `<project>/.learning-mode/insights.jsonl` — per-project insights
3. `~/.learning-mode/insight-wikis/*/` — wiki artifacts
4. `~/.learning-mode/teach/` — teaching workspace
5. `~/.learning-mode/session-maps/` — session maps

### Script

`scripts/learning-mode-learn.js` — standalone script, no external deps

```bash
node scripts/learning-mode-learn.js              # analyze + recommend
node scripts/learning-mode-learn.js --apply      # analyze + write config
node scripts/learning-mode-learn.js --json       # machine-readable output
```

### Config output

```json
{
  "profile": "balanced",
  "insight_sensitivity": "normal",
  "capture_frequency": "auto",
  "deep_learning_trigger": 20,
  "exercise_difficulty": "intermediate",
  "cross_project_threshold": 3,
  "analyzedAt": "2026-09-11T00:00:00Z",
  "confidence": "high"
}
```

### Integration

- `session-start.js` reads profile from config, adjusts behavior
- `auto-collect-learning-map.js` uses `deep_learning_trigger` to suggest wiki
- `scaffold-exercises` uses `exercise_difficulty` as default
- `$learning-mode full|off|deep` overrides profile temporarily

## File locations

- Script: `scripts/learning-mode-learn.js`
- Config: `~/.learning-mode/config.json` (add `profile` field)
- Test: `scripts/learning-mode-learn.test.js`

## Deferred

- Real-time learning density graph (dashboard integration)
- Spaced repetition scheduling (SM-2 algorithm)
- Cross-session learning path optimization
