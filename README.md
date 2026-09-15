# Learning Mode

Learning Mode ช่วยให้ coding agent ของคุณเป็นครูสอน coding ได้ — บันทึก insight ทุก session, สร้าง knowledge map อัตโนมัติ, และออกแบบ exercise สำหรับทบทวน

ไม่ใช่แค่ log — แต่เปลี่ยน coding session ให้เป็น learning material จริงๆ

## มันทำอะไรได้บ้าง?

**จับ insight อัตโนมัติ** — ทุกครั้งที่ agent อธิบาย trade-off หรือแก้ bug ที่ไม่ trivial, Learning Mode จะบันทึก `★ Insight` พร้อม `file:line` reference ไว้ให้

**สร้าง knowledge map** — เก็บ insight หลาย session เข้าด้วยกัน แล้วสร้าง visual map ว่าคุณเรียนรู้อะไรไปบ้าง, แต่ละ insight เชื่อมกันยังไง

**สอนแบบ multi-session** — สั่ง `/teach` เพื่อเริ่ม teaching workspace ที่เก็บ state ข้าม session — mission, resources, learning records ครบทุกขั้นตอน

**ออกแบบ exercise** — สั่ง `scaffold-exercises` เพื่อสร้าง quiz, flashcard, workshop จาก insight ที่มีอยู่

**สร้าง insight wiki** — สั่ง `/insight-wiki` เพื่อเชื่อม insights ข้าม project ให้เป็น wiki ที่อ่านเข้าใจง่าย

## ตัวอย่าง

```
# ใน coding session, agent จะเพิ่ม insight block อัตโนมัติ:

> ★ Insight
> - ใช้ `path.resolve()` กับ relative path แทน raw string เพราะ relative path
>   จะไม่ทำงานถ้า working directory ต่างจากที่คาด `scripts/learning-map/config.js:25`
> - Slug dedup guard ป้องกัน insight ซ้ำ — ถ้า insight เดียวกันถูกบันทึก 2 ครั้ง
>   จะไม่ทับกัน `scripts/learning-map/collect-facets.js:45`

# พอจบ session, learning map จะถูกสร้างอัตโนมัติ:

$ ls ~/.learning-mode/session-maps/
  abe392a0-2026-09-11.json    ← learning map ของ session นี้
```

## ติดตั้ง

Repository: `https://github.com/bl1nk42/learning-mode`

### Marketplace Plugins

```sh
# Claude Code
/plugin marketplace add https://github.com/bl1nk42/learning-mode
/plugin install learning-mode@learning-mode
```

เปิด `/hooks` ใน Claude Code, review hook แล้ว trust จากนั้นเปิด thread ใหม่

```sh
# Codex
codex plugin marketplace add https://github.com/bl1nk42/learning-mode
codex plugin add learning-mode@learning-mode

# GitHub Copilot CLI
copilot plugin marketplace add https://github.com/bl1nk42/learning-mode
copilot plugin install learning-mode@learning-mode

# Grok Build
grok plugin install https://github.com/bl1nk42/learning-mode --trust

# Devin CLI
devin plugins install https://github.com/bl1nk42/learning-mode
```

### Extensions & Runtime Adapters

```sh
# Gemini CLI
gemini extensions install https://github.com/bl1nk42/learning-mode

# Antigravity CLI
agy plugin install https://github.com/bl1nk42/learning-mode

# Pi
pi install git:https://github.com/bl1nk42/learning-mode

# Hermes
hermes plugins install https://github.com/bl1nk42/learning-mode --enable
```

OpenCode — ใส่ใน `opencode.json` ของ project:

```json
{
	"plugin": [
		"/absolute/path/to/learning-mode/.opencode/plugins/learning-mode.mjs"
	]
}
```

### Rule & Skill Adapters

