import { Schema } from "effect";

/**
 * One file as the code views show it: the text, and shiki's rendering of it
 * when a grammar exists for the file type. The examples plugin builds these at
 * build time; the chart builder's worker builds them per compile. Both feed the
 * same `SourceView`, so this is the one declaration of the shape: the schema is
 * the builder's RPC contract and the interface is what every other reader sees.
 *
 * `lines` and `url` are exact optional keys, set only by the examples plugin
 * when it truncates a file. The worker omits them, and an omitted optional key
 * encodes to an absent key, so the shape on the wire is `{ raw, html }`.
 */
export const Source = Schema.Struct({
  raw: Schema.String,
  html: Schema.NullOr(Schema.String),
  lines: Schema.optionalKey(Schema.Number),
  url: Schema.optionalKey(Schema.String),
});

export interface Source extends Schema.Schema.Type<typeof Source> {}

export type Sources = Readonly<Record<string, Source>>;
