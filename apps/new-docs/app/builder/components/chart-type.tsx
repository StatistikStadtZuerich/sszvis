import {
  ChartAreaIcon,
  ChartBarIcon,
  ChartBarStackedIcon,
  ChartColumnBigIcon,
  ChartColumnIcon,
  ChartColumnStackedIcon,
  ChartLineIcon,
  MapIcon,
  type LucideIcon,
  ChartScatterIcon as UnknownChartIcon,
} from "lucide-react";
import { useId } from "react";
import { Field, FieldError } from "~/components/ui/field";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { ToggleButton, ToggleButtonGroup } from "~/components/ui/toggle-button-group";
import type { Table } from "../domain/csv";
import { unmetRoles } from "../domain/initial-spec";
import { REQUIRED } from "../domain/csv";
import {
  KIND_LABEL,
  type ColumnKinds,
  type RecipeKey,
  type RecipeSummary,
  type RoleKind,
} from "../domain/spec";

const ICONS: ReadonlyMap<string, LucideIcon> = new Map([
  ["bar-chart-vertical", ChartColumnIcon],
  ["bar-chart-horizontal", ChartBarIcon],
  ["bar-chart-vertical-stacked", ChartColumnStackedIcon],
  ["bar-chart-horizontal-stacked", ChartBarStackedIcon],
  ["bar-chart-vertical-grouped", ChartColumnBigIcon],
  ["line-chart", ChartLineIcon],
  ["area-chart-stacked", ChartAreaIcon],
  ["map-choropleth", MapIcon],
]);

const sentence = new Intl.ListFormat("en", { style: "long", type: "conjunction" });

const COUNT = ["", "", "two", "three", "four"] as const;

const needs = (roles: ReturnType<typeof unmetRoles>) => {
  const counted = new Map<RoleKind, number>();
  for (const role of roles) counted.set(role.kind, (counted.get(role.kind) ?? 0) + 1);
  return sentence.format(
    [...counted].map(([kind, n]) => {
      const word = KIND_LABEL[REQUIRED[kind]];
      return n === 1 ? `a ${word} column` : `${COUNT[n] ?? n} ${word} columns`;
    }),
  );
};

export const ChartType = ({
  recipes,
  table,
  kinds,
  value,
  onChange,
}: {
  readonly recipes: readonly RecipeSummary[];
  readonly table: Table;
  readonly kinds: ColumnKinds;
  readonly value: RecipeKey;
  readonly onChange: (key: RecipeKey) => void;
}) => {
  const id = useId();
  const unmet = new Map(recipes.map((recipe) => [recipe.key, unmetRoles(recipe, table, kinds)]));
  const selected = unmet.get(value) ?? [];
  const reasonId = (key: RecipeKey) => `${id}-${key}`;

  return (
    <Field>
      <ToggleButtonGroup
        aria-label="Chart type"
        className="grid w-full grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))]"
        value={value}
        onValueChange={(key) => {
          if ((unmet.get(key)?.length ?? 0) === 0) onChange(key);
        }}
      >
        {recipes.map((recipe) => {
          const Icon = ICONS.get(recipe.key) ?? UnknownChartIcon;
          const missing = unmet.get(recipe.key) ?? [];
          const unavailable = missing.length > 0 && recipe.key !== value;
          const button = (
            <ToggleButton
              value={recipe.key}
              size="lg"
              aria-disabled={unavailable || undefined}
              aria-invalid={missing.length > 0 || undefined}
              aria-describedby={unavailable ? reasonId(recipe.key) : undefined}
              className={cn(
                "flex w-full flex-col items-center gap-1.5 rounded-md border border-transparent bg-muted/40 py-3 data-pressed:border-primary/40 data-pressed:bg-muted",
                unavailable ? "cursor-not-allowed opacity-45" : "hover:bg-muted/70",
              )}
            >
              <Icon />
              {recipe.label}
            </ToggleButton>
          );
          return (
            <Tooltip key={recipe.key}>
              <TooltipTrigger render={button} />
              {unavailable && <TooltipContent side="top">Needs {needs(missing)}</TooltipContent>}
            </Tooltip>
          );
        })}
      </ToggleButtonGroup>
      <div className="sr-only">
        {recipes
          .filter((recipe) => recipe.key !== value && (unmet.get(recipe.key)?.length ?? 0) > 0)
          .map((recipe) => (
            <p key={recipe.key} id={reasonId(recipe.key)}>
              {recipe.label} needs {needs(unmet.get(recipe.key) ?? [])}.
            </p>
          ))}
      </div>
      {selected.length > 0 && (
        <FieldError id={reasonId(value)}>
          This chart needs {needs(selected)}.{" "}
          {selected.length === 1 ? "Add it to the table" : "Add them to the table"}, or choose a
          chart type that fits your data.
        </FieldError>
      )}
    </Field>
  );
};
