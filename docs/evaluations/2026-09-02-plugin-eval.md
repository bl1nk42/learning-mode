# Learning Mode: task-fit evaluation

- **Date:** 2026-09-02
- **Evaluator:** Plugin Eval 0.1.0 (the generated report title uses cache directory `0.1.0`; the evaluated manifest version is `learning-mode` 0.3.0)
- **Measured scenario:** replayed real artifact `91178cf595e68c92` from `plugins/sandbox-mcp/.learning-mode/insights.jsonl`.
- **Reproducibility:** [scenario config](../../.plugin-eval/benchmark.json) and [observed usage](../../.plugin-eval/benchmark-usage.jsonl).

## Does it help with real work?

**Yes, for evidence capture and recall.** The measured run verified three live source references, replayed the same framed Insight twice through `hooks/record-insights.js`, and produced exactly one project-log entry and one user-index entry. It changed no `sandbox-mcp` product files. This is the intended boundary: preserve a verified engineering decision for later cross-project retrieval without silently modifying the source project.

**Measurement caveat.** Plugin Eval recursively counts repository text as deferred supporting material, including the committed scenario corpus; use its static budget as a comparative signal, not a direct runtime-cost claim.

**Not yet proven broadly.** This is one successful capture/dedupe scenario, not proof that wiki generation, teaching, or all host adapters are equally effective. The observed 158,014 input tokens measure the whole Codex run, including its loaded environment; they are not the incremental cost of Learning Mode. Collect 5–10 real artifact scenarios before using cost or success rate as a release gate.

## Deferred product opportunity: learning-plan composer

After the current improvement plan is complete, evaluate a user-facing **learning-plan composer**. It would turn selected verified insight artifacts into a goal, prerequisite order, practice items, and an optional generated Canvas. It must reuse the existing evidence/index and `Observed → Practice → Demonstrated → Transfer` path, keep learner progress out of generated views, and remain opt-in. It is deliberately deferred: the current plan first needs reliable diagnostics, atomic Canvas delivery, insight-store migration, and hook-path hardening.

---

# Plugin Eval Report: 0.1.0

## At a Glance
- Score: 35/100
- Grade: F
- Risk: high
- Checks: 3 fail, 5 warn, 4 info
- Active budget: 3055 tokens (excessive)
- Observed usage: 1 sample

## Why It Matters
- 3 failing error checks are driving the highest-confidence problems.
- 5 warning signals still need cleanup before this feels polished.
- budget is the largest source of score loss at -42 points.
- Active budget pressure is high enough that token cost may dominate the user experience.
- Observed usage is available from 1 sample.

## Fix First
- [fail/error] deferred_cost_tokens is excessive relative to the current Codex baseline. Why: Budget pressure matters because always-loaded or frequently-loaded text can make the workflow feel expensive fast. Fix: Reduce repeated instruction text and move detail into deferred supporting files.
- [fail/error] invoke_cost_tokens is excessive relative to the current Codex baseline. Why: Budget pressure matters because always-loaded or frequently-loaded text can make the workflow feel expensive fast. Fix: Reduce repeated instruction text and move detail into deferred supporting files.
- [fail/error] Static budget estimates differ meaningfully from observed input token usage. Why: Budget pressure matters because always-loaded or frequently-loaded text can make the workflow feel expensive fast. Fix: Trim repeated instructions or supporting text if the observed value is higher than expected. If the static estimate is intentionally conservative, record that assumption in the skill or plugin references.

## Recommended Next Step
- Review the measurement plan
- Why: You already have observed usage, so the highest-value next step is deciding what to instrument or improve.
- Chat request: "What should I run next?"
- Local command: `plugin-eval start ~/.codex/plugins/cache/personal/learning-mode/0.1.0 --request 'What should I run next?' --format markdown`

## Details
<details>
<summary>Watch next</summary>

