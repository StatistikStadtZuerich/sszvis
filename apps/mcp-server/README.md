# @sszvis/mcp-server

Prototype MCP server that serves the sszvis chart builder as an [MCP App](https://github.com/modelcontextprotocol/ext-apps): the model asks for a chart, and the host shows it in the conversation, where the reader can change it and copy its code. Built on Effect's `McpServer` (`effect/ai`) over Streamable HTTP.

```sh
pnpm --filter @sszvis/mcp-server start       # builds, then serves http://127.0.0.1:9009/mcp
pnpm --filter @sszvis/mcp-server inspector   # MCP Jam; add the URL as a Streamable HTTP server
```

| Variable              | Default                 |
| --------------------- | ----------------------- |
| `MCP_PORT`            | `9009`                  |
| `MCP_HOST`            | `127.0.0.1`             |
| `MCP_ALLOWED_ORIGINS` | `http://localhost:3000` |

Test it in MCP Jam's **Strict** CSP mode: its default allows every origin and hides the failures a real host has. Claude needs the server on a public HTTPS URL (a tunnel such as `cloudflared`) added as a custom connector; a stdio entry in Claude Desktop's config does not get app tools.

## What it serves

| Name                | Kind     | For                                                                                      |
| ------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `list_recipes`      | tool     | the model: each chart type's roles, options and features, and the sample tables          |
| `render_chart`      | tool     | the model: draws a chart in `ui://sszvis/chart`; returns the spec, not the code          |
| `update_chart`      | tool     | the app only: generates the code for a spec, or switches its recipe                      |
| `ui://sszvis/chart` | resource | the app page, one for every recipe                                                       |
| `sszvis://topo/*`   | resource | the `@sszvis/geodata` TopoJSON bundles, which a map's app reads instead of fetching them |

`render_chart` takes a small input (`recipe`, `csv` or `sample`, and optional `fields`, `options`, `features`) and fills in the rest of chart-builder's `Spec`. Input that names something the recipe or the table does not have comes back as a tool error listing what would be valid, so the model can correct it.

## How the app runs a chart

`ui/` builds to one HTML file (`vite-plugin-singlefile`) that the server inlines. It loads d3, sszvis and topojson-client from the same unpkg URLs the generated page uses (`@sszvis/chart-builder/host`), declared as `resourceDomains` in the resource's CSP, so the preview is what the download runs.

The generated `chart.js` runs unchanged. The host's CSP has `connect-src 'none'` and no `unsafe-eval`, so `ui/src/runtime.ts` answers its `d3.csv` and `d3.json` from memory, and parses the CSV without `d3.csvParse`, which compiles row objects with `new Function`. Each run is wrapped in a function, since classic scripts share one global scope and a chart's top-level `const`s would clash on the next run.

## Building

The server is built with Vite rather than esbuild because chart-builder loads its templates with `import.meta.glob`, and with `--configLoader runner` because chart-builder's source uses extensionless imports Node cannot resolve. Everything is bundled except `ts-blank-space`, whose CommonJS TypeScript compiler breaks once inlined into ESM.

`test/tools.test.ts` checks the tools over Effect's in-memory `McpTest` client. `test/app.browser.test.ts` runs the same server in Chromium, mounts the app in a sandboxed frame under the spec's default CSP, and drives it through ext-apps' own `AppBridge`, with the CDN URLs pointed at the workspace's copies so it needs no network.
