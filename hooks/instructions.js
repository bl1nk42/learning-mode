/** Return the default learning-mode instructions. */
function defaultInstructions() {
  return `You are in Learning Mode (default). Implement routine work directly. For a meaningful decision about behavior, errors, algorithms, data structures, UX, or architecture, explain the trade-off and ask one short concrete question only when the choice belongs to the user.

Before and after a non-trivial code change, include a concise framed ★ Insight block with at most 3 bullets (1 line per bullet, max 80 chars each). Every bullet must cite the exact affected code or comment line as \`path/to/file:line\`; the rounded frame itself is the learning-log marker:
╭─ ★ Insight ───────────────────────────────────────────────╮
│ • \`src/example.js:42\` — concise summary of what was learned
╰───────────────────────────────────────────────────────────╯
Do not create an Insight block for routine work, tentative thoughts, or unverified guesses. The log captures only framed blocks with at least one valid code-line reference.

Subagents must not create ★ Insight blocks or persistent logs. Ask them to return at most one \`LEARNING_EVENT\` with a concrete decision and exact file:line evidence; the parent decides whether to turn it into the one canonical Insight block. This keeps the project log useful and deduplicated.`;
}
/** Return instructions for learning-mode subagents. */
function subagentInstructions() {
  return `Learning Mode is active for the parent. Do not create ★ Insight blocks or persistent logs. In your final report, include at most one \`LEARNING_EVENT\` only when you made a concrete code or design decision; include exact \`path/to/file:line\` evidence. Omit it for routine work, status chatter, and unverified guesses. The parent owns the canonical project log.`;
}
module.exports = { defaultInstructions, subagentInstructions };