- [warn/warning] The plugin manifest name does not match the plugin directory name. Why: Manifest issues reduce trust because Codex may not discover or represent the plugin correctly. Fix: Keep the plugin directory name and plugin.json name aligned.
- [warn/warning] Observed usage coverage is too small to trust as a stable benchmark yet. Why: Weak measurement means you are still steering with estimates instead of evidence. Fix: Capture at least 5 to 10 representative sessions before treating observed usage as a baseline.
- [warn/warning] The skill frontmatter contains keys outside the common Codex skill conventions. Why: Best-practice gaps usually do not break the workflow immediately, but they make the skill harder to understand and improve. Fix: Remove non-standard frontmatter keys or move the metadata into references.
</details>
<details>
<summary>Improvement brief</summary>

- Raise the evaluation from grade F (35/100) with a focus on the highest-signal structural and budget issues first.
- Goal: Keep the plugin directory name and plugin.json name aligned.
- Goal: Remove non-standard frontmatter keys or move the metadata into references.
- Goal: Rewrite the description to include a clear 'Use when ...' trigger sentence.
- Goal: Reduce repeated instruction text and move detail into deferred supporting files.
- Measure: token-usage-observer
- Measure: task-outcome-scorecard
- Measure: tool-call-audit
- Measure: latency-efficiency
- Suggested prompt: Use the skill-creator guidance to improve 0.1.0. Keep the structure compact and move bulky details into references or scripts. Define success measures with these toolsets: token-usage-observer, task-outcome-scorecard, tool-call-audit, latency-efficiency. Address invoke_cost_tokens-budget-high: invoke_cost_tokens is excessive relative to the current Codex baseline. Address deferred_cost_tokens-budget-high: deferred_cost_tokens is excessive relative to the current Codex baseline. Address observed-usage-estimate-drift: Static budget estimates differ meaningfully from observed input token usage. Address manifest-name-directory-mismatch: The plugin manifest name does not match the plugin directory name. Address skill:insight-wiki:frontmatter-extra-keys: The skill frontmatter contains keys outside the common Codex skill conventions. Address skill:teach:frontmatter-extra-keys: The skill frontmatter contains keys outside the common Codex skill conventions. Address skill:teach:description-trigger-weak: The description does not clearly advertise when the skill should trigger. Address observed-usage-small-sample: Observed usage coverage is too small to trust as a stable benchmark yet.
</details>
<details>
<summary>Budgets and observed usage</summary>

- trigger_cost_tokens: 202 (moderate)
- invoke_cost_tokens: 2853 (excessive)
- deferred_cost_tokens: 18706 (excessive)
- explicit_only_invoke_cost_tokens: 634 (moderate, unscored)
- total_tokens: 21761 (excessive)
- invocation_policy: 6 implicit skill(s), 1 explicit-only skill(s)

- samples: 1
- observed_input_tokens_avg: 158014
- observed_output_tokens_avg: 4004
- observed_total_tokens_avg: 162018
- observed_cached_tokens_avg: 77312
- estimated_active_tokens: 3055
- estimate_vs_observed_input_delta: 154959
- estimate_vs_observed_input_ratio: 50.72 (wide-drift)
</details>
<details>
<summary>Measurement plan</summary>

Combine cost, outcome, and trust signals so you can tell whether the skill or plugin is genuinely helping instead of only looking well-structured on paper.

