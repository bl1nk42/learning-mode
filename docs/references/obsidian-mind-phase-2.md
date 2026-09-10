# obsidian-mind provenance for Phase 2

Verified before Phase 2 implementation.

- Repository: https://github.com/breferrari/obsidian-mind
- Revision: `af615d100a1d04561409ab9a1e71e615efa1d87b`
- Inspected source: `ARCHITECTURE.md` and `vault-manifest.json`.

Applied constraints:

- Durable knowledge is Markdown with frontmatter and wikilinks; it remains portable and Obsidian-browsable.
- The store is the persistent state; hooks are deterministic machinery around it.
- Required metadata is explicit, so migration must preserve declared data rather than infer it from absent fields.
- User content is preserved during migrations; validation reports declared versus derived state.
