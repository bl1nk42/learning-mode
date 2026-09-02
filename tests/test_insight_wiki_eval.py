import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def check(wiki, index, json_output=False):
    cmd = ["node", ROOT / "scripts" / "check-insight-wiki.js", wiki, index]
    if json_output:
        cmd.append("--json")
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode, result.stdout, result.stderr


def generate(wiki, index=None):
    command = ["node", ROOT / "scripts" / "generate-learning-plan-canvas.js", wiki]
    if index is not None:
        command.extend(["--index", index])
    return subprocess.run(
        command,
        capture_output=True,
    ).returncode


def test_wiki_checker_distinguishes_grounded_evidence_from_bad_wiki(tmp_path):
    insight_id = "0123456789abcdef"
    index = tmp_path / "index.jsonl"
    index.write_text(json.dumps({"id": insight_id, "references": [{"file": "hooks/runtime.js", "line": 36}]}) + "\n", encoding="utf-8")
    good = tmp_path / "good"
    good.mkdir()
    (good / "README.md").write_text("# Hook flow\n", encoding="utf-8")
    (good / "evidence.md").write_text(insight_id, encoding="utf-8")
    (good / "beats.md").write_text("Requires: hooks\nGrounds: state\nEvidence: " + insight_id, encoding="utf-8")
    (good / "sources.md").write_text(insight_id, encoding="utf-8")
    assert generate(good, index) == 0
    assert check(good, index)[0] == 0

    bad = tmp_path / "bad"
    bad.mkdir()
    for name in ["README.md", "evidence.md", "sources.md"]:
        (bad / name).write_text(insight_id, encoding="utf-8")
    (bad / "beats.md").write_text("A vague outline", encoding="utf-8")
    assert check(bad, index)[0] != 0


def test_checker_emits_structured_diagnostics_on_failure(tmp_path):
    """With --json flag, validator returns structured diagnostics instead of just exit code."""
    insight_id = "0123456789abcdef"
    index = tmp_path / "index.jsonl"
    index.write_text(json.dumps({"id": insight_id, "references": [{"file": "hooks/runtime.js", "line": 36}]}) + "\n", encoding="utf-8")

    bad = tmp_path / "bad"
    bad.mkdir()
    for name in ["README.md", "evidence.md", "sources.md"]:
        (bad / name).write_text(insight_id, encoding="utf-8")
    (bad / "beats.md").write_text("A vague outline", encoding="utf-8")

    code, stdout, stderr = check(bad, index, json_output=True)

    assert code != 0
    assert stdout.strip() != ""
    diag = json.loads(stdout.strip())

    # Structured diagnostics must have these fields
    assert "code" in diag
    assert "severity" in diag
    assert "subject" in diag
    assert "evidence" in diag
    assert "supportedFixes" in diag
    assert isinstance(diag["supportedFixes"], list)

    # The code should identify the specific failure
    assert diag["code"] in ("MISSING_PHASE_NODE", "MISSING_REQUIRED_FILE", "INVALID_BEATS_FORMAT", "INVALID_CANVAS_JSON")


def valid_wiki(tmp_path):
    insight_id = "0123456789abcdef"
    index = tmp_path / "index.jsonl"
    index.write_text(json.dumps({"id": insight_id, "references": [{"file": "hooks/runtime.js", "line": 36}]}) + "\n", encoding="utf-8")
    wiki = tmp_path / "wiki"
    wiki.mkdir()
    (wiki / "README.md").write_text("# Hook flow\n", encoding="utf-8")
    (wiki / "evidence.md").write_text(insight_id, encoding="utf-8")
    (wiki / "beats.md").write_text("Requires: hooks\nGrounds: state\nEvidence: " + insight_id, encoding="utf-8")
    (wiki / "sources.md").write_text(insight_id, encoding="utf-8")
    assert generate(wiki, index) == 0
    return wiki, index


def json_diagnostic(wiki, index):
    code, stdout, _ = check(wiki, index, json_output=True)
    assert code == 1
    return json.loads(stdout)


def test_checker_reports_missing_required_file(tmp_path):
    wiki, index = valid_wiki(tmp_path)
    (wiki / "sources.md").unlink()

    diagnostic = json_diagnostic(wiki, index)

    assert diagnostic["code"] == "MISSING_REQUIRED_FILE"
    assert diagnostic["evidence"]["missing"] == "sources.md"
    assert diagnostic["supportedFixes"] == [{"action": "create_file", "file": "sources.md"}]


def test_checker_reports_missing_phase_node(tmp_path):
    wiki, index = valid_wiki(tmp_path)
    canvas_path = wiki / "learning-plan.canvas"
    canvas = json.loads(canvas_path.read_text(encoding="utf-8"))
    canvas["nodes"] = [node for node in canvas["nodes"] if node["id"] != "practice"]
    canvas_path.write_text(json.dumps(canvas), encoding="utf-8")

    diagnostic = json_diagnostic(wiki, index)

    assert diagnostic["code"] == "MISSING_PHASE_NODE"
    assert diagnostic["evidence"]["missing"] == ["practice"]


