---
name: learning-mode
description: Use when the user asks to enable, disable, or explain Learning Mode's runtime behavior, or wants to deepen learning from recorded insights.
argument-hint: "[off|full|deep]"
---

# Learning Mode

The runtime has three states per project: `full`, `off`, and `deep`.

- `$learning-mode full` — enables concise insights and canonical project logging.
- `$learning-mode off` — returns to ordinary behavior and stops new log capture.
- `$learning-mode deep` — deep learning from recorded insights via insight-wiki + teach.

## full

Make routine changes directly. For meaningful decisions, explain the trade-off and ask one concise question only when the choice belongs to the user. Add framed ★ Insight blocks before and after non-trivial changes. Each bullet must cite an exact `path/to/file:line`; the framed block is the log marker, so do not add hidden markers or log routine work.

## deep

Router for deep learning. First invoke `insight-wiki` for the user's goal — it searches, verifies, deduplicates, connects, and writes a user-readable wiki. Then hand that wiki and its verified sources to `teach`, which owns the one user teaching workspace.

Do not independently generate quizzes, flashcards, workshops, lessons, or learning records. `teach` decides the mission, storage-strength practice, lessons, and cross-session records. For exercise formats (quiz, flashcard, workshop), use `scaffold-exercises`.

## off

Stops insight capture and learning mode behavior. No ★ Insight blocks, no logging.
