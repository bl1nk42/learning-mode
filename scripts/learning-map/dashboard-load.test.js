/**
 * Seam 3: Dashboard data loading
 * Tests that the dashboard's data transformation correctly consumes session-map.json
 */
const fs = require("fs");
const path = require("path");
const os = require("os");

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

// --- Session map fixture ---
function makeSessionMap() {
	return {
		version: "1.0.0",
		session: { date: "2026-02-14", summary: "learned 3 things" },
		meta: {
			title: "Session 2026-02-14",
			locale: "th",
			quality_profile: "standard",
			views: [{ id: "all", label: "ทั้งหมด", focus: ["*"] }],
		},
		nodes: [
			{
				id: "insight:react-hooks-basics",
				type: "insight",
				name: "React Hooks allow functional components to use state",
				content: "React Hooks allow functional components to use state and lifecycle features.",
				tags: ["react", "hooks"],
				difficulty: "beginner",
				source: "notes/react-basics.md",
				created_at: "2026-02-14T10:00:00.000Z",
			},
			{
				id: "insight:usestate-deep-dive",
				type: "insight",
				name: "useState triggers re-render",
				content: "Calling useState setter triggers a component re-render with the new state value.",
				tags: ["react", "state"],
				difficulty: "intermediate",
				source: { type: "insight-index", id: "abc123" },
				created_at: "2026-02-14T10:05:00.000Z",
			},
			{
				id: "insight:useeffect-lifecycle",
				type: "concept",
				name: "useEffect replaces lifecycle methods",
				content: "useEffect consolidates componentDidMount, componentDidUpdate, and componentWillUnmount.",
				tags: ["react", "lifecycle"],
				difficulty: "intermediate",
				created_at: "2026-02-14T10:10:00.000Z",
			},
		],
		edges: [
			{
				source: "insight:react-hooks-basics",
				target: "insight:usestate-deep-dive",
				type: "builds_on",
				description: "Sequential learning: hooks → useState",
			},
			{
				source: "insight:usestate-deep-dive",
				target: "insight:useeffect-lifecycle",
				type: "prerequisite_of",
				description: "useState → useEffect",
			},
		],
	};
}

// --- Dashboard transformation logic (mirrors learning-map-dashboard.html) ---
function transformSessionMap(data) {
	const nodeMap = Object.fromEntries(
		(data.nodes || []).map((n) => [n.id, n])
	);
	const topics = (data.nodes || []).map((n) => ({
		name: n.name || "Untitled",
		desc: n.content || "",
		refs: n.source
			? [
					typeof n.source === "string"
						? n.source
						: n.source.file
						? `${n.source.file}:${n.source.line}`
						: n.source.id || "",
			  ]
			: [],
		type: n.type,
		difficulty: n.difficulty,
		tags: n.tags || [],
	}));

	const path = [];
	const edgeCount = (data.edges || []).length;
	if (edgeCount > 0) {
		const prereqEdges = (data.edges || []).filter(
			(e) => e.type === "prerequisite_of" || e.type === "builds_on"
		);
		path.push(
			...prereqEdges.slice(0, 10).map((e) => ({
				title: nodeMap[e.source]?.name || e.source,
				desc: e.description || "",
			}))
		);
	}

	return {
		topics,
		path,
		edgeCount,
	};
}

// --- Tests ---
console.log("\n=== Seam 3: Dashboard Data Loading ===\n");

// Test 1: nodes → topics
const data = makeSessionMap();
const result = transformSessionMap(data);

assert(result.topics.length === 3, "topics has 3 entries from nodes");
assert(result.topics[0].name === "React Hooks allow functional components to use state", "topic[0].name matches node[0].name");
assert(result.topics[0].desc.includes("lifecycle features"), "topic[0].desc is node content");
assert(result.topics[0].tags.includes("react"), "topic[0].tags preserved");

// Test 2: string source → refs
assert(result.topics[0].refs.length === 1, "string source → 1 ref");
assert(result.topics[0].refs[0] === "notes/react-basics.md", "string source ref is the string itself");

// Test 3: object source with id → refs
assert(result.topics[1].refs.length === 1, "object source with id → 1 ref");
assert(result.topics[1].refs[0] === "abc123", "object source id ref is source.id");

// Test 4: no source → empty refs
assert(result.topics[2].refs.length === 0, "no source → empty refs");

// Test 5: edges → connections count
assert(result.edgeCount === 2, "edgeCount matches edges.length");

// Test 6: prerequisite/builds_on edges → learning path
assert(result.path.length === 2, "path has entries from prerequisite/builds_on edges");
assert(result.path[0].title === "React Hooks allow functional components to use state", "path[0] resolves node name from source ID");
assert(result.path[0].desc.includes("hooks"), "path[0] has description from edge");

// Test 7: edges with other types excluded from path
const dataWithOtherEdges = makeSessionMap();
dataWithOtherEdges.edges.push({
	source: "insight:a",
	target: "insight:b",
	type: "related_to",
	description: "related",
});
const result2 = transformSessionMap(dataWithOtherEdges);
assert(result2.edgeCount === 3, "edgeCount includes all edges");
assert(result2.path.length === 2, "path excludes non-prerequisite/builds_on edges");

// Test 8: empty data
const emptyResult = transformSessionMap({ nodes: [], edges: [] });
assert(emptyResult.topics.length === 0, "empty nodes → empty topics");
assert(emptyResult.path.length === 0, "empty edges → empty path");
assert(emptyResult.edgeCount === 0, "edgeCount 0");

// Test 9: missing nodes/edges fields
const sparseResult = transformSessionMap({});
assert(sparseResult.topics.length === 0, "missing nodes → empty topics");
assert(sparseResult.edgeCount === 0, "missing edges → edgeCount 0");

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
