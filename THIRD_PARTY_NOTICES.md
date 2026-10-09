# Third-party notices

## Setup Project

The local issue tracker conventions, triage vocabulary, domain consumer rules and wayfinding operations in `skills/engineering/setup-project/templates/` are adapted from [Matt Pocock's setup skill](https://github.com/mattpocock/skills/tree/24fe0ef7737efae15c87225755e9f6f5965e4888/skills/engineering/setup-matt-pocock-skills), under MIT.

- Copyright (c) 2026 Matt Pocock.
- Upstream commit: `24fe0ef7737efae15c87225755e9f6f5965e4888`.
- The upstream license is bundled in `skills/engineering/setup-project/licenses/mattpocock-skills.txt`, including independent skill installations.

Local changes use Chinese project conventions, add the `done` completion state, preserve existing project content during merges, and separate versioned task records from ignored intermediate artifacts. The preset workflow and missing-file scaffold are maintained by this repository. See the distributed [UPSTREAM.md](skills/engineering/setup-project/UPSTREAM.md).

## Release tooling

The Changesets release workflow and version synchronization approach are adapted from [Matt Pocock's skills repository](https://github.com/mattpocock/skills), commit `d81f3a183412e71a5b1e84ca21bc1a35eea03a60`, under MIT. Matt's upstream license is retained in [licenses/mattpocock-skills.txt](licenses/mattpocock-skills.txt).

Local differences: validate skills and installation before the Changesets action, fetch full Git history, synchronize versions into the marketplace's metadata, installation groups, and npm lockfile instead of a single plugin manifest, and clarify the action's default PR text to describe tag-only publication.
