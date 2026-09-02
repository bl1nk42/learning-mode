#!/usr/bin/env node
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const required = ["README.md", "evidence.md", "beats.md", "sources.md"];
const schemaVersion = "1.0.0";

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

function buildCanvas(wikiDir) {
  for (const name of required) {
    if (!fs.existsSync(path.join(wikiDir, name))) throw new Error("Missing " + name);
  }
  const title = titleFor(wikiDir);
  const evidenceCount = (fs.readFileSync(path.join(wikiDir, "evidence.md"), "utf8").match(/\b[a-f0-9]{16}\b/g) || []).length;
  const fileColumns = evidenceCount > 4 ? 2 : 1;
  const files = required.map((file, index) => ({
    id: file.replace(".md", ""), type: "file", file,
    x: (index % fileColumns) * 380, y: 140 + Math.floor(index / fileColumns) * 200, width: 360, height: 160,
  }));
  const phaseX = fileColumns * 380 + 80;
  const phases = [["observed", "Observed"], ["practice", "Practice"], ["demonstrated", "Demonstrated"], ["transfer", "Transfer"]]
    .map(([id, text], index) => ({ id, type: "text", text, x: phaseX, y: 140 + index * 150, width: 220, height: 90 }));
  return {
    meta: { title, locale: "en", repository: { url: "", revision: "unknown" }, schemaVersion },
    nodes: [{ id: "topic", type: "text", text: "# " + title, x: 0, y: 0, width: phaseX + 220, height: 80 }, ...files, ...phases],
    edges: [
      { id: "evidence-observed", fromNode: "evidence", toNode: "observed" },
      { id: "observed-practice", fromNode: "observed", toNode: "practice" },
      { id: "practice-demonstrated", fromNode: "practice", toNode: "demonstrated" },
      { id: "demonstrated-transfer", fromNode: "demonstrated", toNode: "transfer" },
    ],
  };
}

function validateCanvas(canvas) {
  if (!canvas.meta || !Array.isArray(canvas.nodes) || !Array.isArray(canvas.edges)) throw new Error("Canvas does not match schema");
  const ids = new Set(canvas.nodes.map((node) => node.id));
  if (ids.size !== canvas.nodes.length || canvas.nodes.some((node) => !node.id || !Number.isFinite(node.x) || !Number.isFinite(node.y) || !Number.isFinite(node.width) || !Number.isFinite(node.height))) throw new Error("Canvas has invalid nodes");
  if (canvas.edges.some((edge) => !edge.id || !ids.has(edge.fromNode) || !ids.has(edge.toNode))) throw new Error("Canvas has invalid edges");
}

function writeAtomically(target, content) {
  const temp = target + "." + process.pid + "." + Date.now() + ".tmp";
  fs.writeFileSync(temp, content);
  fs.renameSync(temp, target);
}

function writeCanvas(wikiDir) {
  const canvas = buildCanvas(wikiDir);
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
  const [wikiDir] = process.argv.slice(2);
  if (!wikiDir) process.exit(2);
  try { writeCanvas(wikiDir); } catch (error) { process.stderr.write(error.message + "\n"); process.exit(1); }
}

module.exports = { buildCanvas, validateCanvas, writeCanvas };
