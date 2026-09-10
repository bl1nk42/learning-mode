# Auto-Update Session Map (Internal — Hook-Triggered)

Collect insights from existing sources and add them to the session map. Do NOT create insights — that's what `record-insights.js` does.

**Data flow:**

- `record-insights.js` WRITES to `~/.learning-mode/insight-index.jsonl`
- `insight-wiki` READS from `insight-index.jsonl`, WRITES to `~/.learning-mode/insight-wikis/`
- `teach` READS/WRITES to `~/.learning-mode/teach/learning-records/`
- `learning-map` (this skill) READS from `insight-index.jsonl` + `teach/learning-records/`, WRITES to `~/.learning-mode/session-maps/`

## Phase 0 — Pre-flight

1. Set `LEARNING_MODE_HOME` to `$HOME/.learning-mode` (or `$LEARNING_MODE_HOME` if set).

2. Identify the project:

   ```bash
   PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
   PROJECT_ID=$(echo "$PROJECT_ROOT" | md5sum | cut -c1-8)

   # Get project name
   if [ -f "$PROJECT_ROOT/package.json" ]; then
     PROJECT_NAME=$(grep -o '"name":"[^"]*"' "$PROJECT_ROOT/package.json" | head -1 | cut -d'"' -f4)
   elif [ -f "$PROJECT_ROOT/pyproject.toml" ]; then
     PROJECT_NAME=$(grep -o 'name = "[^"]*"' "$PROJECT_ROOT/pyproject.toml" | head -1 | cut -d'"' -f2)
   else
     PROJECT_NAME=$(basename "$PROJECT_ROOT")
   fi
   ```

3. Check if `~/.learning-mode/insight-index.jsonl` exists. If not, report "ยังไม่มี insight ในระบบ" and **STOP**.

4. Filter insights for this project:

   ```bash
   # insight-index.jsonl has entries with source.project field
   PROJECT_INSIGHTS=$(grep "\"project\":\"$PROJECT_ROOT\"" ~/.learning-mode/insight-index.jsonl 2>/dev/null || echo "")
   ```

5. Count new insights:

   ```bash
   INSIGHT_COUNT=$(echo "$PROJECT_INSIGHTS" | grep -c . 2>/dev/null || echo 0)
   ```

6. If `$INSIGHT_COUNT` -eq 0, report "ไม่มี insight ใหม่สำหรับ $PROJECT_NAME" and **STOP**.

## Phase 1 — Collect from insight-index.jsonl

1. Read each insight entry:

   ```json
   {
   	"id": "abc123",
   	"recordedAt": "2026-09-10T10:30:00Z",
   	"insights": ["insight text 1", "insight text 2"],
   	"references": [{ "file": "src/main.ts", "line": 42 }],
   	"source": {
   		"project": "/path/to/project",
   		"log": "/path/to/.learning-mode/insights.jsonl"
   	}
   }
   ```

2. Create node for each insight:

   ```json
   {
     "id": "insight:<slugified-text>",
     "type": "insight",
     "name": "<first 60 chars of insight>",
     "content": "<full insight text>",
     "tags": [],
     "difficulty": "intermediate",
     "project": {
       "id": "<project-id>",
       "name": "<project-name>"
     },
     "source": {
       "type": "insight-index",
       "id": "<insight-id>",
       "file": "<reference file>",
       "line": <reference line>
     },
     "created_at": "<recordedAt>"
   }
   ```

3. **Validation:** Skip if content is empty or id already exists.

## Phase 2 — Collect from teach/learning-records/

1. Check if `~/.learning-mode/teach/learning-records/` exists.

2. Read each `.md` file in that directory.

3. Check if the record is for this project (look for project reference in content).

4. Create node for each learning record:

   ```json
   {
   	"id": "lesson:<slugified-title>",
   	"type": "lesson",
   	"name": "<title from markdown>",
   	"content": "<content from markdown>",
   	"tags": ["demonstrated-understanding"],
   	"difficulty": "advanced",
   	"project": {
   		"id": "<project-id>",
   		"name": "<project-name>"
   	},
   	"source": {
   		"type": "learning-record",
   		"file": "<filename>"
   	},
   	"created_at": "<file mtime>"
   }
   ```

5. **Validation:** Skip if content is empty or id already exists.

## Phase 3 — Build relationships

1. Read all nodes (existing + new).

2. For each NEW node, analyze relationships with EXISTING nodes:
   - `builds_on`: Does this new insight build on an existing one?
   - `related_to`: Does this new insight share concepts with an existing one?
   - `applies_to`: Does this new insight apply an existing concept?

3. Create edges:

   ```json
   {
   	"source": "...",
   	"target": "...",
   	"type": "builds_on|related_to|applies_to",
   	"description": "..."
   }
   ```

4. **Validation:** Skip if source/target missing or description is generic.

## Phase 4 — Merge and save

1. Read existing session map (if exists): `~/.learning-mode/session-maps/<project-id>-<date>.json`

2. Merge:
   - Add new nodes (skip duplicates)
   - Add new edges (skip duplicates)
   - Preserve existing

3. Write merged map:

   ```bash
   SESSION_MAP="$LEARNING_MODE_HOME/session-maps/$PROJECT_ID-$(date +%Y-%m-%d).json"
   ```

4. Report:
   - Project name
   - New insights collected
   - New edges identified
   - File path saved

## What this does NOT do

- Does NOT create insights (that's `record-insights.js`)
- Does NOT curate wikis (that's `insight-wiki`)
- Does NOT teach lessons (that's `teach`)
- Does NOT create exercises (that's `scaffold-exercises`)
- Only COLLECTS from existing sources and builds a session map
