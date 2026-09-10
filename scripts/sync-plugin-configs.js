#!/usr/bin/env node

/**
 * sync-plugin-configs.js
 *
 * Single source of truth: plugin-source.json
 * Generates all platform plugin configs from one place.
 *
 * Usage:
 *   node scripts/sync-plugin-configs.js          # dry-run (show diff)
 *   node scripts/sync-plugin-configs.js --apply   # write files
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SOURCE = JSON.parse(fs.readFileSync(path.join(ROOT, "plugin-source.json"), "utf-8"));

const APPLY = process.argv.includes("--apply");

// --- Platform configs ---
function makePluginJson(overrides = {}) {
	return {
		name: SOURCE.name,
		version: SOURCE.version,
		description: SOURCE.description,
		...overrides,
	};
}

function makeClaudeHooks() {
	const hooks = {};
	for (const [event, entries] of Object.entries(SOURCE.hooks)) {
		hooks[event] = entries.map((h) => ({
			...(h.id ? { id: h.id } : {}),
			...(h.description ? { description: h.description } : {}),
			hooks: [
				{
					type: "command",
					command: `node "\${CLAUDE_PLUGIN_ROOT}/hooks/${h.script}"`,
					timeout: h.timeout || 5,
					...(h.statusMessage ? { statusMessage: h.statusMessage } : {}),
				},
			],
		}));
	}
	return { hooks };
}

function makeGenericHooks() {
	const hooks = {};
	for (const [event, entries] of Object.entries(SOURCE.hooks)) {
		hooks[event] = entries.map((h) => ({
			...(h.id ? { id: h.id } : {}),
			...(h.description ? { description: h.description } : {}),
			hooks: [
				{
					type: "command",
					command: `node "\${PLUGIN_ROOT}/hooks/${h.script}"`,
					timeout: h.timeout || 5,
					...(h.statusMessage ? { statusMessage: h.statusMessage } : {}),
				},
			],
		}));
	}
	return { hooks };
}

function makeMarketplace(extra = {}) {
	return {
		name: SOURCE.name,
		owner: SOURCE.author,
		metadata: {
			description: SOURCE.marketplaceDescription,
		},
		plugins: [
			{
				name: SOURCE.name,
				source: "./",
				description: SOURCE.marketplaceDescription,
				version: SOURCE.version,
				author: SOURCE.author,
				homepage: SOURCE.homepage,
				repository: SOURCE.repository,
				license: SOURCE.license,
				keywords: SOURCE.keywords,
				category: "productivity",
				tags: SOURCE.keywords,
				strict: false,
				...extra,
			},
		],
	};
}

function makeCursorHooks() {
	const cursorEventMap = {
		SessionStart: "sessionStart",
		Stop: "sessionEnd",
	};
	const hooks = {};
	for (const [event, entries] of Object.entries(SOURCE.hooks)) {
		const cursorEvent = cursorEventMap[event];
		if (!cursorEvent) continue;
		hooks[cursorEvent] = entries.map((h) => ({
			command: `node .cursor/hooks/${h.script}`,
			event: cursorEvent,
			...(h.description ? { description: h.description } : {}),
		}));
	}
	return { version: 1, hooks };
}

// --- Targets ---
const targets = [
	{
		path: "plugin.json",
		content: () =>
			JSON.stringify(
				makePluginJson({
					contextFileName: "AGENTS.md",
					keywords: SOURCE.keywords,
					license: SOURCE.license,
				}),
				null,
				2,
			) + "\n",
	},
	{
		path: ".claude-plugin/plugin.json",
		content: () =>
			JSON.stringify(
				makePluginJson({
					author: SOURCE.author,
					homepage: SOURCE.homepage,
					repository: SOURCE.repository,
					license: SOURCE.license,
					keywords: SOURCE.keywords,
					hooks: "./hooks/claude-hooks.json",
					userConfig: SOURCE.userConfig,
				}),
				null,
				2,
			) + "\n",
	},
	{
		path: "hooks/claude-hooks.json",
		content: () => JSON.stringify(makeClaudeHooks(), null, 2) + "\n",
	},
	{
		path: "hooks/hooks.json",
		content: () =>
			JSON.stringify(
				{ $schema: "https://json.schemastore.org/claude-code-settings.json", ...makeGenericHooks() },
				null,
				2,
			) + "\n",
	},
	{
		path: ".codex-plugin/plugin.json",
		content: () =>
			JSON.stringify(
				makePluginJson({
					keywords: SOURCE.keywords,
					author: SOURCE.author,
					homepage: SOURCE.homepage,
					repository: SOURCE.repository,
					license: SOURCE.license,
					skills: "./skills/",
					hooks: "./hooks/codex-hooks.json",
					interface: {
						displayName: "Learning Mode",
						shortDescription: "Learn from decisions as you build.",
						longDescription: "Adds default/off learning guidance, canonical project insight logs, and an on-demand Deep Learning skill.",
						developerName: SOURCE.author.name,
						category: "Productivity",
						capabilities: ["Instructions", "Lifecycle hooks"],
						websiteURL: SOURCE.homepage,
						privacyPolicyURL: `${SOURCE.homepage}/blob/main/PRIVACY.md`,
						termsOfServiceURL: `${SOURCE.homepage}/blob/main/TERMS.md`,
						defaultPrompt: ["Help me learn while we build this."],
					},
				}),
				null,
				2,
			) + "\n",
	},
	{
		path: ".github/plugin/plugin.json",
		content: () =>
			JSON.stringify(
				makePluginJson({ skills: "skills/" }),
				null,
				2,
			) + "\n",
	},
	{
		path: ".devin-plugin/plugin.json",
		content: () =>
			JSON.stringify(
				makePluginJson({ skills: "./skills/" }),
				null,
				2,
			) + "\n",
	},
	{
		path: ".qoder-plugin/plugin.json",
		content: () =>
			JSON.stringify(
				makePluginJson({ skills: "./skills/", rules: "./.qoder/rules/" }),
				null,
				2,
			) + "\n",
	},
	{
		path: ".grok-plugin/plugin.json",
		content: () =>
			JSON.stringify(
				makePluginJson({ skills: "./skills/" }),
				null,
				2,
			) + "\n",
	},
	// --- marketplace.json files ---
	{
		path: ".claude-plugin/marketplace.json",
		content: () => JSON.stringify(makeMarketplace(), null, 2) + "\n",
	},
	{
		path: ".github/plugin/marketplace.json",
		content: () =>
			JSON.stringify(makeMarketplace({ skills: "skills/" }), null, 2) + "\n",
	},
	{
		path: ".grok-plugin/marketplace.json",
		content: () => JSON.stringify(makeMarketplace(), null, 2) + "\n",
	},
	// --- .cursor/hooks.json ---
	{
		path: ".cursor/hooks.json",
		content: () => JSON.stringify(makeCursorHooks(), null, 2) + "\n",
	},
];

// --- Sync ---
let changed = 0;

for (const target of targets) {
	const fullPath = path.join(ROOT, target.path);
	const newContent = target.content();
	const oldContent = fs.existsSync(fullPath)
		? fs.readFileSync(fullPath, "utf-8")
		: "";

	if (newContent === oldContent) {
		console.log(`  ✅ ${target.path} — up to date`);
		continue;
	}

	changed++;
	if (APPLY) {
		fs.mkdirSync(path.dirname(fullPath), { recursive: true });
		fs.writeFileSync(fullPath, newContent);
		console.log(`  ✏️  ${target.path} — updated`);
	} else {
		console.log(`  🔄 ${target.path} — needs update`);
		const oldLines = oldContent.split("\n");
		const newLines = newContent.split("\n");
		for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
			if (oldLines[i] !== newLines[i]) {
				console.log(`     line ${i + 1}: "${(oldLines[i] || "").slice(0, 60)}" → "${(newLines[i] || "").slice(0, 60)}"`);
				break;
			}
		}
	}
}

console.log(
	`\n${changed === 0 ? "✅ All configs in sync" : `🔄 ${changed} file(s) need update`}`,
);

if (!APPLY && changed > 0) {
	console.log("\nRun with --apply to write changes");
}
