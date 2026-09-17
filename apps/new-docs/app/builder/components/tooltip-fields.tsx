import { Checkbox } from "~/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "~/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { RoleKey, type RecipeSummary, type Spec, type Tooltip } from "../domain/spec";
import { boundRoles, resolveTooltip } from "../domain/tooltip";

export const TooltipFields = ({
  recipe,
  spec,
  onChange,
}: {
  readonly recipe: RecipeSummary;
  readonly spec: Spec;
  readonly onChange: (tooltip: Tooltip) => void;
}) => {
  /* Only what this recipe's tooltip can actually show; absent means every role. */
  const keys = recipe.tooltipRoles ?? recipe.roles.map((role) => role.key);
  const bound = boundRoles(spec, keys);
  const shown = resolveTooltip(spec.tooltip, recipe.defaultTooltip, bound);
  const roles = recipe.roles.filter((role) => bound.includes(role.key));
  const items = [
    { value: null, label: "Choose a role…" },
    ...roles.map((role) => ({ value: role.key, label: role.label })),
  ];
  /* A recipe may offer one role only - a grouped bar names its group and lists the rest. */
  const listable = roles.filter((role) => role.key !== shown.header);
  const id = `tooltip-header-${recipe.key}`;

  return (
    <div className="flex flex-col gap-3 pl-6">
      <Field>
        <FieldLabel htmlFor={id}>Tooltip header</FieldLabel>
        <Select
          value={shown.header || null}
          onValueChange={(next) => onChange({ ...spec.tooltip, header: RoleKey.make(next ?? "") })}
          items={items}
        >
          <SelectTrigger id={id} className="w-full">
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
        <FieldDescription>
          {listable.length > 0
            ? "Shown bold, first. Tick the roles to list under it."
            : "Shown bold, above the rows."}
        </FieldDescription>
      </Field>
      {listable.map((role) => (
        <FieldLabel key={role.key}>
          <Field orientation="horizontal">
            <Checkbox
              checked={shown.body.includes(role.key)}
              onCheckedChange={(checked) => {
                const next = new Set(shown.body);
                if (checked) next.add(role.key);
                else next.delete(role.key);
                onChange({ ...spec.tooltip, body: keys.filter((key) => next.has(key)) });
              }}
            />
            <FieldContent>
              <FieldTitle>{role.label}</FieldTitle>
            </FieldContent>
          </Field>
        </FieldLabel>
      ))}
    </div>
  );
};
