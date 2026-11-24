# How to upgrade d3

A d3 upgrade is not a routine dependency bump. The d3 version is part of what the
consumer agreed to and had reviewed. It changes on the consumer's request or as part
of a planned major release. See
[How consumers load sszvis](../explanation/how-consumers-load-sszvis.md).

1. Agree the target version with the consumer before you change anything.
2. In `packages/sszvis/package.json`, raise the `d3` range in `peerDependencies` and
   the version in `devDependencies`.
3. Update every hard-coded d3 URL. The docs example pages
   (`apps/docs/examples/_template.html`) and the charts the chart builder generates
   (`packages/chart-builder/src/host.ts`) load d3 from unpkg, not from the package
   dependency. Without this step, the snapshot suite still tests the old d3. To list
   every place, including the docs pages and the package README, run:

   ```bash
   rg 'd3@' apps packages -g '!**/CHANGELOG.md'
   ```

4. Run the unit tests and the snapshot suite.
5. Check the consumer charts against the new d3. The harness loads the d3 pinned to
   each chart's release on both sides (`apps/regression-cli/src/services/Workspace.ts`),
   so a normal [consumer chart check](check-consumer-charts.md) does not test the
   upgrade.
   1. Build the library, run `pnpm run regression:crawl`, and keep its report.
   2. In the reference checkout, replace `d3.js` in the release folders of the
      comparable versions with the agreed d3 build.
   3. Run the crawl again and compare the two reports.
   4. Restore the reference files with `git -C .reference/d3charts-website checkout .`.
6. Write a changeset that names the required d3 version. A d3 major is an sszvis
   major.
7. Update the d3 range in [supported environments](../reference/supported-environments.md).
