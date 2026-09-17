import {
  type CellContext,
  createColumnHelper,
  type HeaderContext,
  metaHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarIcon,
  HashIcon,
  TriangleAlertIcon,
  TypeIcon,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { typefaceCaption } from "~/components/tokens/typeface";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table as DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

import {
  addedName,
  columnKinds,
  hasValues,
  nextKind,
  parseBlock,
  reorder,
  serialize,
  settleColumn,
  type SortDirection,
  sortOrder,
  type Table,
  unsupportedPins,
} from "../domain/csv";
import { ColumnName, KIND_LABEL, type ColumnKind, type ColumnKinds } from "../domain/spec";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { PastePanel } from "./paste-panel";

type Row = Table["rows"][number];

const ROW_HEIGHT = 29;
const VIEWPORT = 256;
const OVERSCAN = 6;
const WINDOW_FROM = 40;

type EditorMeta = {
  readonly kindOf: (column: number) => ColumnKind;
  readonly isPinned: (column: number) => boolean;
  readonly isUnsupported: (column: number) => boolean;
  readonly isEmpty: (column: number) => boolean;
  readonly cycleKind: (column: number) => void;
  readonly beginRename: (column: number) => void;
  readonly setColumn: (column: number, value: string) => void;
  readonly settleColumn: (column: number) => void;
  readonly sortBy: (column: number) => void;
  readonly sorted: Sorted | null;
  readonly setCell: (row: number, column: number, value: string) => void;
  readonly pasteBlock: (row: number, column: number, text: string) => boolean;
  readonly removeRow: (row: number) => void;
  readonly canRemoveRow: boolean;
};

type Sorted = {
  readonly column: number;
  readonly direction: SortDirection;
};

type View = Sorted & { readonly order: readonly number[] };

type ColumnMeta = {
  readonly index: number;
  readonly name: string;
};

const features = tableFeatures({
  tableMeta: metaHelper<EditorMeta>(),
  columnMeta: metaHelper<ColumnMeta>(),
});

const helper = createColumnHelper<typeof features, Row>();

const plural = new Intl.PluralRules("en");

const count = (n: number, one: string, other: string) =>
  `${n} ${plural.select(n) === "one" ? one : other}`;

const KIND_ICON = {
  nominal: TypeIcon,
  continuous: HashIcon,
  temporal: CalendarIcon,
} satisfies Record<ColumnKind, typeof TypeIcon>;

/**
 * What a column holds, and a click to say otherwise. One button rather than a menu:
 * it shows the kind in force, and each click moves on by one. An unpinned column
 * re-reads as the data is edited; once clicked it keeps what it was set to, which
 * is how a column is held to a kind against data pasted in later.
 */
const KindCell = ({
  index,
  name,
  kind,
  pinned,
  unsupported,
  empty,
  onCycle,
}: {
  readonly index: number;
  readonly name: string;
  readonly kind: ColumnKind;
  readonly pinned: boolean;
  readonly unsupported: boolean;
  readonly empty: boolean;
  readonly onCycle: (index: number) => void;
}) => {
  const label = KIND_LABEL[kind];
  const Icon = KIND_ICON[kind];
  const next = KIND_LABEL[nextKind(kind)];
  const warning = empty
    ? `${name} is empty, so a chart reading it as ${label} has nothing to draw.`
    : `The values in ${name} are not all ${label}. The chart will drop the rows it cannot read.`;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon-xs"
            variant="ghost"
            /* Both halves: a control that cycles is unusable if it only says where it is. */
            aria-label={`${name} holds ${label}${pinned ? "" : ", as detected"}. Change to ${next}.`}
            onClick={() => onCycle(index)}
            className="relative ml-0.5 shrink-0"
          >
            {unsupported ? <TriangleAlertIcon className="text-destructive" /> : <Icon />}
            {pinned && (
              <span
                aria-hidden
                className="absolute right-0.5 bottom-0.5 size-1 rounded-full bg-foreground"
              />
            )}
          </Button>
        }
      />
      <TooltipContent side="top">
        {unsupported
          ? warning
          : `Holds ${label}${pinned ? "" : ", as detected"} - click for ${next}`}
      </TooltipContent>
    </Tooltip>
  );
};

