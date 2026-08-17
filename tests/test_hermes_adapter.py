import importlib.util
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_adapter():
    spec = importlib.util.spec_from_file_location("learning_mode", ROOT / "__init__.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FakeContext:
    def __init__(self):
        self.skills = []
        self.hooks = []

    def register_skill(self, name, path):
        self.skills.append((name, path))

    def register_hook(self, name, callback):
        self.hooks.append((name, callback))


def test_registers_skill_and_context_hook():
    adapter = load_adapter()
    context = FakeContext()

    adapter.register(context)

    assert context.skills[0][0] == "learning-mode"
    assert context.hooks[0][0] == "pre_llm_call"
    assert "learning mode" in context.hooks[0][1]()["context"].lower()
