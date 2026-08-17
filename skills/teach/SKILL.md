---
name: teach
description: Teach the user a new skill or concept through a stateful, multi-session teaching workspace.
disable-model-invocation: false
argument-hint: "What would you like to learn about?"
---

# Teach

Use only when the user explicitly asks to be taught. This is the teaching engine for long-running learning; it is not an insight logger and it must not be replaced by ad-hoc quizzes.

Use one user-owned teaching workspace at `$LEARNING_MODE_HOME/teach` (default: `~/.learning-mode/teach`), never one workspace per source project. Its state is:

- `MISSION.md`: why the user is learning this; see [MISSION-FORMAT.md](./MISSION-FORMAT.md).
- `RESOURCES.md`: high-trust knowledge and wisdom sources; see [RESOURCES-FORMAT.md](./RESOURCES-FORMAT.md).
- `learning-records/`: decision-grade evidence of what the user actually understands; see [LEARNING-RECORD-FORMAT.md](./LEARNING-RECORD-FORMAT.md).
- `exercises/`: user-owned Markdown practice designed with `scaffold-exercises`; it may be committed, ignored, or synced only as the user chooses.
- `reference/`, `assets/`, and `NOTES.md`: durable reference material, reusable lesson components, and learner preferences.

When Learning Mode is the source, use the relevant `insight-wikis/<topic>/` artifact first. `insight-wiki` owns selection, verification, and cross-project synthesis; use its `sources.md` to inspect evidence when needed. Do not turn logs or a wiki into learning records automatically: write a record only after the user demonstrates understanding.

First establish or read the mission. Then use existing learning records to choose the next task in the user's zone of proximal development. Prefer high-trust sources over parametric claims, retrieval practice over passive review, spacing over cramming, and immediate feedback for exercises.

Each lesson teaches one small thing tied to the mission, cites a primary high-trust source, links to relevant references, includes a short practice loop, and reminds the user they can ask follow-up questions. Use `scaffold-exercises` when that loop needs a durable quiz, scenario, level, quest, or challenge; it owns format, objectives, prerequisites, and pass criteria. Reuse assets before adding new ones. Create a reference document when a lesson establishes reusable syntax, algorithms, or terminology.

Learning records are not journals: create one only for demonstrated understanding, disclosed prior knowledge, corrected misconceptions, or a confirmed mission shift. Keep them short and sequential.
