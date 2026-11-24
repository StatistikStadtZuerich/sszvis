# Supported environments

## Browsers

sszvis targets [Baseline](https://web.dev/baseline) Widely available as of the
current major release, v3.0.0, tagged on 2024-08-12. A new major release may move the
target. A polyfill counts as a new dependency in the bundle. See
[How consumers load sszvis](../explanation/how-consumers-load-sszvis.md).

## d3

`d3` `>=7.9.0`, as the peer dependency in `packages/sszvis/package.json`. The consumer
loads one agreed d3 version. See [How to upgrade d3](../how-to/upgrade-d3.md).

## Development

| Requirement        | Version                                                     |
| ------------------ | ----------------------------------------------------------- |
| Node               | `>=22` (`engines` in the root `package.json`)               |
| pnpm               | 9, as `packageManager` in the root `package.json`           |
| Browsers for tests | installed by `pnpm --filter sszvis exec playwright install` |

Nix and direnv are the recommended setup. `.envrc` contains `use flake`, and
`nix develop` provides the toolchain. GitButler and personal agent configuration are
optional. The tracked `.agents/skills/sszvis-styleguide` skill is project tooling and
applies to every agent.

## Environment variables

Development needs no secrets. All variables are optional.

### Library and docs

| Variable            | Default                 | Read by                                                                  | Effect                                                        |
| ------------------- | ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `DOCS_BASE`         | `/`                     | `apps/docs/docs-base.ts`                                                 | The base path of the docs site. GitHub Pages uses `/sszvis/`. |
| `SNAPSHOT_BASE_URL` | `http://localhost:4173` | `packages/sszvis/playwright.config.js`, `test/snapshot/snapshot.spec.js` | The server the snapshot suite screenshots.                    |

CI also sets `CI`, which makes Playwright retry, run one worker, and not reuse an
existing server.

### Regression harness

| Variable      | Default                                       | Effect                                                                        |
| ------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| `SSZVIS_REPO` | the nearest parent with `pnpm-workspace.yaml` | The repository root. Read in `apps/regression-cli/src/services/Workspace.ts`. |
| `PORT`        | `8100`                                        | The port of `serve`, when `--port` is not given.                              |

### MCP server

Read in `apps/mcp-server/src/index.ts`.

| Variable              | Default                 | Effect                                                                                            |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `MCP_PORT`            | `9009`                  | The port the server listens on.                                                                   |
| `MCP_HOST`            | `127.0.0.1`             | The host the server binds to.                                                                     |
| `MCP_ALLOWED_ORIGINS` | `http://localhost:8000` | A comma-separated list of origins allowed to call the server. Set it when the docs run elsewhere. |
