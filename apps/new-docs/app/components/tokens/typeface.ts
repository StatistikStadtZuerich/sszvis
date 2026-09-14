import { cn } from "~/lib/utils";

export const typefaceHeading1 = (className?: string) =>
  cn(
    "font-heading text-[1.85rem] sm:text-[2.2rem] font-semibold tracking-[-0.01em] leading-[1.2] text-primary",
    className,
  );

export const typefaceHeading2 = (className?: string) =>
  cn(
    "font-heading text-[1.53rem] font-semibold tracking-[-0.005em] leading-[1.25] text-primary",
    className,
  );

export const typefaceHeading3 = (className?: string) =>
  cn("font-heading text-[1.275rem] font-semibold leading-[1.3] text-primary", className);

export const typefaceHeading4 = (className?: string) =>
  cn("font-heading text-[1.0625rem] font-semibold leading-[1.4] text-primary", className);

export const typefaceHeading5 = (className?: string) =>
  cn("font-heading text-[0.95rem] font-semibold leading-[1.4] text-foreground", className);

export const typefaceHeading6 = (className?: string) =>
  cn("font-heading text-[0.9rem] font-semibold leading-[1.4] text-muted-foreground", className);

export const typefaceBody = (className?: string) =>
  cn("font-sans text-[1.0625rem] leading-[1.44] tracking-normal", className);

export const typefaceAnchor = (className?: string) =>
  cn(
    "text-link underline decoration-link/40 underline-offset-[3px] hover:decoration-link transition-colors duration-150",
    className,
  );

/**
 * The lead paragraph a page opens with, written as a `>` blockquote in the
 * ported docs. The old docs set it 1.2x body - larger, but otherwise ordinary
 * prose, not a quotation - and that ratio is kept against this scale's body.
 */
export const typefaceLead = (className?: string) =>
  cn("font-sans text-[1.275rem] leading-[1.44] tracking-normal text-foreground", className);
