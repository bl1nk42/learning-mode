/**
 * Plugin config sync test
 * Verifies plugin.json, marketplace.json, and hooks.json are in sync
 * across all platforms from plugin-source.json.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

let P = 0, F = 0;
function ok(c, m) { c ? P++ : F++; console.log(`  ${c ? "✅" : "❌"} ${m}`); }

const R = path.join(__dirname, "..");
const S = JSON.parse(fs.readFileSync(path.join(R, "plugin-source.json"), "utf-8"));
const j = (p) => JSON.parse(fs.readFileSync(path.join(R, p), "utf-8"));

console.log("\n=== Plugin Config Sync ===\n");

// A. source structure
ok(S.name === "learning-mode", "source.name");
ok(typeof S.version === "string", "source.version");
ok(typeof S.description === "string", "source.description");
ok(typeof S.marketplaceDescription === "string", "source.marketplaceDescription");
ok(typeof S.license === "string", "source.license");
ok(Array.isArray(S.keywords), "source.keywords");
ok(S.author?.name, "source.author.name");
ok(S.userConfig, "source.userConfig");
ok(S.hooks, "source.hooks");

// B. hooks have id + description
for (const [ev, entries] of Object.entries(S.hooks)) {
	for (const h of entries) {
		ok(typeof h.id === "string", `${ev}/${h.script} has id`);
		ok(typeof h.description === "string", `${ev}/${h.script} has description`);
	}
}

// C. sync script in sync
const out = execSync(`node "${path.join(R, "scripts", "sync-plugin-configs.js")}"`, { encoding: "utf8", cwd: R });
ok(out.includes("All in sync"), "sync script reports in sync");

// D. all plugin.json match version/name
for (const p of [
	"plugin.json",
	".claude-plugin/plugin.json",
	".codex-plugin/plugin.json",
	".github/plugin/plugin.json",
	".devin-plugin/plugin.json",
	".grok-plugin/plugin.json",
	".qoder-plugin/plugin.json",
]) {
	const c = j(p);
	ok(c.version === S.version, `${p} version`);
	ok(c.name === S.name, `${p} name`);
}

// E. marketplace.json
for (const m of [".claude-plugin/marketplace.json", ".github/plugin/marketplace.json", ".grok-plugin/marketplace.json"]) {
	const c = j(m);
	ok(c.name === S.name, `${m} name`);
	ok(c.owner?.name === S.author.name, `${m} owner`);
ok(c.plugins?.[0]?.version === S.version, `${m} plugin version`);
	ok(c.plugins?.[0]?.license === S.license, `${m} plugin license`);
	ok(c.plugins?.[0]?.strict === false, `${m} strict=false`);
}

// F. hooks.json (no nested "hooks" key — flat structure like ECC)
const hj = j("hooks/hooks.json");
ok(typeof hj.$schema === "string", "hooks.json has $schema");
const ch = j("hooks/claude-hooks.json");
for (const ev of Object.keys(S.hooks)) {
	ok(hj[ev]?.length === S.hooks[ev].length, `${ev}: hooks.json count`);
	ok(ch.hooks[ev]?.length === S.hooks[ev].length, `${ev}: claude-hooks.json count`);
}
ok(ch.hooks.Stop?.some((e) => e.id === "stop:auto-collect-map"), "claude-hooks has auto-collect");

// G. .cursor/hooks.json
const cursor = j(".cursor/hooks.json");
ok(cursor.version === 1, ".cursor version 1");
ok(cursor.hooks.sessionStart, ".cursor has sessionStart");
ok(cursor.hooks.sessionEnd, ".cursor has sessionEnd");

console.log(`\n=== Results: ${P} passed, ${F} failed ===\n`);
process.exit(F > 0 ? 1 : 0);
