import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def run_hook(name, payload):
    return subprocess.run(
        ["node", ROOT / "hooks" / name],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        check=True,
    )


def test_default_log_is_deduplicated_and_off_stops_capture(tmp_path):
    transcript = tmp_path / "transcript.jsonl"
    marker = (
        '<!-- learning-mode-log: {"decision":"keep one parent log",'
        '"evidence":"subagents only report events","tags":["logs"]} -->'
    )
    transcript.write_text(json.dumps({"assistant": marker}) + "\n", encoding="utf-8")
    payload = {"cwd": str(tmp_path), "transcript_path": str(transcript)}

    run_hook("record-insights.js", payload)
    run_hook("record-insights.js", payload)
    log = tmp_path / ".learning-mode" / "insights.jsonl"
    assert len(log.read_text(encoding="utf-8").splitlines()) == 1

    run_hook("mode-tracker.js", {"cwd": str(tmp_path), "prompt": "$learning-mode off"})
    second = marker.replace("one parent log", "a second decision")
    transcript.write_text(json.dumps({"assistant": second}), encoding="utf-8")
    run_hook("record-insights.js", payload)
    assert len(log.read_text(encoding="utf-8").splitlines()) == 1
