import { typefaceBadge } from "~/components/tokens/typeface";
import { FieldDescription, FieldLegend, FieldSet } from "~/components/ui/field";

export const Step = ({
  n,
  title,
  columns = false,
  description,
  children,
}: {
  readonly n: number;
  readonly title: string;
  readonly columns?: boolean;
  readonly description?: string;
  readonly children: React.ReactNode;
}) => (
  <div className="border-t pt-7 first:border-t-0 first:pt-0">
    <FieldSet className="min-w-0">
      <FieldLegend variant="legend" className="mb-3">
        <h2 className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
          <span
            aria-hidden
            className={typefaceBadge(
              "grid size-5 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground",
            )}
          >
            {n}
          </span>
          <span className="sr-only">Step {n}: </span>
          {title}
        </h2>
      </FieldLegend>
      {description !== undefined && (
        <FieldDescription className="-mt-1">{description}</FieldDescription>
      )}
      {columns ? (
        <div className="grid gap-x-6 gap-y-4 @2xl/page:grid-cols-2 @4xl/page:grid-cols-1 *:data-[slot=field-description]:col-span-full *:data-[slot=field-separator]:col-span-full">
          {children}
        </div>
      ) : (
        children
      )}
    </FieldSet>
  </div>
);
