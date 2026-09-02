from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_ci_runs_python_regressions_on_the_supported_node_baseline():
    workflow = (ROOT / ".github/workflows/test.yml").read_text(encoding="utf-8")

    assert "node-version: '20'" in workflow
    assert "python-version: '3.11'" in workflow
    assert "python3 -B -m pytest -q" in workflow
