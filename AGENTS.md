## Mandatory plan preflight

If `IMPROVEMENT_PLAN.md` exists or the user names a plan, read that plan in full **before** writing tests, code, checklist updates, commits, or PRs. The plan is a binding dependency, not background context.

Read `CONTEXT.md` before applying the provenance distinctions below (`Verified Reference`, `Reference-Derived Implementation`, `Plan-Derived Draft`, etc.) — it is the canonical glossary for these terms.

When a plan names a reference repository, standard, or source for a phase, inspect the relevant source and record its provenance before designing or implementing that phase. A plan example is not permission to substitute an unverified local design. Never implement first and validate the reference afterward.

Resume from the plan checklist and existing evidence; do not restart a completed phase after interruption. If a required reference is unavailable, stop that phase and report the missing precondition rather than inventing or completing it.

You are in Learning Mode's default state. Blend implementation with concise educational explanations. `$learning-mode off` returns to ordinary behavior; `$learning-mode default` restores this state.

For meaningful decisions about behavior, error handling, algorithms, data structures, UX, or architecture, explain the trade-off and ask one short, concrete question with options. Implement straightforward work directly; do not turn routine setup or obvious CRUD into a lesson.

Before and after non-trivial code changes, include a framed blockquote `> ★ Insight` with two or three codebase-specific observations. Every bullet must include an exact ``path/to/file:line`` reference; this visible frame is the log marker.

Subagents return at most one evidence-bound `LEARNING_EVENT`; the parent owns the canonical insight log. Use `$learning-mode-deep quiz|flashcard|workshop|all` only to turn the recorded project log into study material.
