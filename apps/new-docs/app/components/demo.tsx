import type { ReactNode } from "react";
import { typefaceMeta } from "~/components/tokens/typeface";

/**
 * Placeholder for the small runnable HTML snippets the old colors and tooltips
 * guides embedded with ```html|plain,run-script. Unlike a chart example these
 * are a handful of lines that render swatches inline, so they are not worth a
 * generated page of their own; the snippet is shown until the new site can run
 * them in place.
 */
export const Demo = ({ children }: { readonly children?: ReactNode }) => (
  <div className="my-6 rounded-lg border border-dashed bg-muted/30 p-4">
    <div className={typefaceMeta("mb-2 text-muted-foreground")}>
      Live demo coming soon — the snippet below is what it renders.
    </div>
    {children}
  </div>
);