- Token Usage Observer [high] Measure how many tokens the skill or plugin actually burns in representative runs. Signals: observed_usage_sample_count, observed_input_tokens_avg, observed_total_tokens_avg, estimate_vs_observed_input_ratio. Evidence: Responses API usage logs, Codex-like session exports, JSONL traces captured from local benchmarking harnesses.
- Task Outcome Scorecard [high] Measure whether the skill helps users finish the intended job with fewer retries and less cleanup. Signals: task_success_rate, first_pass_success_rate, retry_rate, human_override_rate. Evidence: Task run logs, Structured user acceptance checklist, Before/after comparison runs on the same prompts.
- Tool Call Audit [high] Check whether the agent uses the right tools, arguments, and sequencing when the skill is active. Signals: tool_call_success_rate, invalid_tool_argument_rate, recoverable_tool_failure_rate. Evidence: Tool invocation traces, Recorded sessions, Golden-path scenario replays.
- Latency And Efficiency [high] Track whether the skill speeds users up enough to justify its cost. Signals: p50_time_to_first_acceptable_answer_seconds, p95_time_to_task_completion_seconds, tokens_per_successful_run. Evidence: Benchmark harness timings, Manual stopwatch runs on canonical tasks, Responses API timestamps combined with usage logs.
- Human Rubric Review [medium] Capture clarity, trust, and usefulness signals that automated checks will miss. Signals: clarity_score_avg, confidence_score_avg, follow_up_question_rate. Evidence: Reviewer scorecards, Team rubric sheets, Annotated transcripts.
- Regression Suite [medium] Protect the repository behavior that the skill is supposed to improve. Signals: test_pass_rate, lint_pass_rate, regression_escape_count. Evidence: Unit and integration test runs, Coverage deltas, Snapshot or golden-file checks.
</details>
<details>
<summary>Use From Codex Chat</summary>

Start with a natural chat request, then let plugin-eval show the exact local command sequence behind it.

Start with this chat request: "Measure the real token usage of this plugin."
Why this path: Plugin Eval recommended Measure Real Token Usage from the current local state for this plugin.
Quick local entrypoint: plugin-eval start ~/.codex/plugins/cache/personal/learning-mode/0.1.0 --request 'Measure the real token usage of this plugin.' --format markdown
Plugin Eval will run first: plugin-eval analyze ~/.codex/plugins/cache/personal/learning-mode/0.1.0 --observed-usage ~/.codex/plugins/cache/personal/learning-mode/0.1.0/.plugin-eval/benchmark-usage.jsonl --format markdown

Other chat requests you can use:
- Full Plugin Analysis: say "Give me a full analysis of this plugin, including benchmark setup." -> plugin-eval analyze ~/.codex/plugins/cache/personal/learning-mode/0.1.0 --observed-usage ~/.codex/plugins/cache/personal/learning-mode/0.1.0/.plugin-eval/benchmark-usage.jsonl --format markdown
- Evaluate Plugin: say "Evaluate this plugin." -> plugin-eval analyze ~/.codex/plugins/cache/personal/learning-mode/0.1.0 --format markdown
- Explain Token Budget: say "Explain the token budget for this plugin." -> plugin-eval explain-budget ~/.codex/plugins/cache/personal/learning-mode/0.1.0 --format markdown
- Measure Real Token Usage: say "Measure the real token usage of this plugin." -> plugin-eval analyze ~/.codex/plugins/cache/personal/learning-mode/0.1.0 --observed-usage ~/.codex/plugins/cache/personal/learning-mode/0.1.0/.plugin-eval/benchmark-usage.jsonl --format markdown
- Benchmark With Starter Scenarios: say "Help me benchmark this plugin." -> plugin-eval benchmark ~/.codex/plugins/cache/personal/learning-mode/0.1.0 --config ~/.codex/plugins/cache/personal/learning-mode/0.1.0/.plugin-eval/benchmark.json
- Start Here: say "What should I run next?" -> plugin-eval analyze ~/.codex/plugins/cache/personal/learning-mode/0.1.0 --observed-usage ~/.codex/plugins/cache/personal/learning-mode/0.1.0/.plugin-eval/benchmark-usage.jsonl --format markdown
</details>
<details>
<summary>Checks</summary>

