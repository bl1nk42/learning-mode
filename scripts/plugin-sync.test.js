/**
 * Plugin config sync test
 * Verifies all platform configs are generated from plugin-source.json
 * and stay in sync.
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
const SYNC_SCRIPT = path.join(ROOT, "scripts", "sync-plugin-configs.js");
const source = JSON.parse(fs.readFileSync(SOURCE_PATH, "utf-8"));

console.log("\n=== Plugin Config Sync ===\n");

// --- A. plugin-source.json structure ---
assert(source.name === "learning-mode", "source.name is 'learning-mode'");
assert(typeof source.version === "string", "source has version");
assert(typeof source.description === "string", "source has description");
assert(source.hooks && typeof source.hooks === "object", "source has hooks object");
assert(Object.keys(source.hooks).length >= 4, "source has at least 4 hook events");

// --- B. Required hooks present ---
const requiredHooks = ["SessionStart", "UserPromptSubmit", "SubagentStart", "Stop"];
for (const hook of requiredHooks) {
	assert(source.hooks[hook] !== undefined, `source has ${hook} hook`);
}
assert(source.hooks.Stop.length >= 2, "Stop hook has at least 2 entries (record-insights + auto-collect)");

// --- C. Sync script exists and runs ---
assert(fs.existsSync(SYNC_SCRIPT), "sync-plugin-configs.js exists");

// --- D. Run sync and check no drift ---
const output = execSync(`node "${SYNC_SCRIPT}"`, { encoding: "utf8", cwd: ROOT });
assert(output.includes("All configs in sync"), "sync script reports all configs in sync");

// --- E. All platform plugin.json files have correct version ---
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
		assert(config.version === source.version, `${p} version matches source (${config.version})`);
		assert(config.name === source.name, `${p} name matches source`);
	} else {
		failed++;
		console.log(`  ❌ FAIL: ${p} does not exist`);
	}
}

// --- F2. All marketplace.json files have correct name and description ---
const marketplaces = [
	".claude-plugin/marketplace.json",
	".github/plugin/marketplace.json",
	".grok-plugin/marketplace.json",
];
for (const m of marketplaces) {
	const fullPath = path.join(ROOT, m);
	if (fs.existsSync(fullPath)) {
		const config = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
		assert(config.name === source.name, `${m} name matches source`);
		assert(config.description === source.marketplaceDescription, `${m} description matches marketplaceDescription`);
		assert(Array.isArray(config.plugins) && config.plugins.length === 1, `${m} has 1 plugin entry`);
		assert(config.plugins[0].name === source.name, `${m} plugin[0].name matches source`);
	} else {
		failed++;
		console.log(`  ❌ FAIL: ${m} does not exist`);
	}
}

// --- F. claude-hooks.json has all Stop hooks ---
const claudeHooks = JSON.parse(fs.readFileSync(path.join(ROOT, "hooks/claude-hooks.json"), "utf-8"));
const stopHooks = claudeHooks.hooks.Stop || [];
const stopScripts = stopHooks.flatMap((h) => h.hooks.map((hh) => hh.command));
assert(stopScripts.some((c) => c.includes("record-insights.js")), "claude-hooks Stop has record-insights.js");
assert(stopScripts.some((c) => c.includes("auto-collect-learning-map.js")), "claude-hooks Stop has auto-collect-learning-map.js");

// --- G. hooks.json matches claude-hooks.json structure ---
const hooksJson = JSON.parse(fs.readFileSync(path.join(ROOT, "hooks/hooks.json"), "utf-8"));
const hookEvents = Object.keys(source.hooks);
for (const event of hookEvents) {
	assert(hooksJson.hooks[event] !== undefined, `hooks.json has ${event}`);
	assert(claudeHooks.hooks[event] !== undefined, `claude-hooks.json has ${event}`);
	// Both should have same number of entries
	const genericCount = hooksJson.hooks[event].length;
	const claudeCount = claudeHooks.hooks[event].length;
	assert(genericCount === claudeCount, `${event}: hooks.json and claude-hooks.json have same entry count`);
}

// --- H. Root plugin.json ---
const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, "plugin.json"), "utf-8"));
assert(rootPkg.version === source.version, "root plugin.json version matches");

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
