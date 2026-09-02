#!/usr/bin/env node
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { validateCanvas: validateAgainstSchema } = require("./validate-learning-plan-canvas");

const required = ["README.md", "evidence.md", "beats.md", "sources.md"];
const schemaVersion = "1.0.0";
const phaseChain = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "schemas", "learning-plan-canvas.schema.json"), "utf8")
)["x-learning-mode-phase-chain"];

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function titleFor(wikiDir) {
  const readme = fs.readFileSync(path.join(wikiDir, "README.md"), "utf8");
  return readme.match(/^#\s+(.+)$/m)?.[1].trim() || path.basename(wikiDir);
}

function sourceBundle(wikiDir) {
  return required.map((name) => name + "\0" + fs.readFileSync(path.join(wikiDir, name), "utf8")).join("\0");
}

function evidenceRefs(wikiDir, indexFile) {
  if (!indexFile) throw new Error("Missing --index <insight-index.jsonl> required for evidence revision pinning");
  const entries = fs.readFileSync(indexFile, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const ids = [...new Set((fs.readFileSync(path.join(wikiDir, "evidence.md"), "utf8").match(/\b[a-f0-9]{16}\b/g) || []))];
  return ids.flatMap((id) => {
    const entry = byId.get(id);
    const references = entry?.references;
    if (!Array.isArray(references) || !references.length) throw new Error("Evidence " + id + " has no indexed source reference");
    if (!entry.source?.project) throw new Error("Evidence " + id + " has no indexed source project");
    const project = entry.source.project;
    const revision = execFileSync("git", ["-C", project, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    return references.map((reference) => ({ id, path: reference.file, line: reference.line, revision }));
  });
}

function buildCanvas(wikiDir, indexFile) {
  for (const name of required) {
    if (!fs.existsSync(path.join(wikiDir, name))) throw new Error("Missing " + name);
  }
  const title = titleFor(wikiDir);
  const pinnedEvidence = evidenceRefs(wikiDir, indexFile);
  const evidenceCount = (fs.readFileSync(path.join(wikiDir, "evidence.md"), "utf8").match(/\b[a-f0-9]{16}\b/g) || []).length;
  const fileColumns = evidenceCount > 4 ? 2 : 1;
  const files = required.map((file, index) => ({
    id: file.replace(".md", ""), type: "file", file,
    ...(file === "evidence.md" ? { evidenceRefs: pinnedEvidence } : {}),
    x: (index % fileColumns) * 380, y: 140 + Math.floor(index / fileColumns) * 200, width: 360, height: 160,
  }));
  const phaseX = fileColumns * 380 + 80;
  const phases = phaseChain.nodes.map((id, index) => ({
    id, type: "text", text: id.charAt(0).toUpperCase() + id.slice(1),
    x: phaseX, y: 140 + index * 150, width: 220, height: 90,
  }));
  const phaseEdges = phaseChain.edges.map((link) => {
    const [fromNode, toNode] = link.split("->");
    return { id: fromNode + "-" + toNode, fromNode, toNode };
  });
  return {
    meta: { title, locale: "en", repository: { url: "", revision: "unknown" }, schemaVersion },
    nodes: [{ id: "topic", type: "text", text: "# " + title, x: 0, y: 0, width: phaseX + 220, height: 80 }, ...files, ...phases],
    edges: [
      { id: "evidence-" + phaseChain.nodes[0], fromNode: "evidence", toNode: phaseChain.nodes[0] },
      ...phaseEdges,
    ],
  };
}

function validateCanvas(canvas) {
  const schemaResult = validateAgainstSchema(canvas);
  if (!schemaResult.ok) throw new Error("Canvas does not match schema: " + JSON.stringify(schemaResult.errors));
  const ids = new Set(canvas.nodes.map((node) => node.id));
  if (ids.size !== canvas.nodes.length || canvas.nodes.some((node) => !node.id || !Number.isFinite(node.x) || !Number.isFinite(node.y) || !Number.isFinite(node.width) || !Number.isFinite(node.height))) throw new Error("Canvas has invalid nodes");
  if (canvas.edges.some((edge) => !edge.id || !ids.has(edge.fromNode) || !ids.has(edge.toNode))) throw new Error("Canvas has invalid edges");
}

function writeAtomically(target, content) {
  const temp = target + "." + process.pid + "." + Date.now() + ".tmp";
  fs.writeFileSync(temp, content);
  fs.renameSync(temp, target);
}

function writeCanvas(wikiDir, indexFile) {
  const canvas = buildCanvas(wikiDir, indexFile);
  validateCanvas(canvas);
  const canvasText = JSON.stringify(canvas, null, 2) + "\n";
  writeAtomically(path.join(wikiDir, "learning-plan.canvas"), canvasText);
  const receipt = {
    canvasPath: "learning-plan.canvas",
    sourceBundleSha256: sha256(sourceBundle(wikiDir)),
    canvasSha256: sha256(canvasText),
    generatedAt: new Date().toISOString(),
    schemaVersion,
  };
  writeAtomically(path.join(wikiDir, "learning-plan.receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
  return receipt;
}

if (require.main === module) {
  const [wikiDir, flag, indexFile] = process.argv.slice(2);
  if (!wikiDir || flag !== "--index" || !indexFile) process.exit(2);
  try { writeCanvas(wikiDir, indexFile); } catch (error) { process.stderr.write(error.message + "\n"); process.exit(1); }
}

module.exports = { buildCanvas, validateCanvas, writeCanvas };
