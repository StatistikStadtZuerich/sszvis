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
5. Run the [consumer chart check](check-consumer-charts.md) over the map charts.
6. Tell the consumer that the map data changed. Each production map chart carries its
   own copy of the data, so the consumer must replace those copies. See
   [How consumers load sszvis](../explanation/how-consumers-load-sszvis.md).