- [WARN] manifest-name-directory-mismatch: The plugin manifest name does not match the plugin directory name. Evidence: Directory: 0.1.0 Manifest: learning-mode Remediation: Keep the plugin directory name and plugin.json name aligned.
- [WARN] skill:insight-wiki:frontmatter-extra-keys: The skill frontmatter contains keys outside the common Codex skill conventions. Evidence: Unexpected key: argument-hint Remediation: Remove non-standard frontmatter keys or move the metadata into references.
- [WARN] skill:teach:frontmatter-extra-keys: The skill frontmatter contains keys outside the common Codex skill conventions. Evidence: Unexpected key: argument-hint Remediation: Remove non-standard frontmatter keys or move the metadata into references.
- [WARN] skill:teach:description-trigger-weak: The description does not clearly advertise when the skill should trigger. Evidence: Descriptions are the primary auto-load surface in Codex. Remediation: Rewrite the description to include a clear 'Use when ...' trigger sentence.
- [FAIL] invoke_cost_tokens-budget-high: invoke_cost_tokens is excessive relative to the current Codex baseline. Evidence: Value: 2853 tokens Baseline samples: skills=6, plugins=0 Remediation: Reduce repeated instruction text and move detail into deferred supporting files.
- [FAIL] deferred_cost_tokens-budget-high: deferred_cost_tokens is excessive relative to the current Codex baseline. Evidence: Value: 18706 tokens Baseline samples: skills=6, plugins=0 Remediation: Reduce repeated instruction text and move detail into deferred supporting files.
- [WARN] observed-usage-small-sample: Observed usage coverage is too small to trust as a stable benchmark yet. Evidence: Samples collected: 1 Remediation: Capture at least 5 to 10 representative sessions before treating observed usage as a baseline.
- [FAIL] observed-usage-estimate-drift: Static budget estimates differ meaningfully from observed input token usage. Evidence: Estimated active tokens: 3055 Observed average input tokens: 158014 Delta ratio: 5072% Remediation: Trim repeated instructions or supporting text if the observed value is higher than expected. If the static estimate is intentionally conservative, record that assumption in the skill or plugin references.
- [INFO] observed-usage-cache-present: Observed runs include cached tokens, so repeated sessions are cheaper than the cold-start estimate. Evidence: Average cached tokens: 77312 Remediation: Track cold-start and warm-cache sessions separately if you need tighter budgeting.
- [INFO] coverage-artifacts-unavailable: No coverage artifacts were found for this target. Evidence: . Remediation: Generate `lcov.info`, `coverage.xml`, or an Istanbul coverage JSON file if you want coverage scoring.
</details>
<details>
<summary>Metrics</summary>

