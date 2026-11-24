# .docs

What the code and `AGENTS.md` cannot tell you: why the repository is the way it is,
what goes wrong in practice, and how to do the jobs that come up only now and then.
These docs are for people and for coding agents.

`AGENTS.md` remains the reference for commands, code conventions, changesets and the
snapshot workflow. These docs link to it rather than repeat it.

## Start here

Read [How consumers load sszvis](explanation/how-consumers-load-sszvis.md) first.
Most decisions in this repository follow from it. Then read
[pitfalls.md](pitfalls.md) before you fix your first bug.

## By kind

The docs follow [Diátaxis](https://diataxis.fr). Each file is one kind of document.

**Explanation.** Background and reasons.

- [How consumers load sszvis](explanation/how-consumers-load-sszvis.md)
- [How a release flows](explanation/how-a-release-flows.md)
- [decisions.md](decisions.md), the reasons behind each major choice
- [pitfalls.md](pitfalls.md), what goes wrong while every check passes

**How-to guides.** Steps for a task.

- [How to release a version](how-to/release-a-version.md)
- [How to check consumer charts before a release](how-to/check-consumer-charts.md)
- [How to deprecate a public API](how-to/deprecate-a-public-api.md)
- [How to change how a chart renders](how-to/change-how-a-chart-renders.md)
- [How to upgrade d3](how-to/upgrade-d3.md)
- [How to update the geodata](how-to/update-the-geodata.md)
- [How to bump development dependencies](how-to/bump-development-dependencies.md)

`AGENTS.md` has the guides for adding a docs example and writing a changeset.

**Reference.** Facts to look up.

- [Release bundle](reference/release-bundle.md), the files a consumer loads
- [Supported environments](reference/supported-environments.md), browsers, d3,
  development tools and environment variables

**Tutorials.** None yet. The documentation site teaches consumers how to build
charts.

The experimental apps (`apps/docs/app/builder`, `apps/mcp-server`,
`apps/regression-cli` and `contrib/experiments`) keep their status in their own
READMEs, next to the code.

## Keep these docs current

If you learn something the next person would otherwise have to ask about, add it
here. Add a decision when someone could "fix" it without knowing the reason. Delete
an entry when its reason no longer holds.
