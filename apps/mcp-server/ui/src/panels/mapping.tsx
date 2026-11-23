import {
  bearsRole,
  columnKinds,
  fitRank,
  hasValues,
  REQUIRED,
  type Table,
} from "@sszvis/chart-builder/csv";
import { unmappedRoles } from "@sszvis/chart-builder/initial-spec";
import { unkeyedValues } from "@sszvis/chart-builder/palettes";
import {
  ColumnName,
  KIND_LABEL,
  optionValue,
  type RecipeSummary,
  type Spec,
} from "@sszvis/chart-builder/spec";
import { Field, FieldError, FieldLabel } from "../components/ui/field.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select.tsx";
import { typefaceCaption } from "../lib/typeface.ts";
import { ChoiceSelect } from "./choice-select.tsx";

const listing = new Intl.ListFormat("en", { style: "long", type: "conjunction" });

export const Mapping = ({
  recipe,
  spec,
  table,
  onChange,
}: {
  readonly recipe: RecipeSummary;
  readonly spec: Spec;
  readonly table: Table;
  readonly onChange: (next: Spec) => void;
}) => {
  const kinds = columnKinds(table, spec.kinds);
  const missing = new Set(unmappedRoles(recipe, spec));

  return (
    <>
      {recipe.options
        .filter((option) => option.choices !== undefined)
        .map((option) => {
          const id = `option-${option.key}`;
          const value = optionValue(recipe.options, spec, option.key);
          const superseded =
            option.supersededBy !== undefined && spec.features.includes(option.supersededBy)
              ? recipe.features.find((feature) => feature.key === option.supersededBy)
              : undefined;
          const unkeyed = unkeyedValues(
            (option.choices ?? []).find((choice) => choice.value === value),
            table,
            option.keyedTo === undefined ? undefined : spec.fields[option.keyedTo],
          );
          /* Only a warning, as for the roles below: the option's own hint is left out. */
          const caption =
            superseded !== undefined
              ? `${superseded.label} is on, and it decides this instead.`
              : unkeyed.length > 0
                ? `This scale does not colour ${listing.format(unkeyed)}, so ${
                    unkeyed.length === 1 ? "that value takes" : "those values take"
                  } its first colour and the legend names its own values instead.`
                : "";

          return (
            <Field key={option.key}>
              <FieldLabel htmlFor={id}>{option.label}</FieldLabel>
              <ChoiceSelect
                id={id}
                value={value}
                choices={option.choices ?? []}
                onChange={(next) =>
                  onChange({ ...spec, options: { ...spec.options, [option.key]: next } })
                }
              />
              {caption !== "" && <p className={typefaceCaption()}>{caption}</p>}
            </Field>
          );
        })}

      {recipe.roles.map((role) => {
        const items = [
          { value: null, label: role.optional === true ? "None" : "Choose a column…" },
          ...table.columns.map((column) => ({
            value: column,
            label:
              fitRank(kinds.get(column) ?? "nominal", role.kind) === 0
                ? column
                : `${column} (looks ${KIND_LABEL[kinds.get(column) ?? "nominal"]})`,
          })),
        ];
        const id = `mapping-${role.key}`;
        const column = spec.fields[role.key];
        const unreadable =
          column !== undefined && column !== "" && !bearsRole(table, column, role.kind);

        return (
          <Field key={role.key}>
            <FieldLabel htmlFor={id}>{role.label}</FieldLabel>
            <Select
              value={spec.fields[role.key] || null}
              onValueChange={(next) =>
                onChange({
                  ...spec,
                  fields: { ...spec.fields, [role.key]: ColumnName.make(next ?? "") },
                  chosen: spec.chosen.includes(role.key) ? spec.chosen : [...spec.chosen, role.key],
                })
              }
              items={items}
            >
              <SelectTrigger
                id={id}
                className="w-full"
                aria-invalid={missing.has(role.key) || unreadable || undefined}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                {items.map((item) => (
                  <SelectItem key={item.value ?? ""} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {unreadable ? (
              <FieldError>
                {hasValues(table, column)
                  ? `The values in ${column} are not all ${KIND_LABEL[REQUIRED[role.kind]]}s, so the chart will drop the rows it cannot read.`
                  : `${column} is empty, so the chart will have nothing to draw.`}
              </FieldError>
            ) : // <FieldDescription>{role.hint}</FieldDescription>
            null}
          </Field>
        );
      })}
    </>
  );
};
