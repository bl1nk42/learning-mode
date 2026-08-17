import json
import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def run_hook(name, payload, env=None):
    command_env = os.environ.copy()
    command_env.update(env or {})
    return subprocess.run(
        ["node", ROOT / "hooks" / name],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        env=command_env,
        check=True,
    )


def test_default_log_is_deduplicated_and_off_stops_capture(tmp_path):
    source = tmp_path / "runtime.js"
    source.write_text("// parent owns the log\n", encoding="utf-8")
    transcript = tmp_path / "transcript.jsonl"
    insight = """★ Insight ─────────────────────────────────────
- `runtime.js:1` — keep one parent log; subagents only report events.
─────────────────────────────────────────────────"""
    transcript.write_text(json.dumps({"assistant": insight}) + "\n", encoding="utf-8")
    payload = {"cwd": str(tmp_path), "transcript_path": str(transcript)}

    env = {"LEARNING_MODE_HOME": str(tmp_path / "user")}
    run_hook("record-insights.js", payload, env)
    run_hook("record-insights.js", payload, env)
    log = tmp_path / ".learning-mode" / "insights.jsonl"
    assert len(log.read_text(encoding="utf-8").splitlines()) == 1
    index = tmp_path / "user" / "insight-index.jsonl"
    indexed = json.loads(index.read_text(encoding="utf-8"))
    assert indexed["source"]["project"] == str(tmp_path)

    run_hook("mode-tracker.js", {"cwd": str(tmp_path), "prompt": "$learning-mode off"})
    second = insight.replace("one parent log", "a second decision")
    transcript.write_text(json.dumps({"assistant": second}), encoding="utf-8")
    run_hook("record-insights.js", payload, env)
    assert len(log.read_text(encoding="utf-8").splitlines()) == 1
