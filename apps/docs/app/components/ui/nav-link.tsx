import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

/*
 * Navigation links - table of contents rows, prev/next, the small "view the
 * source" links. These are anchors, not buttons, so they stay out of
 * `ui/Button`; what they share is the muted-until-hovered treatment and the
 * focus ring, and the active row reads its state from `aria-current` so a
 * caller never has to restate the styling.
 */

const navLinkVariants = cva(
  cn(
    "inline-flex items-center gap-1 transition-colors",
    "text-muted-foreground hover:text-foreground",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        /** Sits in a line of prose or a footer row. */
        default: "",
        /** A row in a vertical list, with its own hover surface. */
        list: cn(
          "flex min-h-10 rounded-md px-2 py-1.5 hover:bg-accent/60 xl:min-h-0",
          "aria-[current]:font-medium aria-[current]:text-primary",
        ),
      },
      size: {
        sm: "text-sm [&_svg:not([class*='size-'])]:size-4",
        xs: "text-xs [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: { variant: "default", size: "sm" },
  },
);

function NavLink({
  className,
  variant,
  size,
  ...props
}: ComponentProps<"a"> & VariantProps<typeof navLinkVariants>) {
  return (
    <a
      data-slot="nav-link"
      className={cn(navLinkVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { NavLink, navLinkVariants };
