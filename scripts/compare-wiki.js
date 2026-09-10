#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const idPattern = /\b[a-f0-9]{16}\b/g;

/** Read one wiki artifact as UTF-8 text. */
function read(directory, name) {
  return fs.readFileSync(path.join(directory, name), "utf8");
}

/** Group complete evidence entries by their stable insight ID. */
function evidenceById(markdown) {
  const result = new Map();
  const lines = markdown.split("\n");
  let currentId = null;
  for (const line of lines) {
    const id = line.match(idPattern)?.[0];
    if (id) {
      currentId = id;
      result.set(id, [line]);
    } else if (currentId && line.trim()) {
      result.get(currentId).push(line);
    }
  }
  return result;
}

/** Extract Markdown headings while ignoring fenced code blocks. */
function headings(markdown) {
  const result = [];
  let fenced = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*```/.test(line)) { fenced = !fenced; continue; }
    if (!fenced) {
      const match = line.match(/^#{1,6}\s+(.+?)\s*$/);
      if (match) result.push(match[1]);
    }
  }
  return result;
}

/** Compare evidence, beat ordering, and source coverage between wikis. */
function compare(beforeDir, afterDir) {
  const beforeEvidence = evidenceById(read(beforeDir, "evidence.md"));
  const afterEvidence = evidenceById(read(afterDir, "evidence.md"));
  const beforeIds = [...beforeEvidence.keys()];
  const afterIds = [...afterEvidence.keys()];
  const beforeSet = new Set(beforeIds);
  const afterSet = new Set(afterIds);
  const beforeSections = headings(read(beforeDir, "beats.md"));
  const afterSections = headings(read(afterDir, "beats.md"));
  const beforeSources = evidenceById(read(beforeDir, "sources.md"));
  const afterSources = evidenceById(read(afterDir, "sources.md"));
  return {
    addedEvidenceIds: afterIds.filter((id) => !beforeSet.has(id)),
    removedEvidenceIds: beforeIds.filter((id) => !afterSet.has(id)),
    changedEvidenceIds: beforeIds.filter((id) => afterSet.has(id) && beforeEvidence.get(id).join("\n") !== afterEvidence.get(id).join("\n")),
    movedBeatSections: (() => {
      const commonBefore = beforeSections.filter((section) => afterSections.includes(section));
      const commonAfter = afterSections.filter((section) => beforeSections.includes(section));
      return beforeSections.flatMap((section, before) => {
        const occurrence = beforeSections.slice(0, before).filter((candidate) => candidate === section).length;
        let seen = 0;
        const after = afterSections.findIndex((candidate) => candidate === section && seen++ === occurrence);
        const beforeRank = commonBefore.indexOf(section);
        const afterRank = commonAfter.indexOf(section);
        return after >= 0 && beforeRank !== afterRank ? [{ section, before, after }] : [];
      });
    })(),
    missingSources: {
      before: beforeIds.filter((id) => !beforeSources.has(id)),
      after: afterIds.filter((id) => !afterSources.has(id)),
    },
  };
}

if (require.main === module) {
  const [beforeDir, afterDir] = process.argv.slice(2);
  if (!beforeDir || !afterDir) process.exit(2);
  try { process.stdout.write(JSON.stringify(compare(beforeDir, afterDir)) + "\n"); }
  catch (error) { process.stderr.write(error.message + "\n"); process.exitCode = 1; }
}

module.exports = { compare };
