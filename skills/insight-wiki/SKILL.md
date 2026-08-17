---
name: insight-wiki
description: Use when the user asks to create, refresh, browse, or summarize a wiki from Learning Mode insights across one or more projects.
argument-hint: "Topic or question for the insight wiki"
---

# Insight Wiki

Create a durable, user-readable wiki from Learning Mode evidence. This is a curator skill, not a teacher: collect, verify, connect, and explain insights; leave lessons, exercises, and learning records to `teach`.

## Input and output

Read `$LEARNING_MODE_HOME/insight-index.jsonl` (default: `~/.learning-mode/insight-index.jsonl`). Every selected entry must retain its `id`, `source.project`, and `references` (`file:line`). Verify each reference against its source project; exclude stale or inaccessible evidence and say so in `sources.md`.

Write one topic wiki to `$LEARNING_MODE_HOME/insight-wikis/<topic-slug>/` (default: `~/.learning-mode/insight-wikis/<topic-slug>/`). Never write the wiki into a source project unless the user explicitly asks.

## Language and voice

Write the wiki in the language the user uses for this request. Thai request means Thai wiki; English request means English wiki; follow an explicit language request over both. Logs are evidence only and must not choose the artifact language. Preserve code, paths, identifiers, and exact error messages verbatim. Explain in plain language, define jargon once, and prioritize the connection between insights over a chronological log dump.

## Procedure

1. Resolve the user's topic or question. Search all indexed insights, not only the current project.
2. Group candidates by concept and flow. Dedupe repeated claims; retain contrasting implementations when they illuminate the same concept.
3. Verify source files and lines. Read enough surrounding code to explain the connection; do not infer a relationship from matching words alone.
4. Write `evidence.md` as the read-only verified pile: selected insight IDs, their text, source project, `file:line`, and the observed connection. Write `sources.md` with every included/excluded entry and verification status.
5. Invoke `writing-beats` on `evidence.md` to create `beats.md`. It owns prerequisites and the order in which concepts are grounded.
6. Invoke `writing-shape` on `evidence.md` plus `beats.md` to create `README.md`. It owns the user-readable introduction and chapter; the wiki must not be a chronological log dump.
7. Generate the sidecar with `node <plugin-root>/scripts/generate-learning-plan-canvas.js <wiki-dir>`. It writes `learning-plan.canvas` beside the Markdown files. The Canvas is a generated Obsidian view, not an additional source of truth: it links `README.md`, `evidence.md`, `beats.md`, and `sources.md`, and maps `Observed → Practice → Demonstrated → Transfer`. Do not hand-write the JSON or infer and persist learner progress in it.
8. Add `concepts.md`, `flows.md`, or a Mermaid diagram only when the selected evidence needs them. Write `.insight-wiki-state.json` with topic, language, selected IDs, source locations, and build timestamp for refresh.
9. Keep the initial wiki narrow. Prefer one coherent chapter over a catalogue. On every user-requested refresh, regenerate `learning-plan.canvas` from the current Markdown artifacts; do not preserve a stale generated layout as state.

The README must explicitly distinguish observed code facts from the explanatory synthesis. It may link to other topic wikis, but must not invent sources or present log entries as universal best practices.
