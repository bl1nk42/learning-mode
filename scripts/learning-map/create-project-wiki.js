#!/usr/bin/env node

/**
 * create-project-wiki.js
 *
 * Creates wiki structure for a project based on templates/wiki template.
 * Uses Obsidian-compatible format with frontmatter.
 *
 * Usage: node create-project-wiki.js <project-root>
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { getVaultPath, getProjectDir } = require('./config');

// --- Helpers ---
function getProjectId(projectRoot) {
  return crypto.createHash('md5').update(projectRoot).digest('hex').slice(0, 8);
}

function getProjectName(projectRoot) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    return pkg.name || path.basename(projectRoot);
  } catch {
    return path.basename(projectRoot);
  }
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function createFrontmatter(title, type, tags = []) {
  const today = formatDate(new Date());
  return `---
title: "${title}"
type: "${type}"
status: "active"
created: "${today}"
updated: "${today}"
tags: [${tags.map(t => `"${t}"`).join(', ')}]
---`;
}

function createIndexPage(projectName) {
  return `${createFrontmatter('index', 'concept', ['vault', 'concept'])}
# Wiki Index: ${projectName}

This catalog is updated by completed knowledge operations.

## Sources

- No sources indexed yet.

## Concepts

- No concepts indexed yet.

## Entities

- No entities indexed yet.

## Learning Points

- No learning points recorded yet.
`;
}

function createOverviewPage(projectName) {
  return `${createFrontmatter('overview', 'concept', ['vault', 'concept'])}
# Overview: ${projectName}

This local-first vault compounds source-backed knowledge over time.

## Project Info

- **Name:** ${projectName}
- **Created:** ${formatDate(new Date())}

## What's Inside

- **Concepts** — Ideas and patterns you've learned
- **Entities** — Concrete things (files, functions, classes)
- **Learning Points** — Insights from working with AI
`;
}

function createHotPage(projectName) {
  return `${createFrontmatter('hot', 'concept', ['vault', 'concept'])}
# Recent Context

## Last Updated

Vault initialized. No knowledge operations have completed yet.

## Key Recent Facts

- No facts recorded.

## Recent Changes

- Created the vault foundation.

## Active Threads

- Add insights to start building knowledge.
`;
}

function createLogPage(projectName) {
  return `${createFrontmatter('log', 'concept', ['vault', 'concept'])}
# Wiki Log: ${projectName}

Newest completed operations appear first.
`;
}

function createConceptTemplate(conceptName) {
  return `${createFrontmatter(conceptName, 'concept', ['concept'])}
# ${conceptName}

## Definition

[Write definition here]

## Related Concepts

- [Concept 1](concepts/concept1.md)
- [Concept 2](concepts/concept2.md)

## Sources

- [Source 1](sources/source1.md)

## Learning Points

- No learning points yet.
`;
}

function createEntityTemplate(entityName) {
  return `${createFrontmatter(entityName, 'entity', ['entity'])}
# ${entityName}

## What Is It

[Write description here]

## Related Concepts

- [Concept 1](concepts/concept1.md)

## Sources

- [Source 1](sources/source1.md)

## Learning Points

- No learning points yet.
`;
}

function createSourceTemplate(sourceName) {
  return `${createFrontmatter(sourceName, 'source', ['source'])}
# ${sourceName}

## What Is It

[Write description here]

## Key Points

- Point 1
- Point 2

## Related Concepts

- [Concept 1](concepts/concept1.md)

## Related Entities

- [Entity 1](entities/entity1.md)
`;
}

// --- Main ---
function main() {
  const projectRoot = process.argv[2] || process.cwd();

  if (!fs.existsSync(projectRoot)) {
    console.error(`Project root does not exist: ${projectRoot}`);
    process.exit(1);
  }

  const vaultPath = getVaultPath();
  const projectId = getProjectId(projectRoot);
  const projectName = getProjectName(projectRoot);
  const projectDir = getProjectDir(projectRoot);
  const wikiDir = path.join(projectDir, 'wiki');

  console.log(`Vault: ${vaultPath}`);
  console.log(`Project: ${projectName} (${projectId})`);
  console.log(`Wiki: ${wikiDir}`);

  // Create wiki directory structure
  const dirs = [
    wikiDir,
    path.join(wikiDir, 'concepts'),
    path.join(wikiDir, 'entities'),
    path.join(wikiDir, 'meta'),
    path.join(wikiDir, 'meta', 'ledgers'),
    path.join(wikiDir, 'sources')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Create pages
  const pages = [
    { name: 'index.md', content: createIndexPage(projectName) },
    { name: 'overview.md', content: createOverviewPage(projectName) },
    { name: 'hot.md', content: createHotPage(projectName) },
    { name: 'log.md', content: createLogPage(projectName) }
  ];

  pages.forEach(page => {
    const pagePath = path.join(wikiDir, page.name);
    if (!fs.existsSync(pagePath)) {
      fs.writeFileSync(pagePath, page.content);
      console.log(`Created: ${pagePath}`);
    }
  });

  // Create template files in templates directory
  const templatesDir = path.join(wikiDir, '_templates');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  const templates = [
    { name: 'concept.md', content: createConceptTemplate('Concept Name') },
    { name: 'entity.md', content: createEntityTemplate('Entity Name') },
    { name: 'source.md', content: createSourceTemplate('Source Name') }
  ];

  templates.forEach(template => {
    const templatePath = path.join(templatesDir, template.name);
    fs.writeFileSync(templatePath, template.content);
    console.log(`Created template: ${templatePath}`);
  });

  console.log('\nDone! Wiki created.');
  console.log(`Open in Obsidian: ${wikiDir}`);
}

if (require.main === module) {
  main();
}

module.exports = { createIndexPage, createOverviewPage, createHotPage, createLogPage };
