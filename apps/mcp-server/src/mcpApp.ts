/**
 * @module @sszvis/mcp-server/mcpApp
 *
 * The MCP Apps extension (`io.modelcontextprotocol/ui`) as Effect registrations: an HTML
 * resource a host renders in a sandboxed iframe, and the `_meta.ui` that ties a tool to it
 * or hides a tool from the model.
 */
import { Effect } from "effect";
import { McpServer, Tool } from "effect/ai";

export const EXTENSION = "io.modelcontextprotocol/ui";

const MIME_TYPE = "text/html;profile=mcp-app";

/** What the host's Content Security Policy should let the page load. */
export interface Csp {
  /** Scripts, styles, images and fonts. */
  readonly resourceDomains?: readonly string[];
  /** `fetch`, XHR and WebSocket. */
  readonly connectDomains?: readonly string[];
}

export function appResource(options: {
  readonly uri: string;
  readonly name: string;
  readonly description: string;
  readonly html: string;
  readonly csp: Csp;
}) {
  const ui = { csp: options.csp, prefersBorder: true };
  return McpServer.resource({
    uri: options.uri,
    name: options.name,
    description: options.description,
    mimeType: MIME_TYPE,
    content: Effect.succeed({
      contents: [{ uri: options.uri, mimeType: MIME_TYPE, text: options.html, _meta: { ui } }],
    }),
  });
}

/** Shows the tool's result in the app at `resourceUri`. */
export const renderedBy = (resourceUri: string) => Tool.Meta.of({ ui: { resourceUri } });

/** Callable by the app only; hosts leave it out of the model's tool list. */
export const appOnly = Tool.Meta.of({ ui: { visibility: ["app"] } });

/** The origin of each URL, which is what a CSP domain list holds. */
export const origins = (urls: readonly string[]): readonly string[] => [
  ...new Set(urls.map((url) => new URL(url).origin)),
];
