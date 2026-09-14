import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

const callout = cva(
  [
    "my-6 rounded-[2px] border p-5",
    "bg-[color-mix(in_oklab,var(--callout)_8%,var(--background))]",
    "border-[color-mix(in_oklab,var(--callout)_26%,var(--background))]",
    "text-[color-mix(in_oklab,var(--callout)_68%,var(--foreground))]",
    // Catalog let the hint's colour carry through its inline code as well.
    "[&_code]:text-inherit",
    "[&>:first-child]:mt-0 [&>:last-child]:mb-0",
  ],
  {
    variants: {
      variant: {
        info: "[--callout:var(--info)]",
        success: "[--callout:var(--success)]",
        warning: "[--callout:var(--warning)]",
        error: "[--callout:var(--destructive)]",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

export const Callout = ({
  variant,
  className,
  children,
}: VariantProps<typeof callout> & {
  readonly className?: string;
  readonly children?: ReactNode;
}) => <aside className={cn(callout({ variant }), className)}>{children}</aside>;
