import { XIcon } from "lucide-react";
import { useId } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { typefaceCaption } from "~/components/tokens/typeface";
import { isValidPosition } from "../domain/annotations";
import { RoleKey, type Annotation, type AnnotationAxis, type RecipeSummary } from "../domain/spec";

const PLACEHOLDER = { number: "0", date: "01.01.2020", category: "" } as const;

/** What a position on this axis has to look like, said in full rather than hinted at by a placeholder. */
const FORMAT = {
  number: "A number, like 12000.",
  date: "A date written 31.12.2024.",
  category: "",
} as const;

const Labelled = ({
  htmlFor,
  label,
  className,
  children,
}: {
  readonly htmlFor: string;
  readonly label: string;
  readonly className?: string;
  readonly children: React.ReactNode;
}) => (
  <div className={className}>
    <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
    {children}
  </div>
);

export const Annotations = ({
  recipe,
  value,
  onChange,
}: {
  readonly recipe: RecipeSummary;
  readonly value: readonly Annotation[];
  readonly onChange: (next: readonly Annotation[]) => void;
}) => {
  const id = useId();
  const axes = recipe.annotationAxes;
  const first = axes[0];
  const numberAxis = axes.find((axis) => axis.kind === "number");
  if (first === undefined) return null;

  /* Keyed by role, as the spec is; `axis.label` still names it in the chart's own terms. */
  const axisOf = (role: RoleKey): AnnotationAxis =>
    axes.find((candidate) => candidate.role === role) ?? first;
  const items = axes.map((axis) => ({ value: axis.role, label: axis.label }));

  const add = (annotation: Annotation) => onChange([...value, annotation]);
  const replace = (index: number, annotation: Annotation) =>
    onChange(value.map((entry, at) => (at === index ? annotation : entry)));
  const remove = (index: number) => onChange(value.filter((_, at) => at !== index));

  return (
    <FieldGroup>
      <div>
        <FieldTitle>Annotations</FieldTitle>
        <FieldDescription>
          Reference lines at a fixed value, or at the mean of the data.
        </FieldDescription>
      </div>

      {value.map((annotation, index) => {
        const axis = axisOf(annotation.role);
        const rowId = `${id}-${index}`;
        const typed = annotation.at.kind === "value" ? annotation.at.value : null;
        const wrong = typed !== null && typed !== "" && !isValidPosition(axis.kind, annotation.at);
        const hintId = `${rowId}-hint`;
        const hint =
          typed === ""
            ? {
                text: "Without a position this line is not drawn.",
                field: "at" as const,
              }
            : wrong
              ? { text: FORMAT[axis.kind], field: "at" as const }
              : annotation.label === ""
                ? {
                    text: "Without a label the chart shows the position itself.",
                    field: "label" as const,
                  }
                : null;
        const describes = (field: "at" | "label") =>
          hint !== null && hint.text !== "" && hint.field === field ? hintId : undefined;
        return (
          <div key={rowId} className="space-y-1">
            <Field orientation="horizontal" className="flex-wrap items-end gap-x-2">
              <Labelled htmlFor={`${rowId}-axis`} label="Axis" className="shrink-0">
                <Select
                  value={annotation.role}
                  onValueChange={(next) => {
                    if (next === null) return;
                    const target = axisOf(RoleKey.make(next));
                    const at =
                      annotation.at.kind === "mean" && target.kind !== "number"
                        ? { kind: "value" as const, value: "" }
                        : annotation.at;
                    replace(index, { ...annotation, role: target.role, at });
                  }}
                  items={items}
                >
                  <SelectTrigger id={`${rowId}-axis`} size="sm" className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {items.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Labelled>

              {axis.kind === "number" && (
                <FieldLabel htmlFor={`${rowId}-mean`} className="shrink-0 pb-2">
                  <Checkbox
                    id={`${rowId}-mean`}
                    checked={annotation.at.kind === "mean"}
                    onCheckedChange={(checked) =>
                      replace(index, {
                        ...annotation,
                        at: checked ? { kind: "mean" } : { kind: "value", value: "" },
                      })
                    }
                  />
                  At the mean
                </FieldLabel>
              )}

              {annotation.at.kind === "value" && (
                <Labelled htmlFor={`${rowId}-at`} label="Position" className="min-w-28 flex-1">
                  <Input
                    id={`${rowId}-at`}
                    value={annotation.at.value}
                    placeholder={PLACEHOLDER[axis.kind]}
                    aria-invalid={wrong || undefined}
                    aria-describedby={describes("at")}
                    onChange={(event) =>
                      replace(index, {
                        ...annotation,
                        at: { kind: "value", value: event.target.value },
                      })
                    }
                  />
                </Labelled>
              )}

              <Labelled htmlFor={`${rowId}-label`} label="Label" className="min-w-28 flex-1">
                <Input
                  id={`${rowId}-label`}
                  value={annotation.label}
                  placeholder="Zielwert"
                  aria-describedby={describes("label")}
                  onChange={(event) => replace(index, { ...annotation, label: event.target.value })}
                />
              </Labelled>

              <Button
                variant="ghost"
                size="icon-xs"
                className="mb-1 ml-auto"
                aria-label={`Remove reference line ${index + 1}`}
                onClick={() => remove(index)}
              >
                <XIcon />
              </Button>
            </Field>
            {hint !== null && hint.text !== "" && (
              <p id={hintId} className={typefaceCaption()}>
                {hint.text}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2">
        <Button
          size="xs"
          variant="outline"
          onClick={() =>
            add({
              kind: "reference-line",
              role: first.role,
              at: { kind: "value", value: "" },
              label: "",
            })
          }
        >
          Add reference line
        </Button>
        {numberAxis !== undefined && (
          <Button
            size="xs"
            variant="outline"
            onClick={() =>
              add({
                kind: "reference-line",
                role: numberAxis.role,
                at: { kind: "mean" },
                label: "",
              })
            }
          >
            Add mean line
          </Button>
        )}
      </div>
    </FieldGroup>
  );
};
