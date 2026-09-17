import { useAtomValue } from "@effect/atom-react";
import { useSelector } from "@tanstack/react-form";
import { AsyncResult } from "effect/unstable/reactivity";
import { Fragment, useEffect, useMemo, useState } from "react";
import { typefaceCaption, typefaceHeadingSmall } from "~/components/tokens/typeface";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSeparator,
  FieldTitle,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import { recipesAtom, useBuilderCompile, WORKER_STOPPED_MESSAGE } from "./builder-client";
import { recipeOf, useBuilderForm } from "./builder-form";
import { Annotations } from "./components/annotations";
import { ChartType } from "./components/chart-type";
import { CodePanel } from "./components/code-panel";
import { Notice } from "./components/notice";
import { Preview, type PreviewStatus, roleList } from "./components/preview";
import { Step } from "./components/step";
import { TableEditor } from "./components/table-editor";
import { TooltipFields } from "./components/tooltip-fields";
import {
  bearsRole,
  columnKinds,
  fitRank,
  hasValues,
  parse,
  REQUIRED,
  serialize,
} from "./domain/csv";
import { applySample, switchRecipe, unmappedRoles } from "./domain/initial-spec";
import { isPristine, type Sample, samples } from "./domain/samples";
import { KIND_LABEL, optionValue, type RecipeSummary, TITLE } from "./domain/spec";

export const clientLoader = () => null;
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return <StartupNotice title="Starting the chart builder…" />;
}

export default function BuilderPage() {
  const recipes = useAtomValue(recipesAtom);

  return AsyncResult.builder(recipes)
    .onFailure(() => (
      <StartupNotice
        title="The chart builder could not start"
        body={AsyncResult.builder(recipes)
          .onErrorTag("RpcClientError", () => WORKER_STOPPED_MESSAGE)
          .onDefect(() => WORKER_STOPPED_MESSAGE)
          .orNull()}
      />
    ))
    .onInitial(() => <StartupNotice title="Starting the chart builder…" />)
    .onSuccess((list) => {
      const first = list[0];
      if (first === undefined) return <StartupNotice title="No chart types are available." />;
      return <Builder recipes={list} first={first} />;
    })
    .exhaustive();
}

const StartupNotice = (props: { readonly title: string; readonly body?: string | null }) => (
  <div className="mx-auto max-w-[70ch] p-6">
    <Notice {...props} />
  </div>
);

/**
 * True once `active` has held for `delay`, and false the moment it drops. A
 * compile that finishes inside the debounce window never reaches the screen,
 * so ordinary typing does not flicker the panel or its buttons.
 */
const useHeldFor = (active: boolean, delay: number) => {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) {
      setShown(false);
      return;
    }
    const timer = window.setTimeout(() => setShown(true), delay);
    return () => window.clearTimeout(timer);
  }, [active, delay]);
  return shown;
};

