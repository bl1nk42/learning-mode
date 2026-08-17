---
name: learning-mode-deep
description: Use when the user asks for deep learning, a quiz, flashcards, or a workshop from this project's insight log.
---

# Learning Mode Deep

Use this skill only when the user explicitly asks for deep learning, a quiz, flashcards, workshop material, or `$learning-mode-deep`.

Read `.learning-mode/insights.jsonl` in the current project. It is the only learning evidence. If it is missing or empty, say that no recorded insights exist and suggest returning to Learning Mode default while doing substantive work.

Parse one JSON object per line. Do not invent facts beyond `insights` and `references`. Deduplicate by `id` before creating material. Cite each question, card, or exercise with its recorded `file:line` reference.

Supported variants:

- `quiz`: 3–7 short questions; put the answer and evidence under each question.
- `flashcard`: concise Q/A cards, one decision per card.
- `workshop`: one practical exercise that applies 2–4 logged decisions, including acceptance checks.
- `all`: quiz, flashcards, then workshop.

Default to `all` when the user does not choose a variant. Keep examples grounded in the current project and identify each cited log entry by its `id`.