const HeaderCell = ({ column, table: grid }: HeaderContext<typeof features, Row, string>) => {
  const index = column.columnDef.meta?.index ?? 0;
  const name = column.columnDef.meta?.name ?? "";
  const sorted = grid.options.meta?.sorted;
  const direction = sorted?.column === index ? sorted.direction : null;
  const Icon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown;
  const label =
    direction === "asc"
      ? `Sort ${name} descending`
      : direction === "desc"
        ? `Stop sorting by ${name}`
        : `Sort ${name} ascending`;
  const meta = grid.options.meta;
  return (
    <div className="flex items-center">
      {meta !== undefined && (
        <KindCell
          index={index}
          name={name}
          kind={meta.kindOf(index)}
          pinned={meta.isPinned(index)}
          unsupported={meta.isUnsupported(index)}
          empty={meta.isEmpty(index)}
          onCycle={meta.cycleKind}
        />
      )}
      <Input
        value={name}
        onChange={(event) => grid.options.meta?.setColumn(index, event.target.value)}
        onFocus={() => grid.options.meta?.beginRename(index)}
        /* Typing stays free; the name is settled on the way out, so a header is never
           left blank or repeated - either would address the wrong column downstream. */
        onBlur={() => grid.options.meta?.settleColumn(index)}
        variant="cell-heading"
        aria-label={`Name of column ${index + 1}`}
      />
      <Button
        size="icon-xs"
        variant="ghost"
        aria-label={label}
        aria-pressed={direction !== null}
        onClick={() => grid.options.meta?.sortBy(index)}
        className="mr-0.5 shrink-0"
      >
        <Icon />
      </Button>
    </div>
  );
};

const ValueCell = ({
  getValue,
  row,
  column,
  table: grid,
}: CellContext<typeof features, Row, string>) => {
  const index = column.columnDef.meta?.index ?? 0;
  return (
    <Input
      value={getValue()}
      onChange={(event) => grid.options.meta?.setCell(row.index, index, event.target.value)}
      onPaste={(event) => {
        const text = event.clipboardData.getData("text/plain");
        /* Copying a range out of a spreadsheet is how people actually move data in. */
        if (grid.options.meta?.pasteBlock(row.index, index, text) === true) event.preventDefault();
      }}
      variant="cell"
      aria-label={`${column.columnDef.meta?.name ?? "Column"}, row ${row.index + 1}`}
    />
  );
};

/* `outline` rather than `ghost`: at the end of a row of input cells a borderless
   glyph reads as one more editable value, and this one deletes the row. */
const RemoveCell = ({ row, table: grid }: CellContext<typeof features, Row, unknown>) => (
  <Button
    size="icon-xs"
    variant="outline"
    aria-label={`Remove row ${row.index + 1}`}
    disabled={!grid.options.meta?.canRemoveRow}
    onClick={() => grid.options.meta?.removeRow(row.index)}
  >
    <X />
  </Button>
);

