import { typefaceBody } from "~/components/tokens/typeface";
import { cn } from "~/lib/utils";

/**
 * Placeholder for a chart example. The old Catalog docs rendered these from
 * ```project fences that pointed at an HTML entry point plus its CSV data; how
 * the new site runs them is still open, so for now we show what the example is
 * and where its sources live.
 */
export type ExampleProps = {
  /** The project name from the old ```project fence, e.g. "line-chart-basic". */
  readonly name: string;
  /** Example entry point, relative to apps/docs/docs. */
  readonly source?: string;
  /** Data files the example loads, relative to apps/docs/docs. */
  readonly data?: string | ReadonlyArray<string>;
  readonly className?: string;
};

export function Example({ name, source, data, className }: ExampleProps) {
  const dataFiles = data === undefined ? [] : Array.isArray(data) ? data : [data as string];
  return (
    <figure
      className={cn(
        "my-6 rounded-lg border border-dashed bg-muted/30 px-5 py-6 text-center",
        className,
      )}
    >
      <div className="font-mono text-sm text-foreground">{name}</div>
      <figcaption className={typefaceBody("mt-2 text-muted-foreground text-sm")}>
        Live example coming soon.
        {source === undefined ? null : (
          <>
            {" "}
            Source: <code>{source}</code>
          </>
        )}
        {dataFiles.length === 0 ? null : (
          <>
            {" "}
            Data:{" "}
            {dataFiles.map((file) => (
              <code key={file}>{file}</code>
            ))}
          </>
        )}
      </figcaption>
    </figure>
  );
}

/**
 * Placeholder for the small runnable HTML snippets the old colors and tooltips
 * guides embedded with ```html|plain,run-script. The snippet is shown as-is
 * until the new site can execute it.
 */
export function Demo({ children }: { readonly children?: React.ReactNode }) {
  return (
    <div className="my-6 rounded-lg border border-dashed bg-muted/30 p-4">
      <div className={typefaceBody("mb-2 text-muted-foreground text-sm")}>
        Live demo coming soon — the snippet below is what it renders.
      </div>
      {children}
    </div>
  );
}

/** The old docs' ```hint fences: an aside that is not a quotation. */
export function Callout({ children }: { readonly children?: React.ReactNode }) {
  return (
    <aside className="my-6 rounded-r-lg border-l-2 border-primary/50 bg-muted/50 px-5 py-4 [&>:first-child]:mt-0">
      {children}
    </aside>
  );
}
