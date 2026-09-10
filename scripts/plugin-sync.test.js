const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

let P = 0, F = 0;
function ok(c, m) { c ? P++ : F++; console.log(`  ${c ? "✅" : "❌"} ${m}`); }

const R = path.join(__dirname, "..");
const S = JSON.parse(fs.readFileSync(path.join(R, "plugin-source.json"), "utf-8"));
const j = (p) => JSON.parse(fs.readFileSync(path.join(R, p), "utf-8"));

console.log("\n=== Plugin Config Sync ===\n");

// A. source
ok(S.name === "learning-mode", "source.name");
ok(S.version, "source.version");
ok(S.description, "source.description");
ok(S.marketplaceDescription, "source.marketplaceDescription");
ok(S.license, "source.license");
ok(Array.isArray(S.keywords), "source.keywords");
ok(S.author?.name, "source.author.name");
ok(S.hooks, "source.hooks");
ok(S.contextFileName, "source.contextFileName");

// B. hooks have id + description
for (const [ev, entries] of Object.entries(S.hooks)) {
  for (const h of entries) {
    ok(typeof h.id === "string", `${ev}/${h.script} has id`);
    ok(typeof h.description === "string", `${ev}/${h.script} has description`);
  }
}

// C. sync script
const out = execSync(`node "${path.join(R, "scripts", "sync-plugin-configs.js")}"`, { encoding: "utf8", cwd: R });
ok(out.includes("All in sync"), "sync in sync");

// D. plugin.json (schema fields only)
const SCHEMA_KEYS = ["name","version","description","author","homepage","repository","license","keywords","skills","commands"];
for (const p of ["plugin.json",".claude-plugin/plugin.json",".codex-plugin/plugin.json",".github/plugin/plugin.json",".devin-plugin/plugin.json",".grok-plugin/plugin.json",".qoder-plugin/plugin.json"]) {
  const c = j(p);
  ok(c.version === S.version, `${p} version`);
  ok(c.name === S.name, `${p} name`);
  const keys = Object.keys(c);
  const extra = keys.filter(k => !SCHEMA_KEYS.includes(k) && k !== "userConfig");
  ok(extra.length === 0, `${p} no extra fields (got: ${extra.join(", ") || "none"})`);
}

// E. marketplace
for (const m of [".claude-plugin/marketplace.json",".github/plugin/marketplace.json",".grok-plugin/marketplace.json"]) {
  const c = j(m);
  ok(c.name === S.name, `${m} name`);
  ok(c.owner?.name === S.author.name, `${m} owner`);
  ok(c.plugins?.[0]?.version === S.version, `${m} version`);
  ok(c.plugins?.[0]?.strict === false, `${m} strict=false`);
}

// F. hooks
const hj = j("hooks/hooks.json");
ok(hj.$schema, "hooks.json has $schema");
const ch = j("hooks/claude-hooks.json");
for (const ev of Object.keys(S.hooks)) {
  ok(hj[ev]?.length === S.hooks[ev].length, `${ev}: hooks.json`);
  ok(ch.hooks[ev]?.length === S.hooks[ev].length, `${ev}: claude-hooks.json`);
}
ok(ch.hooks.Stop?.some(e => e.id === "stop:auto-collect-map"), "auto-collect in claude-hooks");

// G. cursor
const cursor = j(".cursor/hooks.json");
ok(cursor.version === 1, ".cursor version");
ok(cursor.hooks.sessionStart, ".cursor sessionStart");
ok(cursor.hooks.sessionEnd, ".cursor sessionEnd");

// H. Root manifests
const yaml = fs.readFileSync(path.join(R, "plugin.yaml"), "utf-8");
ok(yaml.includes("name: " + S.name), "plugin.yaml name");
ok(yaml.includes("version: " + S.version), "plugin.yaml version");
ok(yaml.includes("provides_hooks:"), "plugin.yaml provides_hooks");
ok(yaml.includes("provides_skills:"), "plugin.yaml provides_skills");

const oc = j("opencode.json");
ok(oc["$schema"] === "https://opencode.ai/config.json", "opencode.json $schema");
ok(Array.isArray(oc.plugin), "opencode.json plugin array");

const ge = j("gemini-extension.json");
ok(ge.name === S.name, "gemini-extension.json name");
ok(ge.version === S.version, "gemini-extension.json version");
ok(ge.contextFileName === S.contextFileName, "gemini-extension.json contextFileName");

console.log(`\n=== Results: ${P} passed, ${F} failed ===\n`);
process.exit(F > 0 ? 1 : 0);
