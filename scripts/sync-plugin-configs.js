#!/usr/bin/env node

/**
 * sync-plugin-configs.js
 *
 * Syncs plugin.json, marketplace.json, hooks.json across all platforms
 * from plugin-source.json. Only includes fields defined in each
 * platform's schema — no extra fields.
 *
 * Usage:
 *   node scripts/sync-plugin-configs.js          # dry-run
 *   node scripts/sync-plugin-configs.js --apply   # write
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const S = JSON.parse(fs.readFileSync(path.join(ROOT, "plugin-source.json"), "utf-8"));
const APPLY = process.argv.includes("--apply");

function json(obj) { return JSON.stringify(obj, null, 2) + "\n"; }

// Fields from plugin.schema.json (additionalProperties: false)
// name, version, description, author, homepage, repository,
// license, keywords, skills, commands, mcpServers, features
function schemaFields() {
	return {
		name: S.name,
		version: S.version,
		description: S.description,
		author: S.author,
		homepage: S.homepage,
		repository: S.repository,
		license: S.license,
		keywords: S.keywords,
		skills: [S.skills],
		commands: [S.commands],
	};
}

function marketplace(extra = {}) {
	return json({
		name: S.name,
		owner: S.author,
		metadata: { description: S.marketplaceDescription },
		plugins: [{
			name: S.name,
			source: "./",
			description: S.marketplaceDescription,
			version: S.version,
			author: S.author,
			homepage: S.homepage,
			repository: S.repository,
			license: S.license,
			keywords: S.keywords,
			category: "productivity",
			tags: S.keywords,
			strict: false,
			...extra,
		}],
	});
}

function hooksFile(envVar) {
	const h = {};
	for (const [event, entries] of Object.entries(S.hooks)) {
		h[event] = entries.map((e) => ({
			...(e.id ? { id: e.id } : {}),
			...(e.description ? { description: e.description } : {}),
			hooks: [{
				type: "command",
				command: `node "\${${envVar}}/hooks/${e.script}"`,
				timeout: e.timeout || 5,
				...(e.statusMessage ? { statusMessage: e.statusMessage } : {}),
			}],
		}));
	}
	return json({ hooks: h });
}

function cursorHooks() {
	const map = { SessionStart: "sessionStart", Stop: "sessionEnd" };
	const h = {};
	for (const [event, entries] of Object.entries(S.hooks)) {
		const ce = map[event];
		if (!ce) continue;
		h[ce] = entries.map((e) => ({
			command: `node .cursor/hooks/${e.script}`,
			event: ce,
			...(e.description ? { description: e.description } : {}),
		}));
	}
	return json({ version: 1, hooks: h });
}

// --- Targets: only schema-defined fields, no extras ---
const targets = [
	// plugin.json — schema fields only
	["plugin.json",                 () => json(schemaFields())],

	// Claude — schema fields + userConfig (Claude-specific, not in schema)
	[".claude-plugin/plugin.json",  () => json({ ...schemaFields(), userConfig: S.userConfig })],

	// Codex — schema fields only
	[".codex-plugin/plugin.json",   () => json(schemaFields())],

	// GitHub — schema fields only
	[".github/plugin/plugin.json",  () => json(schemaFields())],

	// Devin — schema fields only
	[".devin-plugin/plugin.json",   () => json(schemaFields())],

	// Grok — schema fields only
	[".grok-plugin/plugin.json",    () => json(schemaFields())],

	// Qoder — schema fields only
	[".qoder-plugin/plugin.json",   () => json(schemaFields())],

	// Marketplace
	[".claude-plugin/marketplace.json", () => marketplace()],
	[".github/plugin/marketplace.json", () => marketplace({ skills: ["skills/"] })],
	[".grok-plugin/marketplace.json",   () => marketplace()],

	// Hooks
	["hooks/claude-hooks.json", () => hooksFile("CLAUDE_PLUGIN_ROOT")],
	["hooks/hooks.json",        () => json({ $schema: "https://json.schemastore.org/claude-code-settings.json", ...JSON.parse(hooksFile("PLUGIN_ROOT")).hooks })],
	[".cursor/hooks.json",      () => cursorHooks()],

	// Hermes manifest (YAML)
	["plugin.yaml", () =>
		`name: ${S.name}\nversion: ${S.version}\ndescription: ${S.description}\nprovides_hooks:\n  - pre_llm_call\nprovides_skills:\n  - ${S.name}\n`],

	// OpenCode manifest
	["opencode.json", () => json({
		"$schema": "https://opencode.ai/config.json",
		"plugin": [`.opencode/plugins/${S.name}.mjs`],
	})],

	// Gemini extension manifest
	["gemini-extension.json", () => json({
		name: S.name,
		version: S.version,
		description: S.description,
		contextFileName: S.contextFileName,
	})],
];

// --- Sync ---
let changed = 0;
for (const [relPath, gen] of targets) {
	const full = path.join(ROOT, relPath);
	const next = gen();
	const prev = fs.existsSync(full) ? fs.readFileSync(full, "utf-8") : "";
	if (next === prev) { console.log(`  ✅ ${relPath}`); continue; }
	changed++;
	if (APPLY) {
		fs.mkdirSync(path.dirname(full), { recursive: true });
		fs.writeFileSync(full, next);
		console.log(`  ✏️  ${relPath}`);
	} else {
		console.log(`  🔄 ${relPath} — needs update`);
	}
}
console.log(`\n${changed === 0 ? "✅ All in sync" : `🔄 ${changed} file(s) to update`}`);
if (!APPLY && changed > 0) console.log("Run with --apply to write");
