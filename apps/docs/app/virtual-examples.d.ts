declare module "virtual:examples" {
  /* The shape lives in `~/lib/source` so the chart builder can share it without this virtual module. */
  export type { Source, Sources } from "~/lib/source";

  export const examples: Readonly<
    Record<
      string,
      {
        readonly id: string;
        readonly title: string;
        readonly url: string;
        readonly views: ReadonlyArray<string>;
        readonly load: () => Promise<{ readonly default: Sources }>;
      }
    >
  >;

  export const catalog: ReadonlyArray<{
    readonly id: string;
    readonly page: string;
    readonly pageLabel: string;
  }>;
}
