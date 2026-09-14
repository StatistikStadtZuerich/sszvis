# Shared example assets

Files more than one example loads, served at `/preview/_static/`. An asset only
one example uses belongs in that example's folder instead.

- `fallback.png` — the image sszvis shows in place of a chart on a browser it
  cannot draw in. One picture for every example that wires up `config.fallback`.
- `topo_layer_280915.png` — the relief basemap the rastermap examples draw under
  their data.

The TopoJSON under `topo/` is not here: it is built by `@sszvis/geodata` and
served straight from that package.
