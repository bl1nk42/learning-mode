---
name: learning-mode-deep
description: Use when the user wants to turn this project's evidence-backed insight log into a multi-session teaching plan.
---

# Learning Mode Deep

This is a bridge, not a second teaching engine. Use it only when the user explicitly asks to deepen learning from this project's recorded insights or invokes `$learning-mode-deep`.

Read `.learning-mode/insights.jsonl`. If it is absent or empty, say so. Otherwise hand the evidence (`insights`, `references`, and `id`) to the bundled `teach` skill and follow its stateful teaching-workspace workflow. Do not independently generate quizzes, flashcards, workshops, lessons, or learning records.

`teach` decides the mission, storage-strength practice, lessons, and cross-session records. Keep every explanation grounded in the referenced code lines; project insight logs are evidence of work, not proof that the user learned it.
