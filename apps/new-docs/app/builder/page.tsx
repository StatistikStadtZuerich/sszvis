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
import { columnKinds, parse, serialize } from "./domain/csv";
import { applySample, switchRecipe, unmappedRoles } from "./domain/initial-spec";
import { isPristine, type Sample, samples } from "./domain/samples";
import { optionValue, type RecipeSummary, TITLE } from "./domain/spec";

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
  const kinds = useMemo(() => columnKinds(table), [table]);
  const missing = new Set(unmappedRoles(recipe, spec));
  const missingRoles = recipe.roles.filter((role) => missing.has(role.key));

  /** A sample waiting on the user, because loading it would discard the table they built. */
  const [pendingSample, setPendingSample] = useState<Sample | null>(null);
  const load = (sample: Sample) => {
    setPendingSample(null);
    form.reset(applySample(spec, recipe, sample.csv), { keepDefaultValues: true });
  };

  const compiling = useHeldFor(freshness === "compiling", 350);

  const status: PreviewStatus =
    error !== null
      ? { kind: "error", message: error }
      : missingRoles.length > 0
        ? { kind: "incomplete", roles: missingRoles }
        : freshness === "stale"
          ? { kind: "stale" }
          : { kind: "ready" };

  const note =
    /* An error stops the compile, so the sources below stay visibly stale rather
       than reading as a rebuild that will never land. */
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
      <div className="grid grid-cols-1 items-start gap-8 @4xl/page:grid-cols-[minmax(340px,24rem)_minmax(0,1fr)] @6xl/page:gap-12">
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
              onChange={(next) => form.setFieldValue("csv", serialize(next))}
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
            {/* A choice comes first: it decides what the columns below it have to contain.
                A map's geography is the case - it says which areas the code column names. */}
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
                  label:
                    kinds.get(column) === role.kind
                      ? column
                      : `${column} (looks ${kinds.get(column)})`,
                })),
              ];
              const id = `mapping-${role.key}`;
              return (
                <Field key={role.key}>
                  <FieldLabel htmlFor={id}>{role.label}</FieldLabel>
                  <Select
                    value={spec.fields[role.key] || null}
                    onValueChange={(next) =>
                      form.setFieldValue("fields", {
                        ...spec.fields,
                        [role.key]: next ?? "",
                      })
                    }
                    items={items}
                  >
                    <SelectTrigger id={id} aria-invalid={missing.has(role.key) || undefined}>
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
                  {role.hint !== undefined && <FieldDescription>{role.hint}</FieldDescription>}
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
              /* The exported page titles itself from the resolved option (workers/pipeline.ts),
                 so an empty Title field has to fall back to the recipe's German default here too. */
              title={settled === undefined ? "" : optionValue(recipe.options, settled.spec, TITLE)}
              status={status}
              assets={settled?.generated.assets}
              scripts={recipe.scripts}
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
