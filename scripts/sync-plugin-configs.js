#!/usr/bin/env node

/**
 * sync-plugin-configs.js
 *
 * Syncs shared metadata (name, version, description, hooks, author, keywords, license)
 * across all plugin.json and marketplace.json files from plugin-source.json.
 *
 * Native platform configs (.vscode/settings.json, .gemini/GEMINI.md, etc.)
 * are NOT generated here — they are static files maintained separately.
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

// --- Helpers ---
function json(obj) { return JSON.stringify(obj, null, 2) + "\n"; }

function pluginJson(overrides = {}) {
	return json({ name: S.name, version: S.version, description: S.description, ...overrides });
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

function hooks(envVar) {
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

// --- Targets: only plugin.json, marketplace.json, hooks.json ---
const targets = [
	// plugin.json (shared format: Claude, Codex, GitHub, Devin, Grok, Qoder)
	["plugin.json",                 () => pluginJson({ contextFileName: "AGENTS.md", keywords: S.keywords, license: S.license })],
	[".claude-plugin/plugin.json",  () => pluginJson({ author: S.author, homepage: S.homepage, repository: S.repository, license: S.license, keywords: S.keywords, hooks: "./hooks/claude-hooks.json", userConfig: S.userConfig })],
	[".codex-plugin/plugin.json",   () => pluginJson({ keywords: S.keywords, author: S.author, homepage: S.homepage, repository: S.repository, license: S.license, skills: "./skills/", hooks: "./hooks/codex-hooks.json", interface: { displayName: "Learning Mode", shortDescription: "Learn from decisions as you build.", longDescription: S.description, developerName: S.author.name, category: "Productivity", capabilities: ["Instructions", "Lifecycle hooks"], websiteURL: S.homepage, privacyPolicyURL: `${S.homepage}/blob/main/PRIVACY.md`, termsOfServiceURL: `${S.homepage}/blob/main/TERMS.md`, defaultPrompt: ["Help me learn while we build this."] } })],
	[".github/plugin/plugin.json",  () => pluginJson({ skills: "skills/" })],
	[".devin-plugin/plugin.json",   () => pluginJson({ skills: "./skills/" })],
	[".grok-plugin/plugin.json",    () => pluginJson({ skills: "./skills/" })],
	[".qoder-plugin/plugin.json",   () => pluginJson({ skills: "./skills/", rules: "./.qoder/rules/" })],

	// marketplace.json
	[".claude-plugin/marketplace.json", () => marketplace()],
	[".github/plugin/marketplace.json", () => marketplace({ skills: "skills/" })],
	[".grok-plugin/marketplace.json",   () => marketplace()],

	// hooks.json
	["hooks/claude-hooks.json", () => hooks("CLAUDE_PLUGIN_ROOT")],
	["hooks/hooks.json",        () => json({ $schema: "https://json.schemastore.org/claude-code-settings.json", ...JSON.parse(hooks("PLUGIN_ROOT")).hooks })],
	[".cursor/hooks.json",      () => cursorHooks()],
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
