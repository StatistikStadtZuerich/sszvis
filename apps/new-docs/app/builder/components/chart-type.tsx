import {
  ChartAreaIcon,
  ChartColumnStackedIcon,
  ChartBarIcon,
  ChartColumnIcon,
  ChartLineIcon,
  ChartScatterIcon as UnknownChartIcon,
  type LucideIcon,
} from "lucide-react";
import { useId } from "react";
import { Field, FieldDescription, FieldError } from "~/components/ui/field";
import { ToggleButton, ToggleButtonGroup } from "~/components/ui/toggle-button-group";
import type { Table } from "../domain/csv";
import { unmetRoles } from "../domain/initial-spec";
import type { RecipeKey, RecipeSummary } from "../domain/spec";

const ICONS: ReadonlyMap<string, LucideIcon> = new Map([
  ["bar-chart-vertical", ChartColumnIcon],
  ["bar-chart-horizontal", ChartBarIcon],
  ["bar-chart-vertical-stacked", ChartColumnStackedIcon],
  ["line-chart", ChartLineIcon],
  ["area-chart-stacked", ChartAreaIcon],
]);

const KIND_LABEL = { category: "text", number: "number", date: "date" } as const;

const sentence = new Intl.ListFormat("en", { style: "long", type: "conjunction" });

const needs = (roles: ReturnType<typeof unmetRoles>) =>
  sentence.format(roles.map((role) => `a ${KIND_LABEL[role.kind]} column`));

export const ChartType = ({
  recipes,
  table,
  value,
  onChange,
}: {
  readonly recipes: readonly RecipeSummary[];
  readonly table: Table;
  readonly value: RecipeKey;
  readonly onChange: (key: RecipeKey) => void;
}) => {
  const id = useId();
  const unmet = new Map(recipes.map((recipe) => [recipe.key, unmetRoles(recipe, table)]));
  const selected = unmet.get(value) ?? [];
  const others = recipes.filter(
    (recipe) => recipe.key !== value && (unmet.get(recipe.key)?.length ?? 0) > 0,
  );
  const reasonId = (key: RecipeKey) => `${id}-${key}`;

  return (
    <Field>
      <ToggleButtonGroup
        aria-label="Chart type"
        className="grid w-full grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))]"
        value={value}
        onValueChange={onChange}
      >
        {recipes.map((recipe) => {
          const Icon = ICONS.get(recipe.key) ?? UnknownChartIcon;
          const missing = unmet.get(recipe.key) ?? [];
          return (
            <ToggleButton
              key={recipe.key}
              value={recipe.key}
              size="lg"
              aria-invalid={missing.length > 0 || undefined}
              aria-describedby={missing.length > 0 ? reasonId(recipe.key) : undefined}
              className="flex w-full flex-col items-center gap-1.5 rounded-md border border-transparent bg-muted/40 py-3 hover:bg-muted/70 data-pressed:border-primary/40 data-pressed:bg-muted"
            >
              <Icon />
              {recipe.label}
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>
      {selected.length > 0 && (
        <FieldError id={reasonId(value)}>
          This chart needs {needs(selected)}.{" "}
          {selected.length === 1 ? "Add it to the table" : "Add them to the table"}, or choose a
          chart type that fits your data.
        </FieldError>
      )}
      {others.map((recipe) => (
        <FieldDescription key={recipe.key} id={reasonId(recipe.key)}>
          {recipe.label} needs {needs(unmet.get(recipe.key) ?? [])}.
        </FieldDescription>
      ))}
    </Field>
  );
};
