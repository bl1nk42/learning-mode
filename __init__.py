"""Hermes adapter for Learning Mode."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent


def _context(**_):
    """Return the runtime context adapter payload."""
    return {"context": (ROOT / "AGENTS.md").read_text(encoding="utf-8")}


def register(ctx):
    """Register the learning-mode skill and context hook."""
    skill = ROOT / "skills" / "learning-mode" / "SKILL.md"
    if skill.exists():
        ctx.register_skill("learning-mode", skill)
    ctx.register_hook("pre_llm_call", _context)
