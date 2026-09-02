#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const idPattern = /\b[a-f0-9]{16}\b/g;

function read(directory, name) {
  return fs.readFileSync(path.join(directory, name), "utf8");
}

function evidenceById(markdown) {
  const result = new Map();
  for (const line of markdown.split("\n")) {
    for (const id of line.match(idPattern) || []) {
      result.set(id, (result.get(id) || []).concat(line));
    }
  }
  return result;
}

function headings(markdown) {
  return markdown.split("\n").flatMap((line) => {
    const match = line.match(/^#{1,6}\s+(.+?)\s*$/);
    return match ? [match[1]] : [];
  });
}

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
    movedBeatSections: beforeSections.flatMap((section, before) => {
      const occurrence = beforeSections
        .slice(0, before)
        .filter((candidate) => candidate === section)
        .length;
      const after = afterSections.findIndex(
        (candidate, index) =>
          candidate === section &&
          afterSections
            .slice(0, index)
            .filter((previous) => previous === section)
            .length === occurrence,
      );
      return after >= 0 && after !== before ? [{ section, before, after }] : [];
    }),
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
