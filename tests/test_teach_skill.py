from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_teach_skill_keeps_its_stateful_workspace_contract():
    teach = ROOT / "skills" / "teach"
    text = (teach / "SKILL.md").read_text(encoding="utf-8")

    assert "disable-model-invocation: false" in text
    assert "multi-session teaching workspace" in text
    for name in [
        "LEARNING-RECORD-FORMAT.md",
        "MISSION-FORMAT.md",
        "RESOURCES-FORMAT.md",
        "GLOSSARY-FORMAT.md",
    ]:
        assert (teach / name).is_file()


def test_insight_wiki_is_the_cross_project_curator():
    wiki = (ROOT / "skills" / "insight-wiki" / "SKILL.md").read_text(encoding="utf-8")

    assert "insight-index.jsonl" in wiki
    assert "user uses for this request" in wiki
    assert "sources.md" in wiki
