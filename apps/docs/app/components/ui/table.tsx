"use client";

import * as React from "react";
import { cn } from "~/lib/utils";

function Table({
  className,
  containerClassName,
  containerRef,
  ...props
}: React.ComponentProps<"table"> & {
  readonly containerClassName?: string;
  /** The scrolling element, for a caller that has to read or set its scroll position. */
  readonly containerRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={containerRef}
      data-slot="table-container"
      className={cn("relative w-full overflow-x-auto", containerClassName)}
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-xs", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({
  className,
  sticky = false,
  ...props
}: React.ComponentProps<"thead"> & {
  /**
   * Hold the header in place while the body scrolls under it. Carries its own
   * layer: it has to beat its rows and nothing else, and reaching for a higher
   * one puts it over the app's own header.
   */
  readonly sticky?: boolean;
}) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "[&_tr]:border-b [&_tr]:hover:bg-transparent",
        sticky && "sticky top-0 z-(--z-raised) bg-muted",
        className,
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

/**
 * How much room a cell gives its content. `compact` is a data grid read at a
 * glance; `flush` hands the padding to a control that brings its own, which is
 * what a cell holding an `Input` needs.
 */
type Density = "default" | "compact" | "flush";

const HEAD_DENSITY = {
  default: "h-10 px-2",
  compact: "h-7 px-2",
  flush: "h-7 p-0",
} satisfies Record<Density, string>;

const CELL_DENSITY = {
  default: "p-2",
  compact: "px-2 py-1",
  flush: "p-0",
} satisfies Record<Density, string>;

function TableHead({
  className,
  density = "default",
  ...props
}: React.ComponentProps<"th"> & { readonly density?: Density }) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-left align-middle font-medium whitespace-nowrap text-foreground has-[[role=checkbox]]:pr-0",
        HEAD_DENSITY[density],
        className,
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  density = "default",
  ...props
}: React.ComponentProps<"td"> & { readonly density?: Density }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "align-middle whitespace-nowrap has-[[role=checkbox]]:pr-0",
        CELL_DENSITY[density],
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
