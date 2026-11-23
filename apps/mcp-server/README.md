# @sszvis/mcp-server

Prototype MCP server for the sszvis chart builder, built on Effect's `McpServer`
(`effect/ai`) over Streamable HTTP. The goal is to serve the chart builder as MCP Apps;
for now it registers no tools or resources.

Scaffolded from stack-effect's `server-mcp` target into a scratch folder and copied in,
with the workspace wiring written by hand — `stack-effect add` on this repo rewrites
shared config.

```sh
pnpm --filter @sszvis/mcp-server start        # http://127.0.0.1:9009/mcp
pnpm --filter @sszvis/mcp-server start:watch
pnpm --filter @sszvis/mcp-server inspector    # MCP Jam; add the URL as a Streamable HTTP server
```

| Variable              | Default                 |
| --------------------- | ----------------------- |
| `MCP_PORT`            | `9009`                  |
| `MCP_HOST`            | `127.0.0.1`             |
| `MCP_ALLOWED_ORIGINS` | `http://localhost:3000` |

The scripts are `start`, not `dev`, so the root `pnpm run dev` keeps starting only the
docs server.