- skill:insight-wiki:skill_line_count: 34 lines (good)
- skill:insight-wiki:description_length_chars: 127 chars (good)
- skill:insight-wiki:relative_link_count: 0 links (good)
- skill:insight-wiki:code_fence_count: 0 blocks (good)
- skill:insight-wiki:support_file_count: 0 files (info)
- skill:learning-mode:skill_line_count: 16 lines (good)
- skill:learning-mode:description_length_chars: 99 chars (good)
- skill:learning-mode:relative_link_count: 0 links (good)
- skill:learning-mode:code_fence_count: 0 blocks (good)
- skill:learning-mode:support_file_count: 0 files (info)
- skill:learning-mode-deep:skill_line_count: 13 lines (good)
- skill:learning-mode-deep:description_length_chars: 114 chars (good)
- skill:learning-mode-deep:relative_link_count: 0 links (good)
- skill:learning-mode-deep:code_fence_count: 0 blocks (good)
- skill:learning-mode-deep:support_file_count: 0 files (info)
- skill:scaffold-exercises:skill_line_count: 50 lines (good)
- skill:scaffold-exercises:description_length_chars: 159 chars (good)
- skill:scaffold-exercises:relative_link_count: 0 links (good)
- skill:scaffold-exercises:code_fence_count: 1 blocks (good)
- skill:scaffold-exercises:support_file_count: 0 files (info)
- skill:teach:skill_line_count: 27 lines (good)
- skill:teach:description_length_chars: 91 chars (good)
- skill:teach:relative_link_count: 3 links (good)
- skill:teach:code_fence_count: 0 blocks (good)
- skill:teach:support_file_count: 5 files (good)
- skill:writing-beats:skill_line_count: 19 lines (good)
- skill:writing-beats:description_length_chars: 90 chars (good)
- skill:writing-beats:relative_link_count: 0 links (good)
- skill:writing-beats:code_fence_count: 0 blocks (good)
- skill:writing-beats:support_file_count: 0 files (info)
- skill:writing-shape:skill_line_count: 13 lines (good)
- skill:writing-shape:description_length_chars: 101 chars (good)
- skill:writing-shape:relative_link_count: 0 links (good)
- skill:writing-shape:code_fence_count: 0 blocks (good)
- skill:writing-shape:support_file_count: 0 files (info)
- plugin_skill_count: 7 skills (good)
- plugin_keyword_count: 0 keywords (info)
- plugin_default_prompt_count: 1 prompts (good)
- trigger_cost_tokens: 202 tokens (moderate)
- invoke_cost_tokens: 2853 tokens (excessive)
- deferred_cost_tokens: 18706 tokens (excessive)
- explicit_only_invoke_cost_tokens: 634 tokens (moderate)
- observed_usage_sample_count: 1 samples (heavy)
- observed_input_tokens_avg: 158014 tokens (info)
- observed_output_tokens_avg: 4004 tokens (info)
- observed_total_tokens_avg: 162018 tokens (info)
- observed_cached_tokens_avg: 77312 tokens (info)
- observed_reasoning_tokens_avg: 1396 tokens (info)
- estimate_vs_observed_input_delta: 154959 tokens (heavy)
- estimate_vs_observed_input_ratio: 50.72 ratio (heavy)
- py_file_count: 5 files (good)
- py_function_count: 17 functions (good)
- py_max_cyclomatic_complexity: 5 score (good)
- py_average_function_length: 8.12 lines (good)
- py_max_nesting_depth: 2 levels (good)
- py_comment_ratio: 0.012 ratio (moderate)
- py_test_file_count: 4 files (good)
- coverage_artifact_count: 0 files (info)
</details>
<details>
<summary>Score details</summary>

- Starting score: 100
- Total deductions: -65
- Final score: 35
- Risk: Contains 3 failing error checks (deferred_cost_tokens-budget-high, invoke_cost_tokens-budget-high, observed-usage-estimate-drift).
- Risk: Overall score is below 70, which the evaluator treats as high risk.

- -14 points: deferred_cost_tokens-budget-high [fail/error] deferred_cost_tokens is excessive relative to the current Codex baseline.
- -14 points: invoke_cost_tokens-budget-high [fail/error] invoke_cost_tokens is excessive relative to the current Codex baseline.
- -14 points: observed-usage-estimate-drift [fail/error] Static budget estimates differ meaningfully from observed input token usage.
- -4.5 points: manifest-name-directory-mismatch [warn/warning] The plugin manifest name does not match the plugin directory name.
- -4.5 points: observed-usage-small-sample [warn/warning] Observed usage coverage is too small to trust as a stable benchmark yet.
- -4.5 points: skill:insight-wiki:frontmatter-extra-keys [warn/warning] The skill frontmatter contains keys outside the common Codex skill conventions.
- -4.5 points: skill:teach:description-trigger-weak [warn/warning] The description does not clearly advertise when the skill should trigger.
- -4.5 points: skill:teach:frontmatter-extra-keys [warn/warning] The skill frontmatter contains keys outside the common Codex skill conventions.
- -0.25 points: coverage-artifacts-unavailable [info/info] No coverage artifacts were found for this target.
- -0.25 points: observed-usage-cache-present [info/info] Observed runs include cached tokens, so repeated sessions are cheaper than the cold-start estimate.

- budget: -42 points across 3 checks
- best-practice: -13.5 points across 3 checks
- measurement: -4.75 points across 2 checks
- manifest: -4.5 points across 1 check
- coverage: -0.25 points across 1 check
</details>
