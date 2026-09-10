/**
 * `serve` - the side-by-side comparison page.
 *
 * Serves every chart in the reference checkout twice: once against the pinned
 * sszvis release the page was authored for ("baseline"), once against this
 * working copy's build ("candidate"). The pages hardcode absolute
 * `http://sszsttprd/...` library URLs, so the HTML is rewritten per request -
 * nothing in `.reference` is modified.
 */
// `NodeHttpServer.layer` takes Node's own `createServer`; the rule's suggested
// `HttpClient` is the client side and has no bearing on serving.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { createServer } from "node:http";
import { NodeHttpServer } from "@effect/platform-node";
import { Config, Effect, Layer, Option } from "effect";
import { FileSystem } from "effect/FileSystem";
import { NetAddress } from "effect/unstable/net";
import { Path } from "effect/Path";
import { Command, Flag } from "effect/unstable/cli";
import {
  HttpRouter,
  HttpServer,
  HttpServerRequest,
  HttpServerResponse,
} from "effect/unstable/http";
import { Manifest } from "../services/Manifest.ts";
import { rewriteChart } from "../services/Rewrite.ts";
import { Workspace } from "../services/Workspace.ts";

const port = Flag.Int("port").pipe(
  Flag.withAlias("p"),
  Flag.withDescription("Port to listen on"),
  Flag.withFallbackConfig(Config.Port("PORT")),
  Flag.withDefault(8100),
);

const LIB_URL = /^\/lib\/(baseline|candidate)\/(\d+\.\d+\.\d+)\/(.+)$/;

/**
 * On every response, because the comparison only means anything against the
 * build on disk right now.
 *
 * `HttpServerResponse.file` emits `Last-Modified` and an ETag, and a validator
 * with no explicit freshness may be given a heuristic lifetime (RFC 9111
 * 4.2.2) - so Chromium would serve a pre-rebuild `sszvis.js` from its own
 * cache and the harness would compare against a stale candidate.
 */
const noStore = HttpServerResponse.setHeader("cache-control", "no-store");

/**
 * The routes, as a layer, so `HttpRouter.serve` can mount them. Everything the
 * handlers need is acquired once here rather than per request.
 */
