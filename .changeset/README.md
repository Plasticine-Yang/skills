# Changesets

Run `npm run changeset` for changes to distributed skills or their installation behavior. Select `plasticine-skills`, choose the bump type, and describe the user-visible change. Commit the generated Markdown file with the change.

On pushes to `main`, the release workflow creates or updates `chore: 更新技能版本`. Review and merge that PR to publish the version tag. Changesets updates `package.json` and `CHANGELOG.md`; the version script synchronizes the marketplace version and every group version. Patch releases can use `./scripts/project release patch --summary "User-visible change"`; see `docs/agents/release.md`.

This is a private package: it is versioned and tagged, but never published to npm. Initial version `0.0.0` plus the import's minor changeset produces `0.1.0`.
