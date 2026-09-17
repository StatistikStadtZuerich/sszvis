import { initialSpec } from "./initial-spec";
import { summarize, type Annotation, type AnnotationAxis, type Recipe, type Spec } from "./spec";

type Case = {
  readonly label: string;
  readonly recipe: Recipe;
  readonly spec: Omit<Spec, "features">;
};

const SAMPLE_VALUE = { number: "10", date: "01.01.2020", category: "x" } as const;

const sampleAnnotations = (axes: readonly AnnotationAxis[]): readonly Annotation[] =>
  axes.flatMap((axis) => [
    {
      kind: "reference-line",
      role: axis.role,
      at: { kind: "value", value: SAMPLE_VALUE[axis.kind] },
      label: "Sample",
    },
    ...(axis.kind === "number"
      ? [{ kind: "reference-line", role: axis.role, at: { kind: "mean" }, label: "" } as const]
      : []),
  ]);

export const cases = (recipes: readonly Recipe[]): readonly Case[] =>
  recipes.flatMap((recipe) => {
    const summary = summarize(recipe);
    const { features: _features, ...spec } = initialSpec(summary);
    const single = recipe.roles
      .filter((role) => role.optional === true && spec.fields[role.key] !== "")
      .map((role) => ({
        label: `${recipe.key}-single-${role.key}`,
        recipe,
        spec: { ...spec, fields: { ...spec.fields, [role.key]: "" } },
      }));
    /*
     * One case per value of a choice option. A choice can change which hidden
     * features a spec implies - a map's geography decides whether its lake is
     * drawn, and whether that lake has a shoreline - so leaving the other values
     * out would type-check one geography and ship six.
     */
    const chosen = recipe.options.flatMap((option) =>
      (option.choices ?? [])
        .filter((choice) => choice.value !== spec.options[option.key])
        .map((choice) => ({
          label: `${recipe.key}-${option.key}-${choice.value}`,
          recipe,
          spec: { ...spec, options: { ...spec.options, [option.key]: choice.value } },
        })),
    );
    const annotated =
      recipe.annotationAxes.length === 0
        ? []
        : [
            {
              label: `${recipe.key}-annotated`,
              recipe,
              spec: { ...spec, annotations: sampleAnnotations(recipe.annotationAxes) },
            },
          ];
    return [{ label: recipe.key, recipe, spec }, ...single, ...chosen, ...annotated];
  });

/** Only checkbox features vary; hidden ones follow the spec's content. */
export const checkboxFeatures = (recipe: Recipe) =>
  recipe.features.filter((feature) => feature.hidden !== true).map((feature) => feature.key);

export const combinations = ([first, ...others]: readonly string[]): string[][] =>
  first === undefined ? [[]] : combinations(others).flatMap((rest) => [rest, [first, ...rest]]);
