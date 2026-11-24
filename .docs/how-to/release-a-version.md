# How to release a version

This guide takes the pending changesets on `master` to a published version with
bundles and curated notes on its GitHub release. To understand what the workflow does
at each step, read [How a release flows](../explanation/how-a-release-flows.md).

## Before you merge

1. Open the "chore: version packages" pull request. Check that its version bump
   matches what the changesets describe.
2. Edit the changelog, as the next section describes.
3. If the release fixes a behavior that consumer charts may rely on, run the
   [consumer chart check](check-consumer-charts.md) first.

## Edit the changelog

The version pull request writes a new section into `packages/sszvis/CHANGELOG.md`,
one bullet per changeset. The docs site shows that file on its `/changelog` page, and
npm ships it with the package. So the section is what consumers read when they
upgrade. The generated bullets are a first draft. Rewrite them before you merge.

Common edits:

- Add an opening paragraph that says what the release is about.
- Add a migration guide for a breaking change. Show the old code and the new code.
- Add a short how-to or example for a new feature.
- Merge bullets that describe one change into one bullet.
- Shorten bullets that are too long.
- Add a `### Deprecated` section for each deprecated API.

The 3.5.0 and 3.4.0 entries are the examples to follow. A patch release often needs
only small edits.

To make the edits:

1. Check out the pull request's branch, `changeset-release/master`:

   ```bash
   gh pr checkout <number>
   ```

2. Edit only the new version's section of `packages/sszvis/CHANGELOG.md`.
3. Commit and push to the same branch.
4. Merge the pull request soon after.

If anything merges into `master` after you edit, the `Release` workflow rebuilds
`changeset-release/master` from the changesets and force-pushes it. Your edits are
then lost. Keep a copy of your section until the release merges, and edit last, after
everything else for the release has merged.

You can still fix the changelog after the release with an ordinary pull request. The
docs site then updates, but the copy in the published npm package does not.

## Publish

1. Merge the "chore: version packages" pull request.
2. Watch the `Release` workflow on `master`. The `Publish` job and then the `Tag` job
   must both pass.
3. Confirm the version at <https://www.npmjs.com/package/sszvis>, including the
   provenance badge.

If either job fails, first check whether npm has the version:

```bash
npm view sszvis@<version> version
```

- If npm does not have it, nothing was published or tagged. Fix the cause on
  `master`, and the next run publishes the same version.
- If npm has it but the `Tag` job failed, do not publish again. The workflow checks
  for the tag, not for the npm version, so the next run tries to publish the same
  version and npm rejects it. Create the tag and the release yourself, at the commit
  that was published:

  ```bash
  gh release create v<version> --target <published-commit-sha> --title v<version> --generate-notes
  ```

## Attach the bundles

The GitHub release gets the four files a consumer downloads: `sszvis.js`,
`sszvis.min.js`, `sszvis.css` and `sszvis.d.ts`. Take them from the published npm
package, so they are byte for byte what npm serves.

1. Download and unpack the published package into an empty directory:

   ```bash
   npm pack sszvis@<version> && tar -xzf sszvis-<version>.tgz
   ```

2. Upload the files to the release:

   ```bash
   gh release upload v<version> package/build/sszvis.js package/build/sszvis.min.js package/build/sszvis.css package/build/sszvis.d.ts
   ```

d3 and the TopoJSON are not release assets. See
[the release bundle reference](../reference/release-bundle.md).

## Rewrite the release notes

The generated notes list pull requests in merge order. Rewrite them for someone
deciding whether to upgrade.

1. For a minor or major release, open with a short paragraph that says what the
   release is about and what a consumer will notice.
2. Group the entries under `## Breaking changes`, `## Features`, `## Fixes` and
   `## Deprecated`, in that order. Leave out empty sections.
3. Merge entries that belong together into one bullet, and cite all of their pull
   requests, as in "by @author in #457, #463".
4. Keep the "Full Changelog" compare link at the end.
5. Save the notes:

   ```bash
   gh release edit v<version> --notes-file notes.md
   ```

The 3.5.0 and 3.5.2 releases show the result for a minor and a patch.
