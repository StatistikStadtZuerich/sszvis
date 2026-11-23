import { useForm } from "@tanstack/react-form";
import { useState } from "react";

import { initialSpec, unmappedRoles } from "@sszvis/chart-builder/initial-spec";
import type { RecipeSummary, Spec } from "@sszvis/chart-builder/spec";

export const recipeOf = (
  recipes: readonly RecipeSummary[],
  spec: Spec,
): RecipeSummary | undefined => recipes.find((entry) => entry.key === spec.recipe) ?? recipes[0];

export function useBuilderForm(recipes: readonly RecipeSummary[], first: RecipeSummary) {
  const [defaultValues] = useState(() => initialSpec(first));
  const form = useForm({
    defaultValues,
    validators: {
      onChange: ({ value }) => {
        const recipe = recipeOf(recipes, value);
        const missing = recipe === undefined ? [] : unmappedRoles(recipe, value);
        return missing.length === 0 ? undefined : `Unmapped: ${missing.join(", ")}`;
      },
    },
  });

  return form;
}

export type BuilderForm = ReturnType<typeof useBuilderForm>;