const Builder = ({
  recipes,
  first,
}: {
  readonly recipes: readonly RecipeSummary[];
  readonly first: RecipeSummary;
}) => {
  const form = useBuilderForm(recipes, first);
  const spec = useSelector(form.store, (state) => state.values);
  const { settled, error, freshness } = useBuilderCompile(form);
  const recipe = recipeOf(recipes, spec) ?? first;

  const table = useMemo(() => parse(spec.csv), [spec.csv]);
  const kinds = useMemo(() => columnKinds(table, spec.kinds), [table, spec.kinds]);
  const missing = new Set(unmappedRoles(recipe, spec));
  const missingRoles = recipe.roles.filter((role) => missing.has(role.key));

  /** A sample waiting on the user, because loading it would discard the table they built. */
  const [pendingSample, setPendingSample] = useState<Sample | null>(null);
  const load = (sample: Sample) => {
    setPendingSample(null);
    form.reset(applySample(spec, recipe, sample.csv), { keepDefaultValues: true });
  };

  const compiling = useHeldFor(freshness === "compiling", 350);

  const settledRecipe = settled === undefined ? undefined : recipeOf(recipes, settled.spec);

  const status: PreviewStatus =
    error !== null
      ? { kind: "error", message: error }
      : missingRoles.length > 0
        ? { kind: "incomplete", roles: missingRoles }
        : freshness === "stale"
          ? { kind: "stale" }
          : { kind: "ready" };

  const note =
    error !== null
      ? "Showing the last chart that compiled."
      : missingRoles.length > 0
        ? `Showing the last chart that compiled. Step 3 still needs a column for ${roleList(missingRoles)}.`
        : freshness === "stale"
          ? "Showing the last chart that compiled."
          : compiling
            ? "Rebuilding from your changes…"
            : null;

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <div className="grid grid-cols-1 items-start gap-8 @4xl/page:grid-cols-[minmax(340px,32rem)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-8">
          <header className="max-w-[60ch] space-y-1">
            <h1 className={typefaceHeadingSmall()}>Chart builder</h1>
            <p className={typefaceCaption()}>
              Paste a table, map its columns, and take the code away. The preview runs the exported
              code, unchanged.
            </p>
          </header>

          <Step n={1} title="Data">
            <TableEditor
              table={table}
              kinds={spec.kinds}
              onChange={(next) => form.setFieldValue("csv", serialize(next))}
              onKindsChange={(next) => form.setFieldValue("kinds", next)}
              actions={
                pendingSample !== null ? (
                  <ConfirmSample
                    sample={pendingSample}
                    onConfirm={() => load(pendingSample)}
                    onCancel={() => setPendingSample(null)}
                  />
                ) : (
                  <Select
                    value={samples.find((entry) => entry.csv === spec.csv)?.key ?? null}
                    onValueChange={(key) => {
                      const sample = samples.find((entry) => entry.key === key);
                      if (sample === undefined || sample.csv === spec.csv) return;
                      if (isPristine(spec.csv)) load(sample);
                      else setPendingSample(sample);
                    }}
                    items={[
                      { value: null, label: "Sample data…" },
                      ...samples.map((entry) => ({ value: entry.key, label: entry.label })),
                    ]}
                  >
                    <SelectTrigger
                      size="sm"
                      aria-label="Replace the table with sample data"
                      className="ml-auto"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {samples.map((entry) => (
                        <SelectItem key={entry.key} value={entry.key}>
                          {entry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              }
            />
          </Step>

          <Step n={2} title="Chart type">
            <ChartType
              recipes={recipes}
              table={table}
              kinds={spec.kinds}
              value={recipe.key}
              onChange={(key) => {
                const next = recipes.find((entry) => entry.key === key);
                if (next !== undefined) {
                  form.reset(switchRecipe(spec, recipe, next), {
                    keepDefaultValues: true,
                  });
                }
              }}
            />
          </Step>

          <Step n={3} title="Mapping" columns>
            {recipe.options
              .filter((option) => option.choices !== undefined)
              .map((option) => {
                const id = `option-${option.key}`;
                return (
                  <Field key={option.key}>
                    <FieldLabel htmlFor={id}>{option.label}</FieldLabel>
                    <Select
                      value={optionValue(recipe.options, spec, option.key)}
                      onValueChange={(next) =>
                        form.setFieldValue("options", {
                          ...spec.options,
                          [option.key]: next ?? "",
                        })
                      }
                      items={(option.choices ?? []).map((choice) => ({
                        value: choice.value,
                        label: choice.label,
                      }))}
                    >
                      <SelectTrigger id={id}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start">
                        {(option.choices ?? []).map((choice) => (
                          <SelectItem key={choice.value} value={choice.value}>
                            {choice.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                );
              })}
            {recipe.roles.map((role) => {
              const items = [
                {
                  value: null,
                  label: role.optional === true ? "None" : "Choose a column…",
                },
                ...table.columns.map((column) => ({
                  value: column,
                  /* A remark only where the column does not fill the role outright. */
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
                    onValueChange={(next) => {
                      form.setFieldValue("fields", {
                        ...spec.fields,
                        [role.key]: next ?? "",
                      });
                      /* Picking a column here is the difference between a binding
                         the user means and one the search guessed, and only the
                         first is carried when the chart type changes. */
                      if (!spec.chosen.includes(role.key)) {
                        form.setFieldValue("chosen", [...spec.chosen, role.key]);
                      }
                    }}
                    items={items}
                  >
                    <SelectTrigger
                      id={id}
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
                  ) : (
                    role.hint !== undefined && <FieldDescription>{role.hint}</FieldDescription>
                  )}
                </Field>
              );
            })}
          </Step>

          <Step
            n={4}
            title="Chart features"
            description="Parts of the chart you can switch on and off."
          >
            {recipe.features
              .filter((feature) => feature.hidden !== true)
              .map((feature) => (
                <Fragment key={feature.key}>
                  <FieldLabel>
                    <Field orientation="horizontal">
                      <Checkbox
                        checked={spec.features.includes(feature.key)}
                        onCheckedChange={(checked) =>
                          form.setFieldValue(
                            "features",
                            checked
                              ? [...spec.features, feature.key]
                              : spec.features.filter((entry) => entry !== feature.key),
                          )
                        }
                      />
                      <FieldContent>
                        <FieldTitle>{feature.label}</FieldTitle>
                        <FieldDescription>{feature.hint}</FieldDescription>
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                  {feature.key === recipe.tooltipFeature && spec.features.includes(feature.key) && (
                    <TooltipFields
                      recipe={recipe}
                      spec={spec}
                      onChange={(tooltip) => form.setFieldValue("tooltip", tooltip)}
                    />
                  )}
                </Fragment>
              ))}

            <FieldSeparator />

            <Annotations
              recipe={recipe}
              value={spec.annotations}
              onChange={(next) => form.setFieldValue("annotations", next)}
            />
          </Step>

          <Step
            n={5}
            title="Titles and labels"
            columns
            description="Text shown with the chart. Each falls back to the greyed-out default when left empty."
          >
            {recipe.options
              .filter((option) => option.choices === undefined)
              .map((option) => {
                const id = `option-${option.key}`;
                return (
                  <Field key={option.key}>
                    <FieldLabel htmlFor={id}>{option.label}</FieldLabel>
                    <Input
                      id={id}
                      value={spec.options[option.key] ?? ""}
                      placeholder={option.fallback}
                      onChange={(event) =>
                        form.setFieldValue("options", {
                          ...spec.options,
                          [option.key]: event.target.value,
                        })
                      }
                    />
                  </Field>
                );
              })}
          </Step>
        </div>
        <div className="flex min-w-0 flex-col gap-4 @4xl/page:sticky @4xl/page:top-[calc(var(--header-height)+1rem)] @4xl/page:max-h-[calc(100vh-var(--header-height)-4rem)] @4xl/page:min-h-0 @4xl/page:overflow-y-auto">
          <div className="shrink-0">
            <Preview
              js={settled?.generated.js.raw ?? ""}
              csv={settled?.generated.csv.raw ?? ""}
              title={
                settled === undefined || settledRecipe === undefined
                  ? ""
                  : optionValue(settledRecipe.options, settled.spec, TITLE)
              }
              status={status}
              pending={compiling}
              assets={settled?.generated.assets}
              scripts={settled?.generated.scripts}
            />
          </div>
          <CodePanel generated={settled?.generated} note={note} />
        </div>
      </div>
    </div>
  );
};

const ConfirmSample = ({
  sample,
  onConfirm,
  onCancel,
}: {
  readonly sample: Sample;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) => (
  <div role="group" className="ml-auto flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
    <p className={typefaceCaption()}>
      Replace your table with the {sample.label} sample? Your data is discarded; the rest of the
      chart stays as you set it.
    </p>
    <div className="flex gap-1">
      <Button size="xs" variant="outline" onClick={onConfirm}>
        Replace
      </Button>
      <Button size="xs" variant="ghost" onClick={onCancel}>
        Keep mine
      </Button>
    </div>
  </div>
);
