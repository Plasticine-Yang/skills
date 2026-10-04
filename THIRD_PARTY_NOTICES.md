# Third-party notices

## HumanLayer skills

`skills/agentic-loops/build-iterated-agentic-loop/` and `skills/agentic-loops/design-control-loop/` are derived from [HumanLayer's skills repository](https://github.com/humanlayer/skills), licensed under MIT.

- Copyright (c) 2026 HumanLayer.
- Upstream commit: `ca7c8088db69e315a8b2deea43820270457f8f3c`.
- Original paths: `plugins/<skill-name>/skills/<skill-name>/`.
- Each distributed skill retains a copy of the original MIT license in `LICENSE`.

The initial adaptation changes generated skill paths to `.agents/skills/`, adds comments clarifying runner substitution in workflow templates, and repairs references in the example skills. The agent runner templates, iteration scripts, task instructions, interview structure, and completion criteria are preserved. See [the exact migration patch](docs/humanlayer-migration.patch) and [file checksums](docs/upstream.json).

The examples still mention Claude Code and CodeLayer intentionally: they remain supported runner choices, and the original concrete examples provide context. The `codelayer-agent` PR marker is preserved as the routing protocol used by both the iteration script and workflow templates.

## Answer me with HTML Renderer

`skills/answer-me/answer-me-with-html-renderer/` is derived from [QingYunA/answer-me-with-html](https://github.com/QingYunA/answer-me-with-html), under MIT.

- Copyright (c) 2026 Answer me with HTML contributors.
- Upstream commit: `9e8a88a62411f9fff21a33c5d4a79ca928e6a64e` (upstream package version `0.4.3`).
- The upstream `skills/answer-me-with-html/scripts/am.mjs` is retained unchanged in `scripts/upstream/am.mjs`.
- The skill retains the upstream MIT license in `LICENSE`, and the bundled dependency licenses for `@dagrejs/dagre`, `@dagrejs/graphlib`, and `marked` in `licenses/`.

Local changes rename the skill to avoid replacing the original `answer-me-with-html`, follow this repository's manual invocation convention, and add a launcher that puts HTML and videos in the local `.answer-me/` directories. The launcher keeps configuration/cache separate and disables the upstream version checker; updates come from this repository. The renderer, templates, diagram components, writing checks, patch support, and optional video runtime are preserved. No upstream always-on plugin or global `am` command is installed. See the distributed [UPSTREAM.md](skills/answer-me/answer-me-with-html-renderer/UPSTREAM.md) for provenance and maintenance instructions.

## Setup Project

The local issue tracker conventions, triage vocabulary, domain consumer rules and wayfinding operations in `skills/engineering/setup-project/templates/` are adapted from [Matt Pocock's setup skill](https://github.com/mattpocock/skills/tree/24fe0ef7737efae15c87225755e9f6f5965e4888/skills/engineering/setup-matt-pocock-skills), under MIT.

- Copyright (c) 2026 Matt Pocock.
- Upstream commit: `24fe0ef7737efae15c87225755e9f6f5965e4888`.
- The upstream license is bundled in `skills/engineering/setup-project/licenses/mattpocock-skills.txt`, including independent skill installations.

Local changes use Chinese project conventions, add the `done` completion state, preserve existing project content during merges, and separate versioned task records from ignored intermediate artifacts. The preset workflow and missing-file scaffold are maintained by this repository. See the distributed [UPSTREAM.md](skills/engineering/setup-project/UPSTREAM.md).

## Release tooling

The Changesets release workflow and version synchronization approach are adapted from [Matt Pocock's skills repository](https://github.com/mattpocock/skills), commit `d81f3a183412e71a5b1e84ca21bc1a35eea03a60`, under MIT. Matt's upstream license is retained in [licenses/mattpocock-skills.txt](licenses/mattpocock-skills.txt).

Local differences: validate skills and installation before the Changesets action, fetch full Git history, synchronize versions into the marketplace's metadata, installation groups, and npm lockfile instead of a single plugin manifest, and clarify the action's default PR text to describe tag-only publication.
