import { Option } from "effect";
import { describe, expect, test } from "vitest";

import { controlFields, filterCandidates, renameControl, resolveControl } from "./controls";
import { distinctValues, parse } from "./csv";
import { ColumnName, RecipeKey, RoleKey, type Spec } from "./spec";

const CSV = [
  "Sektor,Geschlecht,Anzahl,Datum",
  "Bau,Weiblich,10,01.01.2020",
  "Bau,Männlich,20,01.01.2020",
  "Handel,Weiblich,30,01.01.2021",
  "Handel,Männlich,40,01.01.2021",
].join("\n");

const col = ColumnName.make;

const specFor = (over: Partial<Spec> = {}): Spec => ({
  recipe: RecipeKey.make("bar-chart-vertical"),
  csv: CSV,
  fields: { [RoleKey.make("category")]: col("Sektor"), [RoleKey.make("value")]: col("Anzahl") },
  options: {},
  features: [],
  tooltip: { header: RoleKey.make("value"), body: [] },
  annotations: [],
  control: null,
  kinds: {},
  chosen: [],
  ...over,
});

const filtering = (column: string, label = ""): Spec["control"] => ({
  kind: "filter",
  column: col(column),
  label,
});

describe("distinctValues", () => {
  test("should keep the column's own order rather than sorting", () => {
    expect(distinctValues(parse("Jahr\n2020\n2019\n2021\n2019"), col("Jahr"))).toEqual([
      "2020",
      "2019",
      "2021",
    ]);
  });

  test("should not offer a blank cell as a choice", () => {
    expect(distinctValues(parse("Jahr\n2020\n\n2021"), col("Jahr"))).toEqual(["2020", "2021"]);
  });
});

describe("filterCandidates", () => {
  const table = parse(CSV);

  test("should offer a spare column the chart does not already draw", () => {
    expect(filterCandidates(specFor(), table)).toEqual([col("Geschlecht")]);
  });

  test("should not offer a column a role already holds", () => {
    /* Filtering by the axis the chart is drawn along leaves a single bar. */
    expect(filterCandidates(specFor(), table)).not.toContain(col("Sektor"));
    expect(filterCandidates(specFor(), table)).not.toContain(col("Anzahl"));
  });

  test("should not offer a date column", () => {
    /* Its values reach the buttons as the table wrote them, and `01.01.2020` is not a
       caption. The column is spare here - only its kind keeps it out. */
    expect(filterCandidates(specFor(), table)).not.toContain(col("Datum"));
  });

  test("should offer a date column once it is pinned to text", () => {
    const pinned = specFor({ kinds: { [col("Datum")]: "nominal" } });
    expect(filterCandidates(pinned, table)).toContain(col("Datum"));
  });

  test("should not offer a column that holds only one value", () => {
    const uniform = parse("Sektor,Anzahl,Einheit\nBau,10,Personen\nHandel,20,Personen");
    expect(filterCandidates(specFor(), uniform)).toEqual([]);
  });
});

describe("resolveControl", () => {
  test("should resolve to the column's values, in the column's order", () => {
    const control = resolveControl(specFor({ control: filtering("Geschlecht") }));
    expect(Option.getOrThrow(control).values).toEqual(["Weiblich", "Männlich"]);
  });

  test("should name the control after its column when the author left the label empty", () => {
    const control = resolveControl(specFor({ control: filtering("Geschlecht") }));
    expect(Option.getOrThrow(control).label).toBe("Geschlecht");
  });

  test("should prefer the author's label", () => {
    const control = resolveControl(
      specFor({ control: filtering("Geschlecht", "Nach Geschlecht") }),
    );
    expect(Option.getOrThrow(control).label).toBe("Nach Geschlecht");
  });

  test("should resolve to nothing when the column has left the table", () => {
    /* A rename in the table editor writes the csv without touching the spec. */
    const stranded = specFor({ control: filtering("Geschlecht"), csv: "Sektor,Anzahl\nBau,10" });
    expect(Option.isNone(resolveControl(stranded))).toBe(true);
  });

  test("should resolve to nothing when the column offers no choice", () => {
    const single = specFor({
      control: filtering("Einheit"),
      csv: "Sektor,Anzahl,Einheit\nBau,10,Personen\nHandel,20,Personen",
    });
    expect(Option.isNone(resolveControl(single))).toBe(true);
  });
});

describe("controlFields", () => {
  test("should quote a column name that would otherwise close the script", () => {
    const hostile = specFor({
      control: filtering('a"); alert(1); ('),
      csv: 'Sektor,Anzahl,"a""); alert(1); ("\nBau,10,x\nHandel,20,y',
    });
    const { FILTER_FIELD } = controlFields(hostile);
    expect(String(FILTER_FIELD)).toBe('"a\\"); alert(1); ("');
  });

  test("should emit empty fields when there is no control to emit", () => {
    const { FILTER_FIELD, FILTER_LABEL } = controlFields(specFor());
    expect(String(FILTER_FIELD)).toBe('""');
    expect(String(FILTER_LABEL)).toBe('""');
  });
});

describe("renameControl", () => {
  const control = filtering("Geschlecht");

  test("should follow the column it names", () => {
    /* A rename moves a column without replacing the table, so the control goes with it
       rather than being left naming something that is no longer there. */
    expect(renameControl(control, col("Geschlecht"), col("Sex"))).toEqual(filtering("Sex"));
  });

  test("should leave a control that names a different column alone", () => {
    expect(renameControl(control, col("Sektor"), col("Branche"))).toBe(control);
  });

  test("should keep a label the author typed", () => {
    const named = filtering("Geschlecht", "Nach Geschlecht");
    expect(renameControl(named, col("Geschlecht"), col("Sex"))?.label).toBe("Nach Geschlecht");
  });

  test("should have nothing to do when there is no control", () => {
    expect(renameControl(null, col("Geschlecht"), col("Sex"))).toBeNull();
  });
});
