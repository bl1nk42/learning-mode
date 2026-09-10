#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const Ajv2020 = require("ajv/dist/2020");

const schemaPath = path.join(__dirname, "..", "schemas", "learning-plan-canvas.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const phaseChain = schema["x-learning-mode-phase-chain"];
const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addKeyword({ keyword: "x-learning-mode-phase-chain", schemaType: "object", validate: () => true });
const validate = ajv.compile(schema);

/** Validate a canvas against schema and, optionally, the declared phase chain. */
function validateCanvas(canvas, checkPhaseChain = true) {
  if (!validate(canvas)) return { ok: false, errors: validate.errors };
  if (!checkPhaseChain) return { ok: true };
  const nodeIds = new Set(canvas.nodes.map((node) => node.id));
  const missingNodes = phaseChain.nodes.filter((id) => !nodeIds.has(id));
  const missingEdges = phaseChain.edges.filter((link) => {
    const [fromNode, toNode] = link.split("->");
    return !canvas.edges.some((edge) => edge.fromNode === fromNode && edge.toNode === toNode);
  });
  if (missingNodes.length || missingEdges.length) {
    return { ok: false, errors: [{ keyword: "x-learning-mode-phase-chain", params: { missingNodes, missingEdges }, message: "canvas does not satisfy phase chain" }] };
  }
  return { ok: true };
}

if (require.main === module) {
  const [canvasPath] = process.argv.slice(2);
  if (!canvasPath) process.exit(2);
  try {
    const result = validateCanvas(JSON.parse(fs.readFileSync(canvasPath, "utf8")));
    if (result.ok) process.stdout.write(JSON.stringify(result) + "\n");
    else {
      process.stderr.write(JSON.stringify({ code: "INVALID_CANVAS_SCHEMA", severity: "error", subject: "canvas", evidence: { errors: result.errors }, supportedFixes: [{ action: "regenerate_canvas", command: "node scripts/generate-learning-plan-canvas.js <wikiDir> --index <insight-index.jsonl>" }] }) + "\n");
      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  }
}

module.exports = { validateCanvas };
