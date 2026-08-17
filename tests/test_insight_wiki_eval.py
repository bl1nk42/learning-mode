import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def check(wiki, index):
    return subprocess.run(
        ["node", ROOT / "scripts" / "check-insight-wiki.js", wiki, index],
        capture_output=True,
    ).returncode


def test_wiki_checker_distinguishes_grounded_evidence_from_bad_wiki(tmp_path):
    insight_id = "0123456789abcdef"
    index = tmp_path / "index.jsonl"
    index.write_text(json.dumps({"id": insight_id}) + "\n", encoding="utf-8")
    good = tmp_path / "good"
    good.mkdir()
    (good / "README.md").write_text("# Hook flow\n", encoding="utf-8")
    (good / "evidence.md").write_text(insight_id, encoding="utf-8")
    (good / "beats.md").write_text("Requires: hooks\nGrounds: state\nEvidence: " + insight_id, encoding="utf-8")
    (good / "sources.md").write_text(insight_id, encoding="utf-8")
    assert check(good, index) == 0

    bad = tmp_path / "bad"
    bad.mkdir()
    for name in ["README.md", "evidence.md", "sources.md"]:
        (bad / name).write_text(insight_id, encoding="utf-8")
    (bad / "beats.md").write_text("A vague outline", encoding="utf-8")
    assert check(bad, index) != 0
