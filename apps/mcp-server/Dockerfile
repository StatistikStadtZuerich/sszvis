# The sszvis chart builder's MCP server. Build from the repository root, since the server
# bundles workspace packages (chart-builder, geodata, sszvis):
#
#   docker build -f apps/mcp-server/Dockerfile -t sszvis-mcp .
#   docker run -p 9009:9009 sszvis-mcp     # http://localhost:9009/mcp

FROM node:24-bookworm-slim AS build
# geodata's topo.sh fetches four source files from data.stadt-zuerich.ch with curl.
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
# Builds geodata and sszvis first; the server bundles everything except ts-blank-space.
RUN pnpm exec turbo run build --filter=@sszvis/mcp-server
# The server's production dependencies (ts-blank-space, which it loads at run time) beside its build.
RUN pnpm --filter @sszvis/mcp-server deploy --prod /out \
  && rm -rf /out/dist && cp -r apps/mcp-server/dist /out/dist

FROM node:24-bookworm-slim
WORKDIR /app
COPY --from=build --chown=node:node /out .
USER node
# 0.0.0.0, not the local default, so the container's port can be published.
ENV NODE_ENV=production MCP_HOST=0.0.0.0 MCP_PORT=9009
EXPOSE 9009
CMD ["node", "dist/index.js"]
