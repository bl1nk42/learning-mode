#!/usr/bin/env node

/**
 * collect-facets.js
 *
 * Collects insights and creates learning map.
 * Output: Markdown for people + JSON for agents
 *
 * Usage: node collect-facets.js <project-root>
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const { getVaultPath, getProjectDir, getSessionMapPath } = require("./config");

// --- Helpers ---
function getProjectId(projectRoot) {
	return crypto.createHash("md5").update(projectRoot).digest("hex").slice(0, 8);
}

function getProjectName(projectRoot) {
	try {
		const pkg = JSON.parse(
			fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"),
		);
		return pkg.name || path.basename(projectRoot);
	} catch {
		try {
			const pyproject = fs.readFileSync(
				path.join(projectRoot, "pyproject.toml"),
				"utf8",
			);
			const match = pyproject.match(/name = "([^"]+)"/);
			return match ? match[1] : path.basename(projectRoot);
		} catch {
			return path.basename(projectRoot);
		}
	}
}

function readInsightIndex(vaultPath) {
	const indexPath = path.join(vaultPath, "insight-index.jsonl");
	if (!fs.existsSync(indexPath)) {
		return [];
	}

	const content = fs.readFileSync(indexPath, "utf8");
	return content
		.split("\n")
		.filter(Boolean)
		.map((line) => {
			try {
				return JSON.parse(line);
			} catch {
				return null;
			}
		})
		.filter(Boolean);
}

function filterInsightsByProject(insights, projectRoot) {
	return insights.filter((i) => {
		if (i.source && i.source.project) {
			return i.source.project === projectRoot;
		}
		return false;
	});
}

function createLearningMapMarkdown(insights, projectRoot, projectName) {
	const today = new Date().toISOString().split("T")[0];

	// Group insights by topic
	const topics = {};
	insights.forEach((insight) => {
		(insight.insights || []).forEach((text) => {
			const words = text.split().slice(0, 3).join(" ");
			if (!topics[words]) topics[words] = [];
			topics[words].push({
				text,
				references: insight.references || [],
				timestamp: insight.recordedAt,
			});
		});
	});

	// Build Markdown
	const lines = [];

	lines.push(`# Learning Map: ${projectName}`);
	lines.push("");
	lines.push(`**วันที่:** ${today}`);
	lines.push(
		`**สรุป:** เรียนรู้ ${insights.length} insights จาก ${Object.keys(topics).length} topics`,
	);
	lines.push("");

	lines.push("## Topics");
	lines.push("");

	Object.entries(topics).forEach(([topic, items], i) => {
		lines.push(`### ${i + 1}. ${topic}`);
		lines.push("");

		items.forEach((item) => {
			lines.push(`- ${item.text}`);
			if (item.references.length > 0) {
				const refs = item.references
					.map((r) => `\`${r.file}:${r.line}\``)
					.join(", ");
				lines.push(`  - อ้างอิง: ${refs}`);
			}
		});

		lines.push("");
	});

	lines.push("## Learning Path");
	lines.push("");
	lines.push("ลำดับการเรียนรู้:");
	lines.push("");

	Object.keys(topics).forEach((topic, i) => {
		lines.push(`${i + 1}. **${topic}**`);
	});

	lines.push("");

	lines.push("## Summary");
	lines.push("");
	lines.push("Session นี้เรียนรู้:");
	lines.push(`- ${insights.length} insights`);
	lines.push(`- ${Object.keys(topics).length} topics`);
	lines.push("");

	return lines.join("\n");
}

function createLearningMapJSON(insights, projectRoot, projectName) {
	const projectId = getProjectId(projectRoot);
	const today = new Date().toISOString().split("T")[0];

	// Convert insights to schema-compliant nodes
	const nodes = insights.map((insight) => {
		const text = (insight.insights || []).join(" ");
		const slug = text
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "")
			.slice(0, 60);

		return {
			id: `insight:${slug}`,
			type: "insight",
			name: text.slice(0, 100),
			content: text,
			tags: [],
			difficulty: "intermediate",
			source: insight.source
				? { type: "insight-index", id: insight.id }
				: undefined,
			created_at: insight.recordedAt || new Date().toISOString(),
		};
	}).filter((n) => n.content.length > 0);

	// Build edges from sequential insights (builds_on)
	const edges = [];
	for (let i = 1; i < nodes.length; i++) {
		edges.push({
			source: nodes[i - 1].id,
			target: nodes[i].id,
			type: "builds_on",
			description: `Sequential learning: ${nodes[i - 1].name.slice(0, 30)} → ${nodes[i].name.slice(0, 30)}`,
		});
	}

	return {
		version: "1.0.0",
		session: {
			date: today,
			summary: `เรียนรู้ ${nodes.length} insights`,
		},
		meta: {
			title: `Session ${today}`,
			locale: "th",
			quality_profile: "standard",
			views: [
				{ id: "all", label: "ทั้งหมด", focus: ["*"] },
				{ id: "flow", label: "ลำดับการเรียนรู้", focus: ["flow"] },
			],
		},
		nodes,
		edges,
	};
}

// --- Main ---
function main() {
	const projectRoot = process.argv[2] || process.cwd();
	const today = new Date().toISOString().split("T")[0];

	if (!fs.existsSync(projectRoot)) {
		console.error(`Project root does not exist: ${projectRoot}`);
		process.exit(1);
	}

	const vaultPath = getVaultPath();
	const projectId = getProjectId(projectRoot);
	const projectName = getProjectName(projectRoot);
	const projectDir = getProjectDir(projectRoot);

	console.log(`Vault: ${vaultPath}`);
	console.log(`Project: ${projectName} (${projectId})`);

	// Read insights
	const allInsights = readInsightIndex(vaultPath);
	const projectInsights = filterInsightsByProject(allInsights, projectRoot);

	if (projectInsights.length === 0) {
		console.log(`No insights found for project: ${projectName}`);
		process.exit(0);
	}

	console.log(`Found ${projectInsights.length} insights`);

	// Create project directory
	if (!fs.existsSync(projectDir)) {
		fs.mkdirSync(projectDir, { recursive: true });
	}

	// Create Markdown (for people)
	const markdown = createLearningMapMarkdown(
		projectInsights,
		projectRoot,
		projectName,
	);
	const mdPath = path.join(projectDir, "learning-map.md");
	fs.writeFileSync(mdPath, markdown);
	console.log(`Created: ${mdPath}`);

	// Create session map (schema-valid JSON)
	const json = createLearningMapJSON(projectInsights, projectRoot, projectName);
	const sessionMapDir = path.join(os.homedir(), ".learning-mode", "session-maps");
	if (!fs.existsSync(sessionMapDir)) {
		fs.mkdirSync(sessionMapDir, { recursive: true });
	}
	const jsonPath = path.join(sessionMapDir, `${projectId}-${today}.json`);
	fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));
	console.log(`Created: ${jsonPath}`);

	console.log("\nDone!");
}

if (require.main === module) {
	main();
}

module.exports = {
	getProjectId,
	getProjectName,
	createLearningMapMarkdown,
	createLearningMapJSON,
};
