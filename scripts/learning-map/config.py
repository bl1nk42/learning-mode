#!/usr/bin/env python3

"""
config.py

Learning Mode configuration.
Vault path can be set via:
1. Environment variable: LEARNING_MODE_VAULT
2. Config file: ~/.learning-mode/config.json
3. OS-level default: ~/LearningVault
"""

import hashlib
import json
import os
from pathlib import Path

# --- Defaults ---
DEFAULT_VAULT_NAME = "LearningVault"
CONFIG_DIR = Path.home() / ".learning-mode"
CONFIG_FILE = CONFIG_DIR / "config.json"


# --- Get vault path ---
def get_vault_path():
    # 1. Environment variable (highest priority)
    if "LEARNING_MODE_VAULT" in os.environ:
        return os.environ["LEARNING_MODE_VAULT"]

    # 2. Config file
    if CONFIG_FILE.exists():
        try:
            config = json.loads(CONFIG_FILE.read_text())
            if "vaultPath" in config:
                return config["vaultPath"]
        except:
            pass

    # 3. OS-level default
    return str(Path.home() / DEFAULT_VAULT_NAME)


# --- Save vault path ---
def save_vault_path(vault_path):
    CONFIG_DIR.mkdir(exist_ok=True)

    config = {}
    if CONFIG_FILE.exists():
        try:
            config = json.loads(CONFIG_FILE.read_text())
        except:
            config = {}

    config["vaultPath"] = vault_path
    config["lastUpdated"] = __import__("datetime").datetime.now().isoformat()

    CONFIG_FILE.write_text(json.dumps(config, indent=2))


# --- Get project directory ---
def get_project_dir(project_root):
    project_id = hashlib.md5(project_root.encode()).hexdigest()[:8]
    vault_path = get_vault_path()
    return os.path.join(vault_path, "projects", project_id)


# --- Initialize vault ---
def init_vault(vault_path):
    dirs = [
        vault_path,
        os.path.join(vault_path, "projects"),
        os.path.join(vault_path, "insight-wikis"),
        os.path.join(vault_path, "teach"),
        os.path.join(vault_path, "teach", "learning-records"),
        os.path.join(vault_path, "teach", "exercises"),
    ]

    for d in dirs:
        os.makedirs(d, exist_ok=True)

    save_vault_path(vault_path)
    return vault_path


# --- CLI ---
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python config.py get              Show current vault path")
        print("  python config.py set <path>       Set vault path")
        print("  python config.py init <path>      Initialize vault at path")
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "get":
        print(get_vault_path())
    elif cmd == "set" and len(sys.argv) > 2:
        save_vault_path(sys.argv[2])
        print(f"Vault path set to: {sys.argv[2]}")
    elif cmd == "init" and len(sys.argv) > 2:
        init_vault(sys.argv[2])
        print(f"Vault initialized at: {sys.argv[2]}")
    else:
        print("Invalid command")
