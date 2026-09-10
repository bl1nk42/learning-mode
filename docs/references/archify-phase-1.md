# Archify provenance for Phase 1

Verified before this Phase 1 continuation.

- Repository: https://github.com/tt-a1i/archify
- Revision: `06dd052602dd9a369e4d034e24faef0917b5a60c`
- Inspected source: `archify/SKILL.md` and `archify/schemas/architecture.schema.json`.

Applied constraints:

- The canvas schema uses JSON Schema Draft 2020-12 and closes object shapes, following the reference schema contract.
- Delivery must validate the candidate before it replaces the artifact; this repository applies that gate before writing `learning-plan.canvas`.
- Evidence pins follow the reference schema's repository revision plus source path/line convention; each generated evidence reference carries its own immutable revision.
- Wiki comparison reports the bounded before/delta/after facts used by the plan; it does not infer impact from those changes.
- Required phase transitions are represented as standard `contains` constraints, so the validator can enforce them without relying on metadata alone.

This records provenance for the resumed work. It does not retroactively claim that commits made before this record were reference-derived.
