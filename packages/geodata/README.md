# @sszvis/geodata

Swiss geographic source data for sszvis, plus the pipeline that turns it into the
TopoJSON bundles the documentation examples load.

```txt
src/            GeoJSON and CSV sources — the inputs, edited by hand or refreshed
                from the Stadt Zürich open-data portal
topo.sh         the pipeline
dist/topo/      build output: the four TopoJSON bundles
updating.txt    how to update the map data
```

```sh
pnpm --filter @sszvis/geodata run build
```

`topo.sh` downloads any missing source file from
[data.stadt-zuerich.ch](https://data.stadt-zuerich.ch) before building, so a normal
build needs no network — the sources are committed.

`apps/docs` depends on this package and serves `dist/topo/` at both `/topo/…` and
`/static/topo/…`.

## Reproducibility

`geo2topo`'s `ndjson-join` does not fix the order of the features it emits, so two
runs over identical input can order `statistische_quartiere` differently. The output
is therefore not byte-reproducible and cannot be verified by diffing; compare it
order-insensitively instead. The bundles were previously committed to
`apps/docs/docs/static/topo/`, and that copy was confirmed semantically identical to
a fresh run before it was removed.
