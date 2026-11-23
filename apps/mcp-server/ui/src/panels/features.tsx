/*
 * Step 4 of apps/new-docs/app/builder/page.tsx, without the tooltip fields, annotations
 * and filter control the app leaves to the docs builder.
 */
import { Checkbox } from "../components/ui/checkbox.tsx";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "../components/ui/field.tsx";
import type { RecipeSummary, Spec } from "@sszvis/chart-builder/spec";

export const Features = ({
  recipe,
  spec,
  onChange,
}: {
  readonly recipe: RecipeSummary;
  readonly spec: Spec;
  readonly onChange: (next: Spec) => void;
}) => (
  <>
    {recipe.features
      .filter((feature) => feature.hidden !== true)
      .map((feature) => (
        <FieldLabel key={feature.key}>
          <Field orientation="horizontal">
            <Checkbox
              name={`feature-${feature.key}`}
              checked={spec.features.includes(feature.key)}
              onCheckedChange={(checked) =>
                onChange({
                  ...spec,
                  features: checked
                    ? [...spec.features, feature.key]
                    : spec.features.filter((entry) => entry !== feature.key),
                })
              }
            />
            <FieldContent>
              <FieldTitle>{feature.label}</FieldTitle>
              <FieldDescription>{feature.hint}</FieldDescription>
            </FieldContent>
          </Field>
        </FieldLabel>
      ))}
  </>
);
