#!/usr/bin/env python3

"""
create-project-wiki.py

Creates wiki structure for a project based on templates/wiki template.
Uses Obsidian-compatible format with frontmatter.

Usage: python3 create-project-wiki.py <project-root>
"""

import hashlib
import json
import os
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import get_project_dir, get_vault_path


# --- Helpers ---
def get_project_id(project_root):
    return hashlib.md5(project_root.encode()).hexdigest()[:8]


def get_project_name(project_root):
    pkg_path = os.path.join(project_root, "package.json")
    if os.path.exists(pkg_path):
        with open(pkg_path, "r") as f:
            pkg = json.load(f)
            return pkg.get("name", os.path.basename(project_root))
    return os.path.basename(project_root)


def format_date(date):
    return date.strftime("%Y-%m-%d")


def create_frontmatter(title, type_, tags=None):
    if tags is None:
        tags = []
    today = format_date(datetime.now())
    tags_str = ", ".join([f'"{t}"' for t in tags])
    return f'''---
title: "{title}"
type: "{type_}"
status: "active"
created: "{today}"
updated: "{today}"
tags: [{tags_str}]
---'''


def create_index_page(project_name):
    return f"""{create_frontmatter("index", "concept", ["vault", "concept"])}
# Wiki Index: {project_name}

This catalog is updated by completed knowledge operations.

## Sources

- No sources indexed yet.

## Concepts

- No concepts indexed yet.

## Entities

- No entities indexed yet.

## Learning Points

- No learning points recorded yet.
"""


def create_overview_page(project_name):
    return f"""{create_frontmatter("overview", "concept", ["vault", "concept"])}
# Overview: {project_name}

This local-first vault compounds source-backed knowledge over time.

## Project Info

- **Name:** {project_name}
- **Created:** {format_date(datetime.now())}

## What's Inside

- **Concepts** — Ideas and patterns you've learned
- **Entities** — Concrete things (files, functions, classes)
- **Learning Points** — Insights from working with AI
"""


def create_hot_page(project_name):
    return f"""{create_frontmatter("hot", "concept", ["vault", "concept"])}
# Recent Context

## Last Updated

Vault initialized. No knowledge operations have completed yet.

## Key Recent Facts

- No facts recorded.

## Recent Changes

- Created the vault foundation.

## Active Threads

- Add insights to start building knowledge.
"""


def create_log_page(project_name):
    return f"""{create_frontmatter("log", "concept", ["vault", "concept"])}
# Wiki Log: {project_name}

Newest completed operations appear first.
"""


def create_concept_template(concept_name):
    return f"""{create_frontmatter(concept_name, "concept", ["concept"])}
# {concept_name}

## Definition

[Write definition here]

## Related Concepts

- [Concept 1](concepts/concept1.md)
- [Concept 2](concepts/concept2.md)

## Sources

- [Source 1](sources/source1.md)

## Learning Points

- No learning points yet.
"""


def create_entity_template(entity_name):
    return f"""{create_frontmatter(entity_name, "entity", ["entity"])}
# {entity_name}

## What Is It

[Write description here]

## Related Concepts

- [Concept 1](concepts/concept1.md)

## Sources

- [Source 1](sources/source1.md)

## Learning Points

- No learning points yet.
"""


def create_source_template(source_name):
    return f"""{create_frontmatter(source_name, "source", ["source"])}
# {source_name}

## What Is It

[Write description here]

## Key Points

- Point 1
- Point 2

## Related Concepts

- [Concept 1](concepts/concept1.md)

## Related Entities

- [Entity 1](entities/entity1.md)
"""


# --- Main ---
def main():
    if len(sys.argv) < 2:
        project_root = os.getcwd()
    else:
        project_root = sys.argv[1]

    if not os.path.exists(project_root):
        print(f"Project root does not exist: {project_root}")
        sys.exit(1)

    vault_path = get_vault_path()
    project_id = get_project_id(project_root)
    project_name = get_project_name(project_root)
    project_dir = get_project_dir(project_root)
    wiki_dir = os.path.join(project_dir, "wiki")

    print(f"Vault: {vault_path}")
    print(f"Project: {project_name} ({project_id})")
    print(f"Wiki: {wiki_dir}")

    # Create wiki directory structure
    dirs = [
        wiki_dir,
        os.path.join(wiki_dir, "concepts"),
        os.path.join(wiki_dir, "entities"),
        os.path.join(wiki_dir, "meta"),
        os.path.join(wiki_dir, "meta", "ledgers"),
        os.path.join(wiki_dir, "sources"),
    ]

    for d in dirs:
        os.makedirs(d, exist_ok=True)

    # Create pages
    pages = [
        ("index.md", create_index_page(project_name)),
        ("overview.md", create_overview_page(project_name)),
        ("hot.md", create_hot_page(project_name)),
        ("log.md", create_log_page(project_name)),
    ]

    for name, content in pages:
        page_path = os.path.join(wiki_dir, name)
        if not os.path.exists(page_path):
            with open(page_path, "w") as f:
                f.write(content)
            print(f"Created: {page_path}")

    # Create template files
    templates_dir = os.path.join(wiki_dir, "_templates")
    os.makedirs(templates_dir, exist_ok=True)

    templates = [
        ("concept.md", create_concept_template("Concept Name")),
        ("entity.md", create_entity_template("Entity Name")),
        ("source.md", create_source_template("Source Name")),
    ]

    for name, content in templates:
        template_path = os.path.join(templates_dir, name)
        with open(template_path, "w") as f:
            f.write(content)
        print(f"Created template: {template_path}")

    print("\nDone! Wiki created.")
    print(f"Open in Obsidian: {wiki_dir}")


if __name__ == "__main__":
    main()
