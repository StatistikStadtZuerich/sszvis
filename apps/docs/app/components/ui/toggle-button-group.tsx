import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { cva, type VariantProps } from "class-variance-authority";
import { createContext, use } from "react";

import { cn } from "~/lib/utils";

/*
 * A single-select row of toggle buttons. Base UI handles the roving focus and
 * the pressed state; the variants here are the shared look every toolbar in the
 * docs uses, so a new toolbar never has to re-derive the active-item styling.
 */

const toggleGroupVariants = cva("flex items-center", {
  variants: {
    variant: {
      /** Sits directly on a toolbar - only the pressed item gets a surface. */
      plain: "gap-0.5",
      /** A pill with its own track, as used for mutually exclusive views. */
      segmented: "gap-0.5 rounded-md bg-muted/50 p-0.5",
    },
  },
  defaultVariants: { variant: "plain" },
});

const toggleButtonVariants = cva(
  cn(
    "flex shrink-0 items-center gap-1.5 rounded-sm text-xs whitespace-nowrap transition-colors",
    "text-muted-foreground hover:text-foreground",
    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
    "disabled:cursor-not-allowed disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  ),
  {
    variants: {
      variant: {
        plain: "data-[pressed]:bg-muted data-[pressed]:font-medium data-[pressed]:text-foreground",
        segmented:
          "data-[pressed]:bg-background data-[pressed]:font-medium data-[pressed]:text-foreground data-[pressed]:shadow-xs",
      },
      size: {
        default: "px-2 py-1.5",
        sm: "px-2 py-1",
        lg: "px-4 py-2",
      },
    },
    defaultVariants: { variant: "plain", size: "default" },
  },
);

type ToggleVariant = NonNullable<VariantProps<typeof toggleButtonVariants>["variant"]>;
type ToggleSize = NonNullable<VariantProps<typeof toggleButtonVariants>["size"]>;

const ToggleButtonGroupContext = createContext<{
  readonly variant: ToggleVariant;
  readonly size: ToggleSize;
}>({ variant: "plain", size: "default" });

function ToggleButtonGroup<Value extends string>({
  value,
  onValueChange,
  variant = "plain",
  size = "default",
  className,
  ...props
}: Omit<ToggleGroupPrimitive.Props<Value>, "value" | "defaultValue" | "onValueChange"> & {
  /** The single pressed value - the group is always exactly one of its items. */
  readonly value: Value;
  readonly onValueChange: (value: Value) => void;
  readonly size?: ToggleSize;
} & VariantProps<typeof toggleGroupVariants>) {
  return (
    <ToggleButtonGroupContext value={{ variant: variant ?? "plain", size: size ?? "default" }}>
      <ToggleGroupPrimitive
        data-slot="toggle-button-group"
        value={[value]}
        // Base UI reports an empty array when the pressed item is pressed
        // again; a single-select group keeps its current value instead.
        onValueChange={(next) => {
          const [selected] = next;
          if (selected !== undefined) onValueChange(selected);
        }}
        className={cn(toggleGroupVariants({ variant, className }))}
        {...props}
      />
    </ToggleButtonGroupContext>
  );
}

function ToggleButton<Value extends string>({
  className,
  variant,
  size,
  ...props
}: TogglePrimitive.Props<Value> & {
  readonly variant?: ToggleVariant;
  readonly size?: ToggleSize;
}) {
  const group = use(ToggleButtonGroupContext);
  return (
    <TogglePrimitive
      data-slot="toggle-button"
      className={cn(
        toggleButtonVariants({
          variant: variant ?? group.variant,
          size: size ?? group.size,
          className,
        }),
      )}
      {...props}
    />
  );
}

export { ToggleButton, ToggleButtonGroup };
