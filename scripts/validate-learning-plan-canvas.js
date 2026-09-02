#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const Ajv2020 = require("ajv/dist/2020");

const schemaPath = path.join(__dirname, "..", "schemas", "learning-plan-canvas.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addKeyword({ keyword: "x-learning-mode-phase-chain", schemaType: "object", validate: () => true });
const validate = ajv.compile(schema);

function validateCanvas(canvas) {
  if (validate(canvas)) return { ok: true };
  return { ok: false, errors: validate.errors };
}

if (require.main === module) {
  const [canvasPath] = process.argv.slice(2);
  if (!canvasPath) process.exit(2);
  try {
    const result = validateCanvas(JSON.parse(fs.readFileSync(canvasPath, "utf8")));
    if (result.ok) process.stdout.write(JSON.stringify(result) + "\n");
    else {
      process.stderr.write(JSON.stringify({ code: "INVALID_CANVAS_SCHEMA", severity: "error", subject: "canvas", evidence: { errors: result.errors }, supportedFixes: [{ action: "regenerate_canvas", command: "node scripts/generate-learning-plan-canvas.js <wikiDir>" }] }) + "\n");
      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  }
}

module.exports = { validateCanvas };
