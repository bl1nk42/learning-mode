---
name: learning-mode-deep
description: Use when the user wants to connect evidence-backed insights from one or more projects into multi-session teaching.
---

# Learning Mode Deep

This is a bridge, not a second teaching engine. Use it only when the user explicitly asks to deepen learning from this project's recorded insights or invokes `$learning-mode-deep`.

Read the user insight index at `$LEARNING_MODE_HOME/insight-index.jsonl` (default: `~/.learning-mode/insight-index.jsonl`). Filter entries by the user's learning goal, not by the current project. If no relevant evidence exists, say so. Otherwise hand the selected entries (`insights`, `references`, `id`, and `source.project`) to the bundled `teach` skill and follow its one user-owned teaching-workspace workflow. Do not independently generate quizzes, flashcards, workshops, lessons, or learning records.

`teach` decides the mission, storage-strength practice, lessons, and cross-session records. Keep every explanation grounded in the referenced code lines; project insight logs are evidence of work, not proof that the user learned it.
