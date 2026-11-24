# How a release flows

A release has an automated part and a manual part. GitHub Actions versions,
publishes and tags. A maintainer then attaches the bundles and rewrites the release
notes. This page explains how the automated part fits together. For the steps, see
[How to release a version](../how-to/release-a-version.md).

## The version pull request is the trigger, not the tag

`.github/workflows/release.yml` runs on every push to `master`. Its `version` job uses
Changesets to keep one pull request open, titled "chore: version packages". That pull
request consumes the pending `.changeset/*.md` files, bumps
`packages/sszvis/package.json` and writes `packages/sszvis/CHANGELOG.md`.

Merging that pull request is what releases. The merge is another push to `master`, so
`release.yml` runs again. This time it finds no changesets and a version with no
matching tag. That combination starts the `publish` job, which runs `check`,
`type-check` and the unit tests, builds, and publishes to npm with
`npm publish --provenance`.

Only after the publish succeeds does the `tag` job create the tag `v<version>` and a
GitHub release with notes that GitHub generates from the merged pull requests. The
tag records the release. It does not start it. A tag pushed with the workflow's
`GITHUB_TOKEN` cannot start other workflows, and the publish has already happened.
Tagging last means a failed publish leaves the version free to try again.

## Why the publish steps are inlined

npm trusted publishing matches the OIDC token against the workflow registered for the
`sszvis` package on npmjs.com. A reusable workflow called with `uses:` presents the
caller's workflow instead, so the exchange fails and npm rejects the publish with a 404. The publish steps therefore stay inline in `release.yml`, and the file keeps its
name. Renaming it breaks publishing until whoever administers the package on npm
updates the trusted publisher.

`AGENTS.md`, section "Releasing", has the same rules in short form.

## What stays manual

The workflow does not attach the built files to the GitHub release, and its notes are
a raw list of pull requests. Consumers who download a version from GitHub need the
bundles on the release page and notes written for them. A maintainer adds both after
every release.
