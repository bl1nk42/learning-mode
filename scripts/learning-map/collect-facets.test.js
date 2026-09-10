#!/usr/bin/env node

/**
 * collect-facets.test.js
 *
 * Tests for collect-facets.js output format and behavior.
 * Run: node collect-facets.test.js
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const {
	getProjectId,
	getProjectName,
	createLearningMapMarkdown,
	createLearningMapJSON,
} = require("./collect-facets");

let passed = 0;
let failed = 0;

function assert(condition, name) {
	if (condition) {
		passed++;
		console.log(`  ✅ ${name}`);
	} else {
		failed++;
		console.log(`  ❌ ${name}`);
	}
}

function assertEqual(actual, expected, name) {
	if (actual === expected) {
		passed++;
		console.log(`  ✅ ${name}`);
	} else {
		failed++;
		console.log(`  ❌ ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
	}
}

// --- Test: createLearningMapJSON output format ---
console.log("\n=== createLearningMapJSON ===");

const sampleInsights = [
	{
		id: "abc123",
		insights: ["Graph search expands 1-hop to find connected nodes"],
		references: [{ file: "src/search.ts", line: 15 }],
		recordedAt: "2026-09-10T10:30:00Z",
		source: { project: "/path/to/project" },
	},
	{
		id: "def456",
		insights: ["Context building requires searching relevant nodes first"],
		references: [{ file: "src/context.ts", line: 42 }],
		recordedAt: "2026-09-10T10:35:00Z",
		source: { project: "/path/to/project" },
	},
];

const json = createLearningMapJSON(sampleInsights, "/path/to/project", "test-project");

// Schema compliance
assert(json.version === "1.0.0", "has version 1.0.0");
assert(typeof json.session === "object", "has session object");
assert(typeof json.session.date === "string", "session.date is string");
assert(typeof json.meta === "object", "has meta object");
assert(json.meta.title.length > 0, "meta.title is non-empty");
assert(Array.isArray(json.meta.views), "meta.views is array");
assert(json.meta.views.length > 0, "meta.views has at least 1 view");
assert(Array.isArray(json.nodes), "nodes is array");
assert(Array.isArray(json.edges), "edges is array");

// Node structure
assert(json.nodes.length === 2, "has 2 nodes");
const node = json.nodes[0];
assert(typeof node.id === "string" && node.id.length > 0, "node has id");
assert(node.id.startsWith("insight:") || node.id.startsWith("concept:") || node.id.startsWith("lesson:") || node.id.startsWith("exercise:") || node.id.startsWith("resource:"), "node id has type prefix");
assert(typeof node.type === "string", "node has type");
assert(["insight", "exercise", "lesson", "concept", "resource"].includes(node.type), "node type is valid enum");
assert(typeof node.name === "string" && node.name.length > 0, "node has name");
assert(typeof node.content === "string" && node.content.length > 0, "node has content");
assert(Array.isArray(node.tags), "node has tags array");

// Edge structure (if any)
if (json.edges.length > 0) {
	const edge = json.edges[0];
	assert(typeof edge.source === "string", "edge has source");
	assert(typeof edge.target === "string", "edge has target");
	assert(typeof edge.type === "string", "edge has type");
	assert(["builds_on", "related_to", "contradicts", "prerequisite_of", "applies_to"].includes(edge.type), "edge type is valid enum");
}

// Tour structure (if any)
if (json.tour && json.tour.length > 0) {
	const step = json.tour[0];
	assert(typeof step.order === "number", "tour step has order");
	assert(typeof step.title === "string", "tour step has title");
	assert(typeof step.description === "string", "tour step has description");
	assert(Array.isArray(step.nodeIds), "tour step has nodeIds");
}

// --- Test: getProjectId ---
console.log("\n=== getProjectId ===");

const id1 = getProjectId("/path/to/project");
const id2 = getProjectId("/path/to/project");
const id3 = getProjectId("/different/path");

assertEqual(id1, id2, "same path produces same ID");
assert(id1 !== id3, "different paths produce different IDs");
assert(id1.length === 8, "ID is 8 chars");

// --- Test: getProjectName ---
console.log("\n=== getProjectName ===");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "test-"));

// Test with package.json
fs.writeFileSync(
	path.join(tmpDir, "package.json"),
	JSON.stringify({ name: "my-test-app" }),
);
assertEqual(getProjectName(tmpDir), "my-test-app", "reads name from package.json");

// Test without package.json (falls back to dirname)
const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), "test2-"));
assertEqual(getProjectName(tmpDir2), path.basename(tmpDir2), "falls back to directory name");

// Cleanup
fs.rmSync(tmpDir, { recursive: true, force: true });
fs.rmSync(tmpDir2, { recursive: true, force: true });

// --- Test: createLearningMapMarkdown ---
console.log("\n=== createLearningMapMarkdown ===");

const md = createLearningMapMarkdown(sampleInsights, "/path/to/project", "test-project");
assert(typeof md === "string", "returns string");
assert(md.includes("# Learning Map: test-project"), "has title");
assert(md.includes("Graph search"), "includes insight content");
assert(md.includes("Context building"), "includes second insight content");

// --- Test: output path ---
console.log("\n=== Output Path ===");

const { getVaultPath, getProjectDir, getSessionMapPath } = require("./config");

// Test that session map path is in session-maps/ not projects/
const sessionMapPath = getSessionMapPath ? getSessionMapPath("/path/to/project") : null;
if (sessionMapPath) {
	assert(sessionMapPath.includes("session-maps"), "session map path includes 'session-maps'");
	assert(!sessionMapPath.includes("projects/"), "session map path does NOT include 'projects/'");
	assert(sessionMapPath.endsWith(".json"), "session map path ends with .json");
} else {
	// If getSessionMapPath doesn't exist yet, check config.js exports
	assert(false, "getSessionMapPath not exported from config.js — NEEDS IMPLEMENTATION");
}

// --- Summary ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
