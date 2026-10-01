import { XIcon } from "lucide-react";
import { useId } from "react";
import { Button } from "~/components/ui/button";
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
import { CROWDED, filterCandidates } from "../domain/controls";
import { columnKinds, distinctValues, type Table } from "../domain/csv";
import { ColumnName, type Spec } from "../domain/spec";

/** Why a table has no column to filter on, said in the terms the table editor uses. */
const NO_CANDIDATES =
  "Every column is already drawn by the chart, or holds a date or a single value. A filter needs a spare column with at least two values in it.";

export const Controls = ({
  spec,
  table,
  onChange,
}: {
  readonly spec: Spec;
  readonly table: Table;
  readonly onChange: (next: Spec["control"]) => void;
}) => {
  const id = useId();
  const control = spec.control;
  const candidates = filterCandidates(spec, table);
  const first = candidates[0];

  /*
   * The chosen column stays on the list even after it stops qualifying, so that a control
   * the chart can no longer draw is visible here rather than silently absent.
   */
  const items = [
    ...candidates,
    ...(control !== null && !candidates.includes(control.column) ? [control.column] : []),
  ].map((column) => ({ value: column, label: column }));

  const values = control === null ? [] : distinctValues(table, control.column);
  const gone = control !== null && !table.columns.includes(control.column);
  /* The two other ways a column stops qualifying, in the order `filterCandidates` tests. */
  const drawn = control !== null && Object.values(spec.fields).includes(control.column);
  const dated =
    control !== null && columnKinds(table, spec.kinds).get(control.column) === "temporal";
  const hintId = `${id}-hint`;
  const hint = gone
    ? `${control.column} is no longer a column in this table, so the chart is drawn without a filter.`
    : drawn
      ? `${control.column} is already drawn by the chart, so the chart is drawn without a filter.`
      : dated
        ? `${control.column} holds dates, so the chart is drawn without a filter.`
        : values.length < 2
          ? "A column needs at least two values to offer a choice, so the chart is drawn without a filter."
          : values.length > CROWDED
            ? `${values.length} values are more than a row of buttons holds, so the chart shows a menu instead.`
            : null;

  return (
    <FieldGroup>
      <div>
        <FieldTitle>Filter</FieldTitle>
        <FieldDescription>
          A control above the chart that narrows it to one value of a column it does not already
          draw. Buttons where they fit, a menu where they do not.
        </FieldDescription>
      </div>

      {control !== null && (
        <div className="space-y-1">
          <Field orientation="horizontal" className="flex-wrap items-end gap-x-2">
            <div className="min-w-28 flex-1">
              <FieldLabel htmlFor={`${id}-column`}>Column</FieldLabel>
              <Select
                value={control.column}
                onValueChange={(next) => {
                  if (next === null) return;
                  onChange({ ...control, column: ColumnName.make(next) });
                }}
                items={items}
              >
                <SelectTrigger
                  id={`${id}-column`}
                  className="w-full"
                  aria-invalid={gone || drawn || dated || undefined}
                  aria-describedby={hint === null ? undefined : hintId}
                >
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
            </div>

            <div className="min-w-28 flex-1">
              <FieldLabel htmlFor={`${id}-label`}>Label</FieldLabel>
              <Input
                id={`${id}-label`}
                value={control.label}
                placeholder={control.column}
                onChange={(event) => onChange({ ...control, label: event.target.value })}
              />
            </div>

            <Button
              variant="ghost"
              size="icon-xs"
              className="mb-1 ml-auto"
              aria-label="Remove filter"
              onClick={() => onChange(null)}
            >
              <XIcon />
            </Button>
          </Field>
          {hint !== null && (
            <p id={hintId} className={typefaceCaption()}>
              {hint}
            </p>
          )}
        </div>
      )}

      {control === null && (
        <div className="space-y-1">
          <Button
            size="xs"
            variant="outline"
            disabled={first === undefined}
            className="w-fit"
            onClick={() => {
              if (first === undefined) return;
              /* The column names the control well enough to start with; the label is the
                 author's to change and only has to be typed when it should not. */
              onChange({ kind: "filter", column: first, label: "" });
            }}
          >
            Add filter
          </Button>
          {first === undefined && <p className={typefaceCaption()}>{NO_CANDIDATES}</p>}
        </div>
      )}
    </FieldGroup>
  );
};
