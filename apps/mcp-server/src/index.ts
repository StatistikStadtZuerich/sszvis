// @effect-diagnostics-next-line nodeBuiltinImport:off
import { createServer } from "node:http";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Config, Effect, Layer } from "effect";
import { McpProtocol, McpServer } from "effect/ai";
import { HttpRouter, HttpServer } from "effect/http";

import { Capabilities } from "./capabilities.ts";
import { EXTENSION } from "./mcpApp.ts";

export const McpServerConfig = Config.all({
  port: Config.Port("MCP_PORT").pipe(Config.withDefault(9009)),
  host: Config.String("MCP_HOST").pipe(Config.withDefault("127.0.0.1")),
  allowedOrigins: Config.String("MCP_ALLOWED_ORIGINS").pipe(
    Config.withDefault("http://localhost:3000"),
  ),
});

const main = Effect.gen(function* () {
  const config = yield* McpServerConfig;
  const allowedOrigins = config.allowedOrigins.split(",").map((origin) => origin.trim());

  yield* Effect.logInfo("Starting MCP server at /mcp");

  return McpServer.layerHttp({
    name: "sszvis chart builder",
    version: "0.0.0",
    path: "/mcp",
    protocols: [McpProtocol.v2026_07_28, McpProtocol.v2025_11_25, McpProtocol.v2025_06_18],
    allowedOrigins,
    extensions: { [EXTENSION]: {} },
    registrations: Capabilities,
  }).pipe(
    HttpRouter.serve,
    HttpServer.withLogAddress,
    Layer.provide(NodeHttpServer.layerConfig(createServer, McpServerConfig)),
  );
}).pipe(Layer.unwrap, Layer.launch, Effect.satisfiesServicesType<never>());

NodeRuntime.runMain(main);
