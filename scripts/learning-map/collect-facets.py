#!/usr/bin/env python3

"""
collect-facets.py

Collects insights and creates learning map.
Output: Markdown for people + JSON for agents

Usage: python3 collect-facets.py <project-root>
"""

import hashlib
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Add current directory to path for config import
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

    pyproject_path = os.path.join(project_root, "pyproject.toml")
    if os.path.exists(pyproject_path):
        with open(pyproject_path, "r") as f:
            content = f.read()
            import re

            match = re.search(r'name = "([^"]+)"', content)
            if match:
                return match.group(1)

    return os.path.basename(project_root)


def read_insight_index(vault_path):
    index_path = os.path.join(vault_path, "insight-index.jsonl")
    if not os.path.exists(index_path):
        return []

    insights = []
    with open(index_path, "r") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    insights.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    return insights


def filter_insights_by_project(insights, project_root):
    return [i for i in insights if i.get("source", {}).get("project") == project_root]


def create_learning_map_markdown(insights, project_root, project_name):
    today = datetime.now().strftime("%Y-%m-%d")

    # Group insights by topic
    topics = {}
    for insight in insights:
        for text in insight.get("insights", []):
            words = " ".join(text.split()[:3])
            if words not in topics:
                topics[words] = []
            topics[words].append(
                {
                    "text": text,
                    "references": insight.get("references", []),
                    "timestamp": insight.get("recordedAt", ""),
                }
            )

    lines = []

    lines.append(f"# Learning Map: {project_name}")
    lines.append("")
    lines.append(f"**วันที่:** {today}")
    lines.append(f"**สรุป:** เรียนรู้ {len(insights)} insights จาก {len(topics)} topics")
    lines.append("")

    lines.append("## Topics")
    lines.append("")

    for i, (topic, items) in enumerate(topics.items(), 1):
        lines.append(f"### {i}. {topic}")
        lines.append("")

        for item in items:
            lines.append(f"- {item['text']}")
            if item["references"]:
                refs = ", ".join(
                    [f"`{r['file']}:{r['line']}`" for r in item["references"]]
                )
                lines.append(f"  - อ้างอิง: {refs}")

        lines.append("")

    lines.append("## Learning Path")
    lines.append("")
    lines.append("ลำดับการเรียนรู้:")
    lines.append("")

    for i, topic in enumerate(topics.keys(), 1):
        lines.append(f"{i}. **{topic}**")

    lines.append("")

    lines.append("## Summary")
    lines.append("")
    lines.append("Session นี้เรียนรู้:")
    lines.append(f"- {len(insights)} insights")
    lines.append(f"- {len(topics)} topics")
    lines.append("")

    return "\n".join(lines)


def create_learning_map_json(insights, project_root, project_name):
    project_id = get_project_id(project_root)
    today = datetime.now().strftime("%Y-%m-%d")

    return {
        "project": {"id": project_id, "name": project_name, "root": project_root},
        "session": {"date": today, "insight_count": len(insights)},
        "insights": insights,
    }


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

    print(f"Vault: {vault_path}")
    print(f"Project: {project_name} ({project_id})")

    # Read insights
    all_insights = read_insight_index(vault_path)
    project_insights = filter_insights_by_project(all_insights, project_root)

    if not project_insights:
        print(f"No insights found for project: {project_name}")
        sys.exit(0)

    print(f"Found {len(project_insights)} insights")

    # Create project directory
    os.makedirs(project_dir, exist_ok=True)

    # Create Markdown (for people)
    markdown = create_learning_map_markdown(
        project_insights, project_root, project_name
    )
    md_path = os.path.join(project_dir, "learning-map.md")
    with open(md_path, "w") as f:
        f.write(markdown)
    print(f"Created: {md_path}")

    # Create JSON (for agents)
    json_data = create_learning_map_json(project_insights, project_root, project_name)
    json_path = os.path.join(project_dir, "learning-map.json")
    with open(json_path, "w") as f:
        json.dump(json_data, f, indent=2)
    print(f"Created: {json_path}")

    print("\nDone!")


if __name__ == "__main__":
    main()
