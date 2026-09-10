# Changesets

Every pull request that changes the published library adds a file here. Run
`pnpm changeset`, pick the semver bump, and write one user-facing sentence; the
file it writes is reviewed with the rest of the PR.

`packages/sszvis` is the only published package, so it is the only one a
changeset can name. Changes confined to the docs site, the geodata pipeline or
the repository tooling need no changeset.

See the Releasing section in `AGENTS.md` for what happens after the PR lands,
and <https://github.com/changesets/changesets> for the tool itself.
