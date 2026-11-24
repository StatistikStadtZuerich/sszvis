# How to update the geodata

Use this guide when Zürich's districts, statistical zones or other boundaries change.

The TopoJSON bundles were built once and have been reused since. Nobody has run the
pipeline against new boundaries in recent years, so expect to fix the pipeline as you
go. `packages/geodata/README.md` describes the pipeline, and
`packages/geodata/updating.txt` has older notes on the update.

1. Replace the changed sources in `packages/geodata/src` with new files from
   <https://data.stadt-zuerich.ch>.
2. Rebuild the bundles:

   ```bash
   pnpm run build:topo
   ```

3. Compare the new bundles with the old ones by content, not with a diff. The
   pipeline does not emit features in a fixed order.
4. Check every map page in the documentation site, and the map snapshot baselines,
   including the `*-map.txt` counts.
5. Check the consumer map charts against the new data. The harness serves each chart's
   map data from `.reference/d3charts-website`, so a normal sweep still renders the
   old boundaries.
   1. Run `pnpm run regression:crawl` and keep its report.
   2. In the reference checkout, replace the map data files of the affected charts
      with the rebuilt data. Keep each file's name, format and object names.
   3. Run the crawl again, and open the maps with `pnpm run regression`. Check that
      the data joins still match every district.
   4. Restore the reference files with `git -C .reference/d3charts-website checkout .`.
6. Tell the consumer that the map data changed. Each production map chart carries its
   own copy of the data, so the consumer must replace those copies. See
   [How consumers load sszvis](../explanation/how-consumers-load-sszvis.md).
