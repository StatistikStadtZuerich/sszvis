import { FileCode2, LoaderCircle, Table2 } from "lucide-react";
import { CopyButton } from "~/components/copy-button";
import { typefaceCode, typefaceMeta } from "~/components/tokens/typeface";
import { JavaScriptIcon, TypeScriptIcon } from "~/components/ui/icons";
import { ToggleButton } from "~/components/ui/toggle-button-group";
import type { Source } from "~/lib/source";
import { cn } from "~/lib/utils";

export const VIEWS = {
  ts: { label: "TypeScript", filename: "chart.ts", icon: TypeScriptIcon },
  js: { label: "JavaScript", filename: "chart.js", icon: JavaScriptIcon },
  html: { label: "HTML", filename: "index.html", icon: FileCode2 },
  csv: { label: "Data", filename: "data.csv", icon: Table2 },
} as const;

export type View = keyof typeof VIEWS;

export const isView = (view: string): view is View => view in VIEWS;

export const ViewButton = ({ view }: { readonly view: string }) => {
  const meta = isView(view) ? VIEWS[view] : undefined;
  const Icon = meta?.icon;
  return (
    <ToggleButton value={view} title={meta ? `${meta.label} — ${meta.filename}` : view}>
      {Icon ? <Icon /> : null}
      <span className="hidden @[26rem]:inline">{meta?.label ?? view}</span>
    </ToggleButton>
  );
};

export const SourceView = ({
  source,
  className,
  copyable = true,
}: {
  readonly source: Source | undefined;
  readonly className?: string;
  readonly copyable?: boolean;
}) => (
  <div className={cn("group relative flex min-w-0 flex-col", className)}>
    {source === undefined ? (
      <div
        className={typefaceMeta("flex items-center gap-2 bg-code-block p-4 text-muted-foreground")}
        role="status"
      >
        <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
        Loading the source…
      </div>
    ) : source.html === null ? (
      <pre className={typefaceCode("min-h-0 flex-1 overflow-auto bg-code-block p-4")}>
        {source.raw}
      </pre>
    ) : (
      <div
        className={typefaceCode(
          "min-h-0 flex-1 overflow-auto bg-code-block p-4 [&_pre]:bg-transparent!",
        )}
        dangerouslySetInnerHTML={{ __html: source.html }}
      />
    )}
    {source !== undefined && copyable && (
      <CopyButton
        getValue={() => source.raw}
        className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
      />
    )}
  </div>
);
