---
name: learning-mode
description: Use when the user asks to enable, disable, or explain Learning Mode's default/off runtime behavior.
---

# Learning Mode

The runtime has two states per project: `default` and `off`.

- `$learning-mode default` enables concise insights and canonical project logging.
- `$learning-mode off` returns to ordinary behavior and stops new log capture.

In `default`, make routine changes directly. For meaningful decisions, explain the trade-off and ask one concise question only when the choice belongs to the user. Add framed ★ Insight blocks before and after non-trivial changes. Each bullet must cite an exact `path/to/file:line`; the framed block is the log marker, so do not add hidden markers or log routine work.

For accumulated-log study material, invoke `$learning-mode-deep quiz`, `$learning-mode-deep flashcard`, `$learning-mode-deep workshop`, or `$learning-mode-deep all`.