export const TableEditor = ({
  table,
  kinds,
  onChange,
  onKindsChange,
  actions,
}: {
  readonly table: Table;
  /* The pins belong to the spec, so the editor reports a change to them rather
     than holding them - the shape `table`/`onChange` already has. */
  readonly kinds: ColumnKinds;
  readonly onChange: (table: Table) => void;
  readonly onKindsChange: (kinds: ColumnKinds) => void;
  readonly actions?: React.ReactNode;
}) => {
  const past = `${useId()}-past-table`;
  const [pasting, setPasting] = useState(false);
  const [held, setHeld] = useState<View | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  /** What the last block paste did, until the next edit. */
  const [notice, setNotice] = useState<string | null>(null);

  const view = held !== null && held.order.length === table.rows.length ? held : null;

  const at = (index: number) => view?.order[index] ?? index;

  const rows = useMemo(
    () => (view === null ? table.rows : reorder(table, view.order).rows),
    [table, view],
  );

  /* The name the column carried before the caret entered it. See `settleColumn`. */
  const renaming = useRef<{ readonly column: number; readonly from: ColumnName } | null>(null);

  const resolved = useMemo(() => columnKinds(table, kinds), [table, kinds]);
  const unsupported = useMemo(() => unsupportedPins(table, kinds), [table, kinds]);
  const kindOf = (column: number): ColumnKind =>
    resolved.get(table.columns[column] ?? "") ?? "nominal";

  const replace = (next: Table) => {
    setHeld(null);
    setNotice(null);
    if (scroller.current !== null) scroller.current.scrollTop = 0;
    setScrollTop(0);
    onChange(next);
  };

  const meta: EditorMeta = {
    kindOf,
    isPinned: (column) => {
      const name = table.columns[column];
      return name !== undefined && kinds[name] !== undefined;
    },
    isUnsupported: (column) => unsupported.has(table.columns[column] ?? ""),
    isEmpty: (column) => {
      const name = table.columns[column];
      return name !== undefined && !hasValues(table, name);
    },
    /* The first click settles on the kind after whatever was detected, so a control
       whose first use appeared to do nothing cannot happen. */
    cycleKind: (column) => {
      const name = table.columns[column];
      if (name === undefined) return;
      setNotice(null);
      onKindsChange({ ...kinds, [name]: nextKind(kindOf(column)) });
    },
    beginRename: (column) => {
      const from = table.columns[column];
      if (from !== undefined) renaming.current = { column, from };
    },
    /* Typing only renames the column. The pin stays under the name it had until the
       name settles, because mid-edit a header may read exactly what another column
       is called and there would be no telling the two apart. */
    setColumn: (column, value) => {
      setNotice(null);
      onChange({
        ...table,
        /* The header cell is free text; naming a column is where a raw string becomes a `ColumnName`. */
        columns: table.columns.map((name, index) =>
          index === column ? ColumnName.make(value) : name,
        ),
      });
    },
    settleColumn: (column) => {
      const started = renaming.current;
      renaming.current = null;
      const from = started?.column === column ? started.from : table.columns[column];
      if (from === undefined) return;
      const next = settleColumn(table, column, from, kinds);
      if (next.table.columns[column] !== table.columns[column]) onChange(next.table);
      if (next.kinds !== kinds) onKindsChange(next.kinds);
    },
    sortBy: (column) => {
      const direction: SortDirection | null =
        view?.column !== column ? "asc" : view.direction === "asc" ? "desc" : null;
      setHeld(
        direction === null
          ? null
          : { column, direction, order: sortOrder(table, column, direction, kinds) },
      );
    },
    sorted: view,
    setCell: (row, column, value) => {
      setNotice(null);
      const target = at(row);
      onChange({
        ...table,
        rows: table.rows.map((cells, index) =>
          index === target ? cells.map((cell, spot) => (spot === column ? value : cell)) : cells,
        ),
      });
    },
    pasteBlock: (row, column, text) => {
      const block = parseBlock(text);
      const width = Math.max(0, ...block.map((cells) => cells.length));
      if (block.length <= 1 && width <= 1) return false;

      /* NOTE: Every pasted row lands where the user sees it, so each one is mapped
         through the visible order - not just the first. Past the last visible row
         `at` is the identity, which is where the appended rows go. */
      const targets = block.map((_, index) => at(row + index));
      const pasted = new Map(targets.map((source, index) => [source, block[index]]));

      const columns = [...table.columns];
      while (columns.length < column + width) columns.push(addedName(columns));
      const grown = table.rows.map((cells) => [
        ...cells,
        ...Array.from({ length: columns.length - cells.length }, () => ""),
      ]);
      while (grown.length <= Math.max(...targets)) grown.push(columns.map(() => ""));

      const addedColumns = columns.length - table.columns.length;
      const addedRows = grown.length - table.rows.length;
      replace({
        columns,
        rows: grown.map((cells, index) => {
          const source = pasted.get(index);
          return source === undefined
            ? cells
            : cells.map((cell, spot) => source[spot - column] ?? cell);
        }),
      });
      setNotice(
        [
          `Pasted ${count(block.length, "row", "rows")} and ${count(width, "column", "columns")}.`,
          addedRows > 0 ? `Added ${count(addedRows, "row", "rows")}.` : null,
          addedColumns > 0 ? `Added ${count(addedColumns, "column", "columns")}.` : null,
        ]
          .filter((part) => part !== null)
          .join(" "),
      );
      return true;
    },
    removeRow: (row) => {
      setNotice(null);
      const target = at(row);
      setHeld(
        view === null
          ? null
          : {
              ...view,
              order: view.order
                .filter((index) => index !== target)
                .map((index) => (index > target ? index - 1 : index)),
            },
      );
      onChange({
        ...table,
        rows: table.rows.filter((_, index) => index !== target),
      });
    },
    canRemoveRow: table.rows.length > 1,
  };

  const columns = useMemo(
    () =>
      helper.columns([
        ...table.columns.map((name, index) =>
          helper.accessor((row) => row[index] ?? "", {
            id: `column-${index}`,
            header: HeaderCell,
            cell: ValueCell,
            meta: { index, name },
          }),
        ),
        helper.display({
          id: "remove",
          /* The column has no visible heading, but a table column with no header at
             all is announced as a blank cell. */
          header: () => <span className="sr-only">Remove row</span>,
          cell: RemoveCell,
        }),
      ]),
    [table.columns],
  );

  const grid = useTable({
    features,
    columns,
    data: rows,
    getRowId: (_, i) => String(i),
    meta,
  });

  const windowed = table.rows.length > WINDOW_FROM;

  useEffect(() => {
    const element = scroller.current;
    if (element === null || !windowed) return;
    const onScroll = () => setScrollTop(element.scrollTop);
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => element.removeEventListener("scroll", onScroll);
  }, [windowed]);

  if (pasting) {
    return (
      <PastePanel
        initial={serialize(table)}
        /* A wholly new table, so the pins go with the old one, as loading a sample
           drops them. Not in `replace`, whose other callers keep their columns. */
        onSave={(next) => {
          onKindsChange({});
          replace(next);
          setPasting(false);
        }}
        onCancel={() => setPasting(false)}
      />
    );
  }

  const sortedColumn = view === null ? null : (table.columns[view.column] ?? "");

  const all = grid.getRowModel().rows;
  const first = windowed ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN) : 0;
  const last = windowed
    ? Math.min(all.length, Math.ceil((scrollTop + VIEWPORT) / ROW_HEIGHT) + OVERSCAN)
    : all.length;
  const shown = windowed ? all.slice(first, last) : all;
  const width = table.columns.length + 1;

  return (
    <div className="space-y-2">
      <a
        href={`#${past}`}
        onClick={(event) => {
          event.preventDefault();
          document.getElementById(past)?.focus();
        }}
        className="sr-only focus-visible:not-sr-only focus-visible:mb-1 focus-visible:inline-block focus-visible:rounded-md focus-visible:bg-muted focus-visible:px-2 focus-visible:py-1 focus-visible:text-xs focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
      >
        Skip the data table
      </a>
      {actions}
      <DataTable
        containerRef={scroller}
        containerClassName="max-h-64 overflow-auto border"
        className="border-collapse"
        aria-rowcount={windowed ? all.length + 1 : undefined}
      >
        <TableHeader sticky>
          {grid.getHeaderGroups().map((group) => (
            <TableRow key={group.id} aria-rowindex={windowed ? 1 : undefined}>
              {group.headers.map((header) => (
                <TableHead key={header.id} density="flush">
                  {header.isPlaceholder ? null : <grid.FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          <Spacer height={first * ROW_HEIGHT} span={width} />
          {shown.map((row) => (
            <TableRow
              key={row.id}
              aria-rowindex={windowed ? row.index + 2 : undefined}
              style={{ height: ROW_HEIGHT }}
            >
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id} density="flush">
                  <grid.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
          <Spacer height={(all.length - last) * ROW_HEIGHT} span={width} />
        </TableBody>
      </DataTable>
      <div id={past} tabIndex={-1} className="flex flex-wrap gap-1 focus-visible:outline-none">
        <Button
          size="xs"
          variant="outline"
          onClick={() =>
            replace({
              ...table,
              rows: [...table.rows, table.columns.map(() => "")],
            })
          }
        >
          Add row
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={() =>
            replace({
              columns: [...table.columns, addedName(table.columns)],
              rows: table.rows.map((cells) => [...cells, ""]),
            })
          }
        >
          Add column
        </Button>
        <Button size="xs" variant="outline" onClick={() => setPasting(true)}>
          Paste CSV
        </Button>
      </div>
      <p role="status" className={notice === null ? "sr-only" : typefaceCaption()}>
        {notice ?? ""}
      </p>
      {view !== null && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className={typefaceCaption()}>
            Sorted by {sortedColumn} for viewing only. The exported data keeps its own order.
          </p>
          <Button size="xs" variant="outline" onClick={() => replace(reorder(table, view.order))}>
            Apply order to data
          </Button>
        </div>
      )}
    </div>
  );
};

const Spacer = ({ height, span }: { readonly height: number; readonly span: number }) =>
  height <= 0 ? null : (
    <tr role="presentation" aria-hidden>
      <td colSpan={span} style={{ height }} className="p-0" />
    </tr>
  );
