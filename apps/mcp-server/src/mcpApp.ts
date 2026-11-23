import { Effect } from "effect";
import { McpServer, Tool } from "effect/ai";

export const EXTENSION = "io.modelcontextprotocol/ui";

const MIME_TYPE = "text/html;profile=mcp-app";

export interface Csp {
  readonly resourceDomains?: readonly string[];
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

export const renderedBy = (resourceUri: string) => Tool.Meta.of({ ui: { resourceUri } });

export const appOnly = Tool.Meta.of({ ui: { visibility: ["app"] } });

export const origins = (urls: readonly string[]): readonly string[] => [
  ...new Set(urls.map((url) => new URL(url).origin)),
];
