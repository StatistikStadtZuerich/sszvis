import { useState } from "react";
import { typefaceCaption } from "~/components/tokens/typeface";
import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "~/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table as DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";

import {
  DELIMITER_LABELS,
  type DelimiterName,
  detectDelimiter,
  parseDelimited,
  type Table,
} from "../domain/csv";

const plural = new Intl.PluralRules("en");

const count = (n: number, one: string, other: string) =>
  `${n} ${plural.select(n) === "one" ? one : other}`;

const PREVIEW_ROWS = 3;

const items = (["comma", "semicolon", "tab"] as const).map((name) => ({
  value: name,
  label: DELIMITER_LABELS[name],
}));

const reading = (table: Table, delimiter: DelimiterName) =>
  `Reading this as ${DELIMITER_LABELS[delimiter].toLowerCase()}-separated: ${count(
    table.columns.length,
    "column",
    "columns",
  )}, ${count(table.rows.length, "row", "rows")}.`;

export const PastePanel = ({
  initial,
  onSave,
  onCancel,
}: {
  readonly initial: string;
  readonly onSave: (table: Table) => void;
  readonly onCancel: () => void;
}) => {
  const [draft, setDraft] = useState(initial);
  const [chosen, setChosen] = useState<DelimiterName | null>(null);
  const delimiter = chosen ?? detectDelimiter(draft);
  const table = parseDelimited(draft, delimiter);
  const empty = table.columns.length === 0;
  const oneColumn = !empty && table.columns.length === 1;

  return (
    <div className="space-y-3">
      <Field>
        <FieldLabel htmlFor="paste-csv">Paste your table</FieldLabel>
        <Textarea
          id="paste-csv"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          variant="code"
          className="min-h-40"
        />
        <FieldDescription>
          Rows from a spreadsheet or the contents of a CSV file. The first row names the columns.
        </FieldDescription>
      </Field>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Field orientation="horizontal" className="shrink-0">
          <FieldLabel htmlFor="paste-separator">Separator</FieldLabel>
          <Select
            value={delimiter}
            onValueChange={(next) => next !== null && setChosen(next)}
            items={items}
          >
            <SelectTrigger id="paste-separator" size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <p role="status" className={typefaceCaption()}>
          {empty ? "Nothing to read yet." : reading(table, delimiter)}
        </p>
      </div>

      {oneColumn && (
        <p className={typefaceCaption()}>
          That is one column. If your file separates its columns another way, choose that separator
          above.
        </p>
      )}

      {!empty && (
        <DataTable containerClassName="max-h-48 overflow-auto border" className="border-collapse">
          <TableHeader sticky>
            <TableRow>
              {table.columns.map((column, index) => (
                <TableHead key={`${column}-${index}`} density="compact">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.slice(0, PREVIEW_ROWS).map((cells, row) => (
              <TableRow key={row}>
                {cells.map((cell, column) => (
                  <TableCell key={column} density="compact">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      {table.rows.length > PREVIEW_ROWS && (
        <p className={typefaceCaption()}>
          {count(table.rows.length - PREVIEW_ROWS, "further row", "further rows")} below.
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        <Button size="xs" disabled={empty} onClick={() => onSave(table)}>
          Replace the table
        </Button>
        <Button size="xs" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
