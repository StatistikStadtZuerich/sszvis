# How to release a version

This guide takes the pending changesets on `master` to a published version with
bundles and curated notes on its GitHub release. To understand what the workflow does
at each step, read [How a release flows](../explanation/how-a-release-flows.md).

## Before you merge

1. Open the "chore: version packages" pull request. Check that its version bump
   matches what the changesets describe.
2. If the release deserves more than the accumulated bullets, edit its section of
   `packages/sszvis/CHANGELOG.md` in that pull request. The 3.5.0 entry is the model.
   A patch release usually needs no edit.
3. If the release fixes a behavior that consumer charts may rely on, run the
   [consumer chart check](check-consumer-charts.md) first.

## Publish

1. Merge the "chore: version packages" pull request.
2. Watch the `Release` workflow on `master`. The `Publish` job and then the `Tag` job
   must both pass.
3. Confirm the version at <https://www.npmjs.com/package/sszvis>, including the
   provenance badge.

If `Publish` fails, nothing is tagged. Fix the cause on `master`, and the next run
publishes the same version.

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
