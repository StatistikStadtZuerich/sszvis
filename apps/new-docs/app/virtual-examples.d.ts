declare module "virtual:examples" {
  export type Source = {
    readonly raw: string;
    readonly html: string | null;
    /** Set when only the first lines are shown: the file's real length, and where it lives. */
    readonly lines?: number;
    readonly url?: string;
  };
  export type Sources = Readonly<Record<string, Source>>;

  export const examples: Readonly<
    Record<
      string,
      {
        readonly id: string;
        readonly title: string;
        readonly url: string;
        /** The tabs the source panel offers, known before the sources load. */
        readonly views: ReadonlyArray<string>;
        /** The sources, in their own chunk: fetched when a reader opens the code. */
        readonly load: () => Promise<{ readonly default: Sources }>;
      }
    >
  >;

  /** Every example the documentation references, ported or not, in page order. */
  export const catalog: ReadonlyArray<{
    readonly id: string;
    readonly page: string;
    readonly pageLabel: string;
  }>;
}
