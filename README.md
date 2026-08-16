# Learning Mode

Portable learning-oriented guidance for coding agents. It implements straightforward work directly, explains meaningful trade-offs, and adds a short insight block around non-trivial code changes.

## Behavior

- Explain trade-offs only for meaningful decisions: behavior, errors, algorithms, data, UX, or architecture.
- Ask one short, concrete question when the user can choose that behavior.
- Do routine work without turning it into a lesson.
- Add a `★ Insight` block before and after non-trivial code changes.

The shared source of truth is [AGENTS.md](AGENTS.md). Host-specific adapters only load that same guidance or the bundled `learning-mode` skill.

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
```

The Codex and Claude hooks require `node` on `PATH`.
