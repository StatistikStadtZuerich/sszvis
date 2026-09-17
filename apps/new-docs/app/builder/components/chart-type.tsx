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
import { Fragment } from "react";
import { Field, FieldError } from "~/components/ui/field";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { ToggleButton, ToggleButtonGroup } from "~/components/ui/toggle-button-group";
import type { Table } from "../domain/csv";
import { unmetRoles } from "../domain/initial-spec";
import type { ColumnKinds, RecipeKey, RecipeSummary } from "../domain/spec";

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

const KIND_LABEL = { category: "text", number: "number", date: "date" } as const;

const sentence = new Intl.ListFormat("en", { style: "long", type: "conjunction" });

/* Small counts read as words. A chart wanting more than four columns of one kind
   does not exist, but a number is a better answer than nothing if one ever does. */
const COUNT = ["", "a", "two", "three", "four"] as const;

/*
 * Counted by kind rather than listed one role at a time: a map wants two number
 * columns, and naming its roles separately said it needed "a number column and a
 * number column".
 */
const needs = (roles: ReturnType<typeof unmetRoles>) => {
  const counted = new Map<keyof typeof KIND_LABEL, number>();
  for (const role of roles) counted.set(role.kind, (counted.get(role.kind) ?? 0) + 1);
  return sentence.format(
    [...counted].map(([kind, n]) =>
      n === 1 ? `a ${KIND_LABEL[kind]} column` : `${COUNT[n] ?? n} ${KIND_LABEL[kind]} columns`,
    ),
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
  /** The user's pinned kinds, so a pin can make a chart type fit or stop fitting. */
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
        /* The guard is here rather than on each button so a click and a keyboard
           activation are refused by the same rule. */
        onValueChange={(key) => {
          if ((unmet.get(key)?.length ?? 0) === 0) onChange(key);
        }}
      >
        {recipes.map((recipe) => {
          const Icon = ICONS.get(recipe.key) ?? UnknownChartIcon;
          const missing = unmet.get(recipe.key) ?? [];
          /* The chart in front of the user is never made unavailable: it is already
             chosen, and saying so is the selected-chart error below. */
          const unavailable = missing.length > 0 && recipe.key !== value;
          const button = (
            <ToggleButton
              value={recipe.key}
              size="lg"
              /* `aria-disabled` rather than `disabled`: a disabled button leaves the
                 tab order and takes the explanation with it, leaving a keyboard user
                 with a control they cannot reach and no reason for it. */
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
          if (!unavailable) return <Fragment key={recipe.key}>{button}</Fragment>;
          return (
            <Tooltip key={recipe.key}>
              <TooltipTrigger render={button} />
              <TooltipContent id={reasonId(recipe.key)} side="top">
                Needs {needs(missing)}
              </TooltipContent>
            </Tooltip>
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
    </Field>
  );
};
