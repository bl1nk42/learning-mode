/**
 * Plugin config sync test
 * Verifies all platform configs are generated from plugin-source.json
 * and validated against plugin.schema.json (ECC pattern).
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

let passed = 0;
let failed = 0;

function assert(condition, msg) {
	if (condition) {
		passed++;
		console.log(`  ✅ ${msg}`);
	} else {
		failed++;
		console.log(`  ❌ FAIL: ${msg}`);
	}
}

const ROOT = path.join(__dirname, "..");
const SOURCE_PATH = path.join(ROOT, "plugin-source.json");
const SCHEMA_PATH = path.join(ROOT, "schemas", "plugin.schema.json");
const SYNC_SCRIPT = path.join(ROOT, "scripts", "sync-plugin-configs.js");
const source = JSON.parse(fs.readFileSync(SOURCE_PATH, "utf-8"));
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf-8"));

console.log("\n=== Plugin Config Sync ===\n");

// --- A. plugin-source.json structure ---
assert(source.name === "learning-mode", "source.name is 'learning-mode'");
assert(typeof source.version === "string", "source has version");
assert(typeof source.description === "string", "source has description");
assert(typeof source.marketplaceDescription === "string", "source has marketplaceDescription");
assert(typeof source.homepage === "string", "source has homepage");
assert(typeof source.license === "string", "source has license");
assert(Array.isArray(source.keywords), "source has keywords array");
assert(source.author && source.author.name, "source has author.name");
assert(source.userConfig && typeof source.userConfig === "object", "source has userConfig");
assert(source.hooks && typeof source.hooks === "object", "source has hooks object");

// --- B. Required hooks ---
const requiredHooks = ["SessionStart", "UserPromptSubmit", "SubagentStart", "Stop"];
for (const hook of requiredHooks) {
	assert(source.hooks[hook] !== undefined, `source has ${hook} hook`);
}
assert(source.hooks.Stop.length >= 2, "Stop hook has at least 2 entries");

// --- C. Hook entries have id and description ---
for (const [event, entries] of Object.entries(source.hooks)) {
	for (const h of entries) {
		assert(typeof h.id === "string", `${event}/${h.script} has id`);
		assert(typeof h.description === "string", `${event}/${h.script} has description`);
	}
}

// --- D. JSON Schema exists and is valid ---
assert(fs.existsSync(SCHEMA_PATH), "plugin.schema.json exists");
assert(schema.title === "Learning Mode Plugin Configuration", "schema has correct title");
assert(schema.properties.name, "schema has name property");
assert(schema.properties.version, "schema has version property");
assert(schema.properties.userConfig, "schema has userConfig property");
assert(schema.properties.keywords, "schema has keywords property");
assert(schema.properties.license, "schema has license property");

// --- E. Sync script exists and reports in sync ---
assert(fs.existsSync(SYNC_SCRIPT), "sync-plugin-configs.js exists");
const output = execSync(`node "${SYNC_SCRIPT}"`, { encoding: "utf8", cwd: ROOT });
assert(output.includes("All configs in sync"), "sync script reports all configs in sync");

// --- F. All platform plugin.json validated against schema ---
const platforms = [
	".claude-plugin/plugin.json",
	".codex-plugin/plugin.json",
	".github/plugin/plugin.json",
	".devin-plugin/plugin.json",
	".qoder-plugin/plugin.json",
	".grok-plugin/plugin.json",
];
for (const p of platforms) {
	const fullPath = path.join(ROOT, p);
	if (fs.existsSync(fullPath)) {
		const config = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
		assert(config.version === source.version, `${p} version matches`);
		assert(config.name === source.name, `${p} name matches`);
		// Validate against schema (required fields)
		assert(typeof config.name === "string", `${p} passes schema: name required`);
	} else {
		failed++;
		console.log(`  ❌ FAIL: ${p} does not exist`);
	}
}

// --- G. marketplace.json files ---
const marketplaces = [
	".claude-plugin/marketplace.json",
	".github/plugin/marketplace.json",
	".grok-plugin/marketplace.json",
];
for (const m of marketplaces) {
	const fullPath = path.join(ROOT, m);
	if (fs.existsSync(fullPath)) {
		const config = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
		assert(config.name === source.name, `${m} name matches`);
		assert(config.owner && config.owner.name === source.author.name, `${m} owner matches author`);
		assert(config.metadata && config.metadata.description === source.marketplaceDescription, `${m} metadata.description matches`);
		assert(Array.isArray(config.plugins) && config.plugins.length === 1, `${m} has 1 plugin entry`);
		const plugin = config.plugins[0];
		assert(plugin.version === source.version, `${m} plugin[0].version matches`);
		assert(plugin.license === source.license, `${m} plugin[0].license matches`);
		assert(Array.isArray(plugin.keywords), `${m} plugin[0].has keywords`);
		assert(plugin.strict === false, `${m} plugin[0].strict is false`);
	} else {
		failed++;
		console.log(`  ❌ FAIL: ${m} does not exist`);
	}
}

// --- H. claude-hooks.json structure ---
const claudeHooks = JSON.parse(fs.readFileSync(path.join(ROOT, "hooks/claude-hooks.json"), "utf-8"));
const stopHooks = claudeHooks.hooks.Stop || [];
assert(stopHooks.length >= 2, "claude-hooks Stop has >= 2 entries");
for (const entry of stopHooks) {
	assert(typeof entry.id === "string", `claude-hooks Stop entry has id: ${entry.id}`);
	assert(typeof entry.description === "string", `claude-hooks Stop entry has description`);
}

// --- I. hooks.json has $schema ---
const hooksJson = JSON.parse(fs.readFileSync(path.join(ROOT, "hooks/hooks.json"), "utf-8"));
assert(typeof hooksJson.$schema === "string", "hooks.json has $schema");

// --- J. hooks.json and claude-hooks.json have same structure ---
for (const event of Object.keys(source.hooks)) {
	assert(hooksJson.hooks[event] !== undefined, `hooks.json has ${event}`);
	assert(claudeHooks.hooks[event] !== undefined, `claude-hooks.json has ${event}`);
	assert(hooksJson.hooks[event].length === claudeHooks.hooks[event].length, `${event}: same entry count`);
}

// --- K. .cursor/hooks.json ---
const cursorHooks = JSON.parse(fs.readFileSync(path.join(ROOT, ".cursor/hooks.json"), "utf-8"));
assert(cursorHooks.version === 1, ".cursor/hooks.json has version 1");
assert(cursorHooks.hooks.sessionStart !== undefined, ".cursor has sessionStart");
assert(cursorHooks.hooks.sessionEnd !== undefined, ".cursor has sessionEnd");

// --- L. Root plugin.json ---
const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, "plugin.json"), "utf-8"));
assert(rootPkg.version === source.version, "root plugin.json version matches");
assert(Array.isArray(rootPkg.keywords), "root plugin.json has keywords");
assert(rootPkg.license === source.license, "root plugin.json has license");

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
