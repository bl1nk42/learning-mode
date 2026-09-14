---
name: scaffold-exercises
description: Use when the user asks to design or create practice exercises, quizzes, flashcards, workshops, challenges, scenarios, levels, or quests from a Learning Mode wiki or teaching mission.
---

# Scaffold Exercises

Design durable Obsidian Markdown exercises for `teach`; do not build a CLI. Use `$LEARNING_MODE_HOME/teach/exercises/` by default, or a user-chosen location. Templates are in `templates/scaffold-exercises/`. Use [[obsidian-markdown]] skill for all Markdown formatting — wikilinks, frontmatter, callouts, tags. Whether that folder is committed, ignored, or synced is the user's choice; never commit or change Git settings unless explicitly asked.

## Choose the format

**Basic formats:**
- `basic`: one new concept; `explainer/`, `problem/`, `solution/`.
- `linear`: several exercises from simple to complex; each builds on the last.
- `level`: escalating capability with a clear goal at each level.
- `quest`: connected tasks ending in a final challenge.
- `scenario`: realistic decision or debugging context with a reasoned solution.
- `challenge`: synthesis task; `problem/` and `solution/` without a new explainer.

**Deep learning formats (from `$learning-mode deep`):**
- `quiz`: short retrieval questions for spaced repetition; each has `problem/` and `solution/`.
- `flashcard`: one concept per card, front/back, optimized for quick recall; uses `flashcards/` directory.
- `workshop`: hands-on multi-step project combining multiple concepts; uses `steps/` directory.

Pick the smallest format that demonstrates the mission objective. Use the user's language for explanations; preserve code, identifiers, paths, and errors exactly. When the format is a meaningful learner-facing choice, state the trade-off and ask the user once; otherwise choose it from the mission and prerequisites.

## Markdown structure

Use dash-case directories and ordered prefixes only when there are multiple sections or exercises:

```text
exercises/01-topic/
├── README.md
├── manifest.yaml
└── 01.01-exercise-name/
    ├── README.md
    ├── manifest.yaml
    ├── explainer/README.md
    ├── problem/README.md
    └── solution/README.md
```

**Flashcard directory:**
```text
exercises/flashcards/
├── README.md
├── manifest.yaml
└── 01-concept-name.md    # front/back format
```

**Workshop directory:**
```text
exercises/01-workshop/
├── README.md
├── manifest.yaml
└── steps/
    ├── 01-setup.md
    ├── 02-implement.md
    └── 03-test.md
```

Create only the folders required by the chosen format. Every exercise manifest includes: `id`, `title`, `format`, `difficulty`, `estimated_minutes`, `prerequisites`, `learning_objectives`, `dependencies`, `status`, and `assumptions`. Start with `status: draft`. `assumptions` records choices the agent made because the request did not specify them.

`explainer` states the objective, prerequisite, concept, a minimal example, and what the learner will be able to do. `problem` states the task, context, constraints, deliverable, and passing criteria. `solution` explains the answer, reasoning, alternatives when useful, and pitfalls. Do not leak the solution into the problem.

**Flashcard format:** Each card has `# Front` and `# Back` sections. Front is a question or prompt; back is a concise answer with code example if applicable.

**Workshop format:** Each step has `## Objective`, `## Instructions`, `## Verify` sections. Steps build on each other toward a complete project.

## Validate before handoff

Separate structural checks from learning checks:

- **Lint:** ordered/dash-case paths when used, required `README.md` files, non-empty Markdown, manifests, no broken local links, and no stray placeholder files.
- **Validate:** selected format matches its folders, objectives have a matching task and passing criterion, prerequisites/dependencies exist and form no cycle, difficulty increases for `linear`/`level`, and solutions explain reasoning.

Report created files, format, assumptions, passed checks, gaps, and the next learner action. Creating an exercise is not evidence of learning: `teach` writes a learning record only after the user demonstrates understanding.
