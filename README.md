# Learning Mode

Portable learning-oriented guidance for coding agents. Version 0.2.1 adds default/off guidance, per-project canonical logs, and a user-level learning index.

## Behavior

- Explain trade-offs only for meaningful decisions: behavior, errors, algorithms, data, UX, or architecture.
- Ask one short, concrete question when the user can choose that behavior.
- Do routine work without turning it into a lesson.
- Add a `★ Insight` block before and after non-trivial code changes.
- Keep one deduplicated log at `.learning-mode/insights.jsonl`; the hook extracts only framed `★ Insight` blocks whose bullets cite exact `path/to/file:line` references, so subagent chatter is excluded.
- Append references to the user index at `~/.learning-mode/insight-index.jsonl` (override with `LEARNING_MODE_HOME`), allowing teaching to connect related work from multiple projects.

### Runtime states

- `$learning-mode default` is the normal state: concise guidance and new canonical log entries.
- `$learning-mode off` returns to ordinary behavior and stops new log capture.
- `$insight-wiki <topic>` searches, verifies, and connects cross-project insight evidence into a user-readable wiki in the user's language.
- `$learning-mode-deep` routes `insight-wiki → teach`; `teach` owns one multi-session user workspace and never has to act as a log search engine.

The shared source of truth is [AGENTS.md](AGENTS.md). Host-specific adapters only load that same guidance or the bundled skills.

## Install

Repository URL: `https://github.com/bl1nk42/learning-mode`. For local development, use the host's local-plugin workflow instead.

### Marketplace plugins

```sh
# Codex
codex plugin marketplace add https://github.com/bl1nk42/learning-mode
codex plugin add learning-mode@learning-mode
```

Open `/hooks` in Codex, review and trust the hook, then start a new thread.

```text
# Claude Code — run as two separate slash commands
/plugin marketplace add https://github.com/bl1nk42/learning-mode
/plugin install learning-mode@learning-mode
```

```sh
# GitHub Copilot CLI
copilot plugin marketplace add https://github.com/bl1nk42/learning-mode
copilot plugin install learning-mode@learning-mode

# Grok Build
grok plugin install https://github.com/bl1nk42/learning-mode --trust

# Devin CLI
devin plugins install https://github.com/bl1nk42/learning-mode
```

### Extensions and runtime adapters

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

OpenCode uses the bundled runtime adapter. Put this in the target project's `opencode.json`:

```json
{ "plugin": ["/absolute/path/to/learning-mode/.opencode/plugins/learning-mode.mjs"] }
```

### Skill and rule adapters

- OpenClaw: copy `.openclaw/skills/learning-mode/` to `~/.openclaw/skills/`.
- Swival: stage or copy `.swival/skills/learning-mode/` into its skills library.
- Qoder: use `.qoder-plugin/plugin.json`, or copy `.qoder/rules/learning-mode.md` into the target project's `.qoder/rules/`.
- Cursor, Windsurf, Cline, Copilot IDE, and Kiro: retain their matching bundled rule file at the same relative path.
- CodeWhale, VS Code Codex, Amp, Jules, Zed, and generic agents: use `AGENTS.md` as the project instruction file.
- Junie: select `.junie/guidelines.md` as its Guidelines Path.

## Development checks

```sh
python3 /data/data/com.termux/files/home/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py .
node hooks/session-start.js
python3 -B -m pytest -q
```

The Codex and Claude hooks require `node` on `PATH`.

### Claude status line (optional)

The bundled badge displays the current state and count of recorded insights. Add this command to Claude Code's `statusLine` setting if you want it:

```json
{ "statusLine": { "type": "command", "command": "sh /absolute/path/to/learning-mode/hooks/learning-mode-statusline.sh" } }
```
