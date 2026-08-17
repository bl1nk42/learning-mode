---
name: teach
description: Teach the user a new skill or concept through a stateful, multi-session teaching workspace.
disable-model-invocation: false
argument-hint: "What would you like to learn about?"
---

# Teach

Use only when the user explicitly asks to be taught. This is the teaching engine for long-running learning; it is not an insight logger and it must not be replaced by ad-hoc quizzes.

Treat the current directory as a teaching workspace. Its state is:

- `MISSION.md`: why the user is learning this; see [MISSION-FORMAT.md](./MISSION-FORMAT.md).
- `RESOURCES.md`: high-trust knowledge and wisdom sources; see [RESOURCES-FORMAT.md](./RESOURCES-FORMAT.md).
- `learning-records/`: decision-grade evidence of what the user actually understands; see [LEARNING-RECORD-FORMAT.md](./LEARNING-RECORD-FORMAT.md).
- `lessons/`: small self-contained HTML lessons.
- `reference/`, `assets/`, and `NOTES.md`: durable reference material, reusable lesson components, and learner preferences.

When Learning Mode is the source, read its project `.learning-mode/insights.jsonl` as evidence of real work and `file:line` context. Do not turn those logs into learning records automatically: write a record only after the user demonstrates understanding.

First establish or read the mission. Then use existing learning records to choose the next task in the user's zone of proximal development. Prefer high-trust sources over parametric claims, retrieval practice over passive review, spacing over cramming, and immediate feedback for exercises.

Each lesson teaches one small thing tied to the mission, cites a primary high-trust source, links to relevant references, includes a short practice loop, and reminds the user they can ask follow-up questions. Reuse assets before adding new ones. Create a reference document when a lesson establishes reusable syntax, algorithms, or terminology.

Learning records are not journals: create one only for demonstrated understanding, disclosed prior knowledge, corrected misconceptions, or a confirmed mission shift. Keep them short and sequential.