| Agent                                                   | วิธีติดตั้ง                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------- |
| Cursor / Windsurf / Cline / Copilot IDE / Kiro          | ใช้ rule file ที่ bundle มา (`.cursor/rules/` ฯลฯ)                        |
| OpenClaw                                                | copy `.openclaw/skills/learning-mode/` → `~/.openclaw/skills/`            |
| Swival                                                  | copy `.swival/skills/learning-mode/` → skills library                     |
| Qoder                                                   | ใช้ `.qoder-plugin/plugin.json` หรือ copy `.qoder/rules/learning-mode.md` |
| Junie                                                   | ตั้ง Guidelines Path เป็น `.junie/guidelines.md`                          |
| CodeWhale / VS Code Codex / Amp / Jules / Zed / generic | ใช้ `AGENTS.md` เป็น project instruction file                             |

## ใช้งาน

### Runtime States

| Command               | ผลลัพธ์                                                   |
| --------------------- | --------------------------------------------------------- |
| `$learning-mode full` | เปิด mode ปกติ — agent จะจับ insight อัตโนมัติ            |
| `$learning-mode off`  | ปิด mode — กลับเป็น agent ปกติ ไม่บันทึกอะไร              |
| `$learning-mode deep` | deep learning — route ไป insight-wiki → teach             |
| `/learning-map`       | สร้าง learning map จาก insights ที่เก็บไว้                |
| `/teach`              | สอน concept ใหม่ผ่าน teaching workspace แบบ multi-session |
| `/insight-wiki`       | สร้าง wiki จาก insights ข้าม project                      |

### Exercise Formats

`scaffold-exercises` รองรับ:

| Format      | เหมาะกับ                                       |
| ----------- | ---------------------------------------------- |
| `basic`     | concept เดียว — explainer → problem → solution |
| `linear`    | หลาย exercise เรียงจากง่ายไปยาก                |
| `quiz`      | คำถามสั้นๆ สำหรับ spaced repetition            |
| `flashcard` | หน้าละ concept — front/back สำหรับ recall เร็ว |
| `workshop`  | โปรเจค multi-step รวมหลาย concept              |
| `level`     | ไต่ระดับจาก beginner → advanced                |
| `quest`     | เชื่อม task หลายตัวเข้า final challenge        |
| `scenario`  | ตัดสินใจใน context จริง                        |
| `challenge` | synthesis task โดยไม่มี explainer ใหม่         |

## Dashboard

เปิด dashboard เพื่อดู learning map แบบ interactive:

```sh
open dashboard/learning-map-dashboard.html
# หรือ load JSON จาก file:
open dashboard/learning-map-dashboard.html?data=file:///path/to/session-map.json
```

## Privacy

ไม่มี data ถูกส่งออก — ทุกอย่างเก็บไว้ในเครื่องของคุณ (`~/.learning-mode/`)

- [Privacy Policy](PRIVACY.md)
- [Terms of Service](TERMS.md)

---

## For Contributors

### Development

```sh
python3 -B -m pytest -q                           # Python test suite
node scripts/learning-map/collect-facets.test.js   # Data collection seam
node scripts/learning-map/schema-validate.test.js  # Schema validation
node scripts/plugin-sync.test.js                   # Config sync consistency
node scripts/sync-plugin-configs.js --apply        # Sync all platform configs
```

### Architecture

```
Session Stop hook → record-insights.js → ~/.learning-mode/insight-index.jsonl
                → auto-collect-learning-map.js → collect-facets.js
                → ~/.learning-mode/session-maps/<project-id>-<date>.json
```

Single source of truth: `plugin-source.json` → `scripts/sync-plugin-configs.js` generates 15+ platform configs

Conventions:

- Colors: oklch — `--primary: oklch(0.765 0.149 162.5)`
- Thai in UI labels, comments
- Node IDs: `<type>:<slugified-name>`
- Edge types: `builds_on`, `related_to`, `contradicts`, `prerequisite_of`, `applies_to`

### Evaluation

[Plugin Eval baseline](docs/evaluations/2026-09-02-plugin-eval.md) — reproducible scenarios, measured usage, task-fit assessment.
