/*
 * Imported first, before anything that loads zod. zod probes whether it may compile
 * parsers with `Function("")` the first time it parses an object, and a host's CSP has no
 * `unsafe-eval`: the probe is caught, but the host still reports a violation (MCP Jam's
 * Strict mode shows it). ext-apps sets the same flag, but only once `App` is constructed,
 * after zod has already parsed.
 */
import { config } from "zod";

config({ jitless: true });