export const Routes = Layer.unwrap(
  Effect.gen(function* () {
    const fs = yield* FileSystem;
    const path = yield* Path;
    const workspace = yield* Workspace;
    const manifest = yield* Manifest;

    /**
     * Reject anything that escapes the root it claims to be in. The chart path
     * arrives percent-decoded (`%2e%2e%2f` is `../`), so the check has to be on
     * the resolved path and has to run after decoding, not on the raw URL.
     */
    const within = (root: string, target: string): Option.Option<string> => {
      const resolved = path.resolve(target);
      return resolved === root || resolved.startsWith(root + path.sep)
        ? Option.some(resolved)
        : Option.none();
    };

    const notFound = noStore(HttpServerResponse.text("Not found", { status: 404 }));
    const forbidden = noStore(HttpServerResponse.text("Forbidden", { status: 403 }));

    /** 404 rather than an error when the path is missing or is a directory. */
    const sendFile = Effect.fnUntraced(function* (file: string) {
      const info = yield* fs.stat(file).pipe(Effect.option);
      if (Option.isNone(info) || info.value.type !== "File") return notFound;
      return noStore(yield* HttpServerResponse.file(file));
    });

    const comparisonPage = sendFile(workspace.comparisonPage);

    const manifestJson = Effect.map(manifest.all, (charts) =>
      noStore(HttpServerResponse.jsonUnsafe(charts)),
    );

    /**
     * `/lib/<side>/<version>/<file>` - resolved per side, so the baseline gets
     * the pinned release and the candidate gets this working copy's build.
     */
    const libFile = Effect.fnUntraced(function* (request: HttpServerRequest.HttpServerRequest) {
      const match = LIB_URL.exec(new URL(request.url, "http://localhost").pathname);
      // Narrowed, not asserted: the pattern guarantees three groups today, but
      // an edit to it would otherwise reach the filesystem as `undefined`.
      const [, side, version, file] = match ?? [];
      if (side === undefined || version === undefined || file === undefined) return notFound;
      if (side !== "baseline" && side !== "candidate") return notFound;
      // The candidate resolves into this repo, the baseline into `.reference`;
      // each is confined to the root it belongs to.
      const root = side === "baseline" ? workspace.reference : workspace.repo;
      const safe = within(root, workspace.lib(side, version, file));
      return Option.isNone(safe) ? forbidden : yield* sendFile(safe.value);
    });

    /**
     * `/chart/<path>` - the page itself when `?side=` asks for one, and
     * otherwise the data, scripts and images sitting beside it.
     */
    const chart = Effect.fnUntraced(function* (request: HttpServerRequest.HttpServerRequest) {
      const url = new URL(request.url, "http://localhost");
      // NOTE: Unguarded because `HttpRouter` 404s a malformed escape before this
      // handler runs (verified: `GET /chart/%` never reaches here). A router
      // change would turn a lone `%` into a thrown URIError - wrap this then.
      const rel = decodeURIComponent(url.pathname.slice("/chart/".length));
      const safe = within(workspace.reference, path.join(workspace.reference, rel));
      if (Option.isNone(safe)) return forbidden;

      const side = url.searchParams.get("side");
      if (!safe.value.endsWith(".html") || (side !== "baseline" && side !== "candidate")) {
        return yield* sendFile(safe.value);
      }

      const html = yield* fs.readFileString(safe.value).pipe(Effect.option);
      if (Option.isNone(html)) {
        return noStore(HttpServerResponse.text("Chart not found", { status: 404 }));
      }
      const normalized = path.relative(workspace.reference, safe.value).split(path.sep).join("/");
      return noStore(HttpServerResponse.html(rewriteChart(html.value, side, normalized)));
    });

    return Layer.mergeAll(
      HttpRouter.add("GET", "/", comparisonPage),
      HttpRouter.add("GET", "/index.html", comparisonPage),
      HttpRouter.add("GET", "/api/manifest.json", manifestJson),
      HttpRouter.add("GET", "/lib/*", libFile),
      HttpRouter.add("GET", "/chart/*", chart),
    );
  }),
);

/**
 * The harness as a layer: the routes mounted on a listening server.
 *
 * `serve` launches it and keeps it alive; `crawl` builds it inside a scope so a
 * sweep can run against a server of its own. Port 0 asks the OS for a free one.
 */
export const harnessLayer = (options: { readonly port: number; readonly quiet?: boolean }) =>
  HttpRouter.serve(Routes, {
    // A few thousand requests per sweep; one log line each would bury the report.
    disableLogger: options.quiet === true,
    disableListenLog: options.quiet === true,
  }).pipe(Layer.provideMerge(NodeHttpServer.layer(createServer, { port: options.port })));

/**
 * Where the running server can actually be reached.
 *
 * A server that bound an unspecified address (`::`, `0.0.0.0`) is reported as
 * such, which is not a hostname a client can connect to - so it is narrowed to
 * IPv4 loopback, the same way `HttpServer.makeTestClient` does.
 */
export const baseUrl: Effect.Effect<string, never, HttpServer.HttpServer> = Effect.gen(
  function* () {
    const server = yield* HttpServer.HttpServer;
    const address = server.address;
    if (NetAddress.isUnixPathAddress(address)) {
      return yield* Effect.die(new Error("The harness cannot be crawled over a unix socket."));
    }
    const url = yield* Effect.fromResult(NetAddress.toUrl(address)).pipe(Effect.orDie);
    if (NetAddress.isUnspecified(address.address)) {
      url.hostname = NetAddress.formatIp(NetAddress.ipv4Loopback);
    }
    return url.origin;
  },
);

export const serve = Command.make(
  "serve",
  { port },
  Effect.fn("serve")(function* ({ port }) {
    // The shared layer, not a second expression mounting the same routes: an
    // option added to one and not the other would make the comparisons differ.
    return yield* Layer.launch(harnessLayer({ port }));
  }),
).pipe(
  Command.withDescription("Serve the side-by-side comparison page"),
  Command.withExamples([
    { command: "sszvis-regression serve", description: "Serve on http://localhost:8100" },
    { command: "sszvis-regression serve --port 9000", description: "Serve on another port" },
  ]),
);
