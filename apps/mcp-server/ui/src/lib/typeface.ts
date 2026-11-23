import { cn } from "./utils.ts";

/*
 * The one typeface helper the copied panels use, from apps/docs/app/components/tokens.
 * A one-line explanation beside a control, one shade quieter than it.
 */
export const typefaceCaption = (className?: string) =>
  cn("font-sans text-xs leading-[1.4] tracking-normal text-muted-foreground", className);
