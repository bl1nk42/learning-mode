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
    assert "scaffold-exercises" in text


def test_exercise_skill_designs_markdown_practice_without_git_policy():
    exercise = (ROOT / "skills" / "scaffold-exercises" / "SKILL.md").read_text(encoding="utf-8")

    assert "basic" in exercise and "challenge" in exercise
    assert "learning_objectives" in exercise and "passing criteria" in exercise
    assert "never commit" in exercise
    assert "do not build a CLI" in exercise


def test_insight_wiki_is_the_cross_project_curator():
    wiki = (ROOT / "skills" / "insight-wiki" / "SKILL.md").read_text(encoding="utf-8")

    assert "insight-index.jsonl" in wiki
    assert "user uses for this request" in wiki
    assert "sources.md" in wiki
    assert "writing-beats" in wiki
    assert "writing-shape" in wiki


def test_wiki_writing_skills_keep_evidence_separate_from_prose():
    beats = (ROOT / "skills" / "writing-beats" / "SKILL.md").read_text(encoding="utf-8")
    shape = (ROOT / "skills" / "writing-shape" / "SKILL.md").read_text(encoding="utf-8")

    assert "evidence.md" in beats
    assert "beats.md" in shape
    assert "read-only" in shape
