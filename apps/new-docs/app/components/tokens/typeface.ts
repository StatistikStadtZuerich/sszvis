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

/**
 * Small supporting text set beside something else: a caption under an example,
 * a toolbar readout, a loading or "not ported yet" note. One step below body
 * and a little heavier, so it reads as annotation rather than as prose that
 * happens to be small.
 */
export const typefaceMeta = (className?: string) =>
  cn("font-sans text-[0.8125rem] font-medium leading-[1.5] tracking-[0.01em]", className);

/**
 * Code shown as a block - the prose code blocks and the example source panel.
 * Slightly below body so a wide line of code fits without wrapping.
 */
export const typefaceCode = (className?: string) =>
  cn("font-mono text-[0.8125rem] leading-[1.5] tracking-normal", className);

/**
 * A filename or identifier shown inline in a toolbar, caption or card - code
 * as a label rather than as something to read line by line.
 */
export const typefaceCodeLabel = (className?: string) =>
  cn("font-mono text-[0.75rem] leading-[1.4] tracking-normal", className);

/**
 * The library's name, in the sidebar header and in the site header once the
 * sidebar is collapsed. One treatment, so the two never disagree.
 */
export const typefaceWordmark = (className?: string) =>
  cn("font-heading text-[1.2rem] font-bold leading-[1.2] text-primary", className);

/**
 * The title of a tool panel - the chart builder's heading - set in the body
 * face, above its controls but below the prose pages' `h1`. At `text-sm` it
 * read as another label in a page made of labels; one step over body gives the
 * page somewhere to start without letting a tool shout like an article.
 */
export const typefaceHeadingSmall = (className?: string) =>
  cn(
    "font-sans text-[1.15rem] font-semibold leading-[1.3] tracking-[-0.005em] text-foreground",
    className,
  );

/**
 * A one-line explanation under a small heading or beside a control, at the
 * same size as the form controls it accompanies and one shade quieter.
 */
export const typefaceCaption = (className?: string) =>
  cn("font-sans text-xs leading-[1.4] tracking-normal text-muted-foreground", className);

/** A numeral or short tag inside a small badge, sized to fit a 1rem circle. */
export const typefaceBadge = (className?: string) =>
  cn("font-sans text-[0.625rem] font-medium leading-none tracking-[0.02em]", className);
