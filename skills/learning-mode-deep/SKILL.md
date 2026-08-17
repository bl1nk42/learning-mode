---
name: learning-mode-deep
description: Use when the user wants to connect evidence-backed insights from one or more projects into multi-session teaching.
---

# Learning Mode Deep

This is a router, not a second teaching engine. Use it only when the user explicitly asks to deepen learning from recorded insights or invokes `$learning-mode-deep`.

First invoke `insight-wiki` for the user's goal. It searches, verifies, deduplicates, connects, and writes a user-readable wiki in the user's language. Then hand that wiki and its verified sources to `teach`, which owns the one user teaching workspace. Do not independently generate quizzes, flashcards, workshops, lessons, or learning records.

`teach` decides the mission, storage-strength practice, lessons, and cross-session records. Keep every explanation grounded in the referenced code lines; project insight logs are evidence of work, not proof that the user learned it.
