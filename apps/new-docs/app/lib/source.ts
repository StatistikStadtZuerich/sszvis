/**
 * One file as the code views show it: the text, and shiki's rendering of it
 * when a grammar exists for the file type. The examples plugin builds these at
 * build time; the chart builder's worker builds them per compile. Both feed
 * the same `SourceView`, so the two must not drift.
 */

export interface Source {
  readonly raw: string;
  readonly html: string | null;
  readonly lines?: number;
  readonly url?: string;
}

export type Sources = Readonly<Record<string, Source>>;