def test_checker_reports_broken_phase_edge(tmp_path):
    wiki, index = valid_wiki(tmp_path)
    canvas_path = wiki / "learning-plan.canvas"
    canvas = json.loads(canvas_path.read_text(encoding="utf-8"))
    canvas["edges"] = [edge for edge in canvas["edges"] if edge["fromNode"] != "practice"]
    canvas_path.write_text(json.dumps(canvas), encoding="utf-8")

    diagnostic = json_diagnostic(wiki, index)

    assert diagnostic["code"] == "MISSING_PHASE_EDGE"
    assert diagnostic["evidence"]["missing"] == ["practice->demonstrated"]


def test_checker_reports_invalid_coordinate(tmp_path):
    wiki, index = valid_wiki(tmp_path)
    canvas_path = wiki / "learning-plan.canvas"
    canvas = json.loads(canvas_path.read_text(encoding="utf-8"))
    canvas["nodes"][0]["x"] = None
    canvas_path.write_text(json.dumps(canvas), encoding="utf-8")

    diagnostic = json_diagnostic(wiki, index)

    assert diagnostic["code"] == "INVALID_NODE_GEOMETRY"
    assert diagnostic["evidence"]["badNodes"][0]["x"] is None


def test_checker_reports_unpinned_evidence(tmp_path):
    wiki, index = valid_wiki(tmp_path)
    canvas_path = wiki / "learning-plan.canvas"
    canvas = json.loads(canvas_path.read_text(encoding="utf-8"))
    next(node for node in canvas["nodes"] if node["id"] == "evidence").pop("evidenceRefs")
    canvas_path.write_text(json.dumps(canvas), encoding="utf-8")

    diagnostic = json_diagnostic(wiki, index)

    assert diagnostic["code"] == "EVIDENCE_NOT_PINNED"


def test_checker_reports_stale_evidence_id(tmp_path):
    wiki, index = valid_wiki(tmp_path)
    stale_id = "fedcba9876543210"
    (wiki / "evidence.md").write_text(stale_id, encoding="utf-8")
    (wiki / "sources.md").write_text(stale_id, encoding="utf-8")

    diagnostic = json_diagnostic(wiki, index)

    assert diagnostic["code"] == "EVIDENCE_ID_NOT_IN_INDEX"
    assert diagnostic["evidence"]["missing"] == [stale_id]


def test_generator_writes_schema_valid_canvas_and_receipt_atomically(tmp_path):
    wiki, _ = valid_wiki(tmp_path)
    receipt_path = wiki / "learning-plan.receipt.json"

    assert receipt_path.is_file()
    receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
    canvas = json.loads((wiki / "learning-plan.canvas").read_text(encoding="utf-8"))

    assert (ROOT / "schemas" / "learning-plan-canvas.schema.json").is_file()
    assert receipt["canvasPath"] == "learning-plan.canvas"
    assert len(receipt["sourceBundleSha256"]) == 64
    assert len(receipt["canvasSha256"]) == 64
    assert receipt["schemaVersion"] == "1.0.0"
    assert canvas["meta"]["title"] == "Hook flow"
    assert canvas["meta"]["schemaVersion"] == "1.0.0"


def test_generator_pins_evidence_to_indexed_source_references(tmp_path):
    wiki, index = valid_wiki(tmp_path)
    canvas = json.loads((wiki / "learning-plan.canvas").read_text(encoding="utf-8"))
    evidence_node = next(node for node in canvas["nodes"] if node["id"] == "evidence")

    revision = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    assert evidence_node["evidenceRefs"] == [{
        "id": "0123456789abcdef",
        "path": "hooks/runtime.js",
        "line": 36,
        "revision": revision,
    }]


def test_generator_validates_canvas_against_the_declared_json_schema(tmp_path):
    wiki, _ = valid_wiki(tmp_path)
    result = subprocess.run(
        ["node", "scripts/validate-learning-plan-canvas.js", wiki / "learning-plan.canvas"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    assert json.loads(result.stdout) == {"ok": True}


def test_canvas_schema_rejects_an_unknown_node_property(tmp_path):
    wiki, _ = valid_wiki(tmp_path)
    canvas_path = wiki / "learning-plan.canvas"
    canvas = json.loads(canvas_path.read_text(encoding="utf-8"))
    canvas["nodes"][0]["unexpected"] = True
    canvas_path.write_text(json.dumps(canvas), encoding="utf-8")

    result = subprocess.run(
        ["node", "scripts/validate-learning-plan-canvas.js", canvas_path],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 1
    assert json.loads(result.stderr)["code"] == "INVALID_CANVAS_SCHEMA"


def test_canvas_schema_declares_the_required_phase_chain():
    schema = json.loads((ROOT / "schemas" / "learning-plan-canvas.schema.json").read_text(encoding="utf-8"))

    assert schema["x-learning-mode-phase-chain"] == {
        "nodes": ["observed", "practice", "demonstrated", "transfer"],
        "edges": ["observed->practice", "practice->demonstrated", "demonstrated->transfer"],
    }
