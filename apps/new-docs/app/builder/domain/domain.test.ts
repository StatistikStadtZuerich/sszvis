import { Effect, Option } from "effect";
import { describe, expect, test } from "vitest";

import { isValidPosition, positionCode, referenceLinesCode } from "./annotations";
import { compile } from "./compile";
import {
  addedName,
  bearsRole,
  columnKinds,
  hasValues,
  nextKind,
  dateFormatOf,
  parseAs,
  rolledOver,
  renameKind,
  settleColumn,
  unsupportedPins,
  detectDelimiter,
  parse,
  parseBlock,
  parseDelimited,
  reorder,
  serialize,
  sortOrder,
  sortRows,
} from "./csv";
import { BuilderCompileError, code, comment, fill, str } from "./emit";
import { escapeHtml, host, BUNDLE, LIBRARIES } from "./host";
import { buildRecipe, parseFeature } from "./recipe";
import {
  applySample,
  bindRoles,
  initialSpec,
  switchRecipe,
  unmappedRoles,
  unmetRoles,
} from "./initial-spec";
import { findRecipe, recipes } from "./recipes";
import { isPristine, sampleFor, samples } from "./samples";
import {
  ColumnName,
  DATE,
  FeatureKey,
  OptionKey,
  optionValue,
  RecipeKey,
  RoleKey,
  summarize,
  VALUE,
  type Annotation,
  type Fields,
  type Recipe,
  type RecipeDef,
  type RecipeSummary,
  type Spec,
  type Tooltip,
} from "./spec";
import { resolveTooltip, tooltipText, type TooltipRoles } from "./tooltip";
import { identity } from "./identity";
import { utf8, zip } from "./zip";

/*
 * The spec's keys are branded. Tests author them as literals, so these three
 * are where a literal becomes a key, the same way a recipe or a form control
 * calls the brand's own `make`.
 */

const opts = (entries: Readonly<Record<string, string>>): Spec["options"] =>
  Object.fromEntries(Object.entries(entries).map(([key, value]) => [OptionKey.make(key), value]));

const mapping = (entries: Readonly<Record<string, string>>): Fields =>
  Object.fromEntries(
    Object.entries(entries).map(([key, column]) => [RoleKey.make(key), ColumnName.make(column)]),
  );

const tip = (header: string, body: readonly string[] = []): Tooltip => ({
  header: RoleKey.make(header),
  body: body.map((value) => RoleKey.make(value)),
});

const run = <A>(effect: Effect.Effect<A, BuilderCompileError>): A => Effect.runSync(effect);

const failure = <A>(effect: Effect.Effect<A, BuilderCompileError>): BuilderCompileError =>
  Effect.runSync(Effect.flip(effect));

describe("csv", () => {
  test("should read columns and rows when given a plain table", () => {
    expect(parse("a,b\n1,2\n3,4")).toEqual({
      columns: ["a", "b"],
      rows: [
        ["1", "2"],
        ["3", "4"],
      ],
    });
  });

  test("should unquote fields when they contain the delimiter or doubled quotes", () => {
    const table = parse('name,note\n"Meier, Anna","she said ""hi"""');
    expect(table.rows[0]).toEqual(["Meier, Anna", 'she said "hi"']);
  });

  test("should round-trip through serialize when a field needs quoting", () => {
    const table = parse('a,b\n"x,y",z');
    expect(parse(serialize(table))).toEqual(table);
    expect(serialize(table)).toContain('"x,y"');
  });

  test.for([
    ["a line ending in CRLF", "a,b\r\n1,2", { columns: ["a", "b"], rows: [["1", "2"]] }],
    [
      "a byte-order mark from Excel",
      "\ufeffSektor,Anzahl\nx,1",
      { columns: ["Sektor", "Anzahl"], rows: [["x", "1"]] },
    ],
    ["padding and blank lines", "a , b\n\n1 ,2\n", { columns: ["a", "b"], rows: [["1", "2"]] }],
    [
      "a row shorter than the header",
      "a,b,c\n1",
      { columns: ["a", "b", "c"], rows: [["1", "", ""]] },
    ],
    ["no input at all", "", { columns: [], rows: [] }],
    ["a header and nothing else", "a,b", { columns: ["a", "b"], rows: [] }],
  ] as const)("should read the table when the export has %s", ([, input, expected]) => {
    expect(parse(input)).toEqual(expected);
  });

  /*
   * Kinds decide which roles a column is offered for, so a misread column is a
   * wrong chart rather than an error. The awkward cases each cost a bug once:
   * `Number("Infinity")` is not NaN, and `Number("")` is 0.
   */
  test.for([
    [
      "values that agree",
      "n,d,c\n1,01.02.2020,x\n2,03.04.2021,y",
      { n: "continuous", d: "temporal", c: "nominal" },
    ],
    ["values that disagree", "a,mixed\nx,1\ny,z", { mixed: "nominal" }],
    ["an infinity", "a,b\nx,Infinity\ny,Infinity", { b: "nominal" }],
    ["a negative infinity", "a,b\nx,-Infinity\ny,-Infinity", { b: "nominal" }],
    ["a literal that overflows", "a,b\nx,1e400\ny,1e400", { b: "nominal" }],
    ["one infinity among numbers", "a,b\nx,1\ny,Infinity", { b: "nominal" }],
    ["nothing but blanks", "a,b\nx,\ny,", { b: "nominal" }],
    [
      "ordinary decimals and signs",
      "a,b,c\nx,-1.5,2e3\ny,0,+4",
      { b: "continuous", c: "continuous" },
    ],
  ] as const)("should classify the column when it holds %s", ([, csv, expected]) => {
    const kinds = columnKinds(parse(csv), {});
    for (const [column, kind] of Object.entries(expected))
      expect(kinds.get(column), column).toBe(kind);
  });

  test("should sort numbers numerically and text alphabetically, blanks last", () => {
    const table = parse("c,n\nb,10\n,2\na,9\nÄ,");
    expect(sortRows(table, 1, "asc", {}).rows.map((row) => row[1])).toEqual(["2", "9", "10", ""]);
    expect(sortRows(table, 1, "desc", {}).rows.map((row) => row[1])).toEqual(["10", "9", "2", ""]);
    expect(sortRows(table, 0, "asc", {}).rows.map((row) => row[0])).toEqual(["a", "Ä", "b", ""]);
  });

  test("should sort Swiss dates chronologically and keep ties in their original order", () => {
    const table = parse("d,x\n01.02.2021,first\n31.12.2020,second\n01.02.2021,third");
    expect(sortRows(table, 0, "asc", {}).rows.map((row) => row[1])).toEqual([
      "second",
      "first",
      "third",
    ]);
    expect(sortRows(table, 0, "desc", {}).rows.map((row) => row[1])).toEqual([
      "first",
      "third",
      "second",
    ]);
  });
});

describe("parse", () => {
  test("should read a saved header back as it stands", () => {
    /* The saved table is what the user last typed: renaming a header on the way back
       would move the caret as they clear it, and name a column the csv does not have. */
    expect(parse("a,,c\n1,2,3").columns).toEqual(["a", "", "c"]);
  });
});

describe("escaping", () => {
  test("should produce a literal that parses back to the input when str gets quotes, backslashes or newlines", () => {
    /* A header becomes `d[<str>]`; only the round trip matters, prettier renormalises the spelling. */
    for (const value of ['a"b', "a\\b", "a\nb"]) expect(JSON.parse(str(value))).toBe(value);
  });

  test("should neutralise a comment terminator when comment receives one", () => {
    expect(comment("before */ after")).not.toContain("*/");
    expect(comment("before */ after")).toContain("before");
  });

  test("should neutralise a script terminator when str or comment receives one", () => {
    /* Both reach the preview's inline `<script>`: str as a literal, comment as the banner. */
    const value = "</script><img src=x onerror=alert(1)>";
    expect(str(value)).not.toContain("</script>");
    expect(JSON.parse(str(value).replaceAll("<\\/", "</"))).toBe(value);
    expect(comment(value)).not.toContain("</script>");
    expect(comment(value)).toContain("script");
  });

  test("should flatten whitespace when comment receives newlines or padding", () => {
    expect(comment("one\ntwo")).toBe("one two");
    expect(comment("  padded  ")).toBe("padded");
  });
});

describe("optionValue", () => {
  const options = [{ key: OptionKey.make("title"), label: "Title", fallback: "Fallback" }];
  const spec = (title?: string): Spec => ({
    recipe: RecipeKey.make("r"),
    csv: "",
    fields: {},
    options: title === undefined ? {} : opts({ title }),
    features: [],
    tooltip: tip(""),
    annotations: [],
    kinds: {},
  });

  test("should return the typed value when set, the fallback when blank and nothing when unknown", () => {
    expect(optionValue(options, spec("Typed"), OptionKey.make("title"))).toBe("Typed");
    expect(optionValue(options, spec(), OptionKey.make("title"))).toBe("Fallback");
    expect(optionValue(options, spec("   "), OptionKey.make("title"))).toBe("Fallback");
    expect(optionValue(options, spec(), OptionKey.make("nope"))).toBe("");
  });
});

const RECIPE: RecipeSummary = {
  key: RecipeKey.make("demo"),
  label: "Demo",
  roles: [
    { key: RoleKey.make("cat"), label: "Category", kind: "category", hint: "" },
    { key: RoleKey.make("num"), label: "Value", kind: "number", hint: "" },
    {
      key: RoleKey.make("series"),
      label: "Series",
      kind: "category",
      hint: "",
      optional: true,
    },
  ],
  options: [{ key: OptionKey.make("title"), label: "Title", fallback: "Demo" }],
  features: [{ key: FeatureKey.make("one"), label: "One", hint: "" }],
  sample: "beschaeftigte-sektor",
  tooltipFeature: FeatureKey.make("one"),
  defaultTooltip: tip("num"),
  annotationAxes: [{ role: RoleKey.make("num"), axis: "y", kind: "number", label: "Value axis" }],
};

const DEMO_CSV = "Name,Anzahl\nx,1\ny,2";

describe("initialSpec", () => {
  /* The binding rules themselves live with `bindRoles`; these cover what `initialSpec` adds. */
  test("should leave a required role empty when no column of its kind exists", () => {
    /* Empty, not a wrong column: an unmapped role stops the compile, a wrong one draws nonsense. */
    const spec = initialSpec(RECIPE, "Name,Ort\nx,a\ny,b");
    expect(spec.fields[RoleKey.make("num")]).toBe("");
  });

  test("should open with every feature on, the table given and no unmapped roles when a recipe is chosen", () => {
    const spec = initialSpec(RECIPE, DEMO_CSV);
    expect(spec.features).toEqual(["one"]);
    expect(spec.csv).toBe(DEMO_CSV);
    expect(unmappedRoles(RECIPE, spec)).toEqual([]);
  });

  test("should open on the sample the recipe names when no table is given", () => {
    expect(initialSpec(RECIPE).csv).toBe(sampleFor("beschaeftigte-sektor").csv);
  });
});

describe("sample data", () => {
  test("should offer every sample under a stable key", () => {
    for (const sample of samples) expect(sampleFor(sample.key)).toBe(sample);
  });

  test("should fall back to the first sample rather than fail when a recipe names one this build lacks", () => {
    expect(sampleFor("no-such-sample")).toBe(samples[0]);
  });

  test("should open each recipe on a sample its required roles can bind", () => {
    for (const recipe of recipes) {
      expect(
        unmetRoles(summarize(recipe), parse(sampleFor(recipe.sample).csv), {}),
        recipe.key,
      ).toEqual([]);
    }
  });

  test("should keep the chart the user built when the data underneath it is replaced", () => {
    const spec: Spec = {
      ...initialSpec(RECIPE, DEMO_CSV),
      options: opts({ title: "Mine" }),
      features: [],
      annotations: [
        {
          kind: "reference-line",
          role: RoleKey.make("num"),
          at: { kind: "mean" },
          label: "Mittel",
        },
      ],
    };
    const next = applySample(spec, RECIPE, "Bezirk,Total\na,1\nb,2");
    expect(next.recipe).toBe(spec.recipe);
    expect(next.options).toEqual(spec.options);
    expect(next.features).toEqual(spec.features);
    expect(next.tooltip).toEqual(spec.tooltip);
    expect(next.annotations).toEqual(spec.annotations);
  });

  test("should rebind the roles to the new columns when the data is replaced", () => {
    const spec = initialSpec(RECIPE, DEMO_CSV);
    const next = applySample(spec, RECIPE, "Bezirk,Total\na,1\nb,2");
    expect(next.csv).toBe("Bezirk,Total\na,1\nb,2");
    expect(next.fields).toMatchObject({ cat: "Bezirk", num: "Total" });
    expect(unmappedRoles(RECIPE, next)).toEqual([]);
  });

  test("should keep a role on the column it already names when the new table also has it", () => {
    const spec = initialSpec(RECIPE, DEMO_CSV);
    const next = applySample(spec, RECIPE, "Anzahl,Name\n1,x\n2,y");
    expect(next.fields).toMatchObject({ cat: "Name", num: "Anzahl" });
  });

  test("should leave a role unmapped rather than guess when the new table does not fit", () => {
    const spec = initialSpec(RECIPE, DEMO_CSV);
    const next = applySample(spec, RECIPE, "Ort,Bezirk\na,b");
    expect(unmappedRoles(RECIPE, next)).toContain("num");
  });

  test("should call a table pristine only while it is a sample no one has touched", () => {
    const untouched = samples[0];
    if (untouched === undefined) throw new Error("no samples");
    expect(isPristine(untouched.csv)).toBe(true);
    expect(isPristine(`${untouched.csv}\nNeu,1`)).toBe(false);
  });
});

describe("samples", () => {
  test("should name each table once", () => {
    expect(new Set(samples.map((sample) => sample.key)).size).toBe(samples.length);
  });

  /*
   * `isPristine` compares the whole CSV, and the table editor rewrites it through
   * `serialize` on every edit. A sample that does not survive that round-trip is
   * dirty the instant it is loaded, so the picker would warn before anything was
   * touched - and a field containing the delimiter is exactly the case that breaks.
   */
  test.each(samples.map((sample) => [sample.key, sample] as const))(
    "should leave %s unchanged through the editor's own round-trip",
    (_key, sample) => {
      expect(serialize(parse(sample.csv))).toBe(sample.csv);
      expect(isPristine(serialize(parse(sample.csv)))).toBe(true);
    },
  );

  /* Every sample is offered under every chart type, so each one has to be a real table. */
  test.each(samples.map((sample) => [sample.key, sample] as const))(
    "should give %s at least two columns and a row of data",
    (_key, sample) => {
      const table = parse(sample.csv);
      expect(table.columns.length).toBeGreaterThanOrEqual(2);
      expect(table.rows.length).toBeGreaterThan(0);
      expect(table.rows.every((row) => row.length === table.columns.length)).toBe(true);
    },
  );
});

const LINE: RecipeSummary = {
  ...RECIPE,
  key: RecipeKey.make("line"),
  roles: [
    { key: RoleKey.make("date"), label: "Date", kind: "date", hint: "" },
    { key: RoleKey.make("num"), label: "Value", kind: "number", hint: "" },
    {
      key: RoleKey.make("series"),
      label: "Series",
      kind: "category",
      hint: "",
      optional: true,
    },
  ],
  options: [
    { key: OptionKey.make("title"), label: "Title", fallback: "Line" },
    { key: OptionKey.make("xLabel"), label: "X", fallback: "" },
  ],
  features: [
    { key: FeatureKey.make("two"), label: "Two", hint: "" },
    { key: FeatureKey.make("hid"), label: "", hint: "", hidden: true },
  ],
  tooltipFeature: FeatureKey.make("two"),
  defaultTooltip: tip("num", ["series"]),
  annotationAxes: [
    { role: RoleKey.make("date"), axis: "x", kind: "date", label: "Date axis" },
    { role: RoleKey.make("num"), axis: "y", kind: "number", label: "Value axis" },
  ],
};

describe("pinned column kinds", () => {
  /* A year reads as a number, which is what the pin is there to overrule. */
  const YEARS = "Jahr,Anzahl\n1999,10\n2000,20";
  const pin = (column: string, kind: "nominal" | "continuous" | "temporal") => ({
    [ColumnName.make(column)]: kind,
  });

  test("should bind a pinned column to the role its pin fits rather than the one its values suggest", () => {
    const table = parse(YEARS);
    /* Both columns read as numbers, so the label role takes the first of them. */
    expect(bindRoles(RECIPE, table, {})).toMatchObject({ cat: "Jahr", num: "Anzahl" });
    /* Pinning the measure as text leaves only the year to be measured. */
    expect(bindRoles(RECIPE, table, pin("Anzahl", "nominal"))).toMatchObject({
      cat: "Anzahl",
      num: "Jahr",
    });
  });

  test("should ignore a pin naming a column the table does not have", () => {
    const table = parse(YEARS);
    expect(columnKinds(table, pin("Fehlt", "temporal")).get("Fehlt")).toBeUndefined();
    expect(bindRoles(RECIPE, table, pin("Fehlt", "nominal"))).toEqual(bindRoles(RECIPE, table, {}));
  });

  test("should change which roles a recipe cannot fill when a pin takes its last fitting column", () => {
    const table = parse(YEARS);
    expect(unmetRoles(RECIPE, table, {})).toEqual([]);
    const both = { ...pin("Jahr", "nominal"), ...pin("Anzahl", "nominal") };
    expect(unmetRoles(RECIPE, table, both).map((role) => role.key)).toEqual(["num"]);
  });

  /*
   * NOTE: dates rather than numbers, because the collator is numeric-aware - it
   * already orders "9" before "10" - so a column of plain digits sorts the same
   * whether it is read as a measure or as labels. Dates are where the two
   * comparators genuinely part: by date, or by the day each one happens to start
   * with.
   */
  test("should sort a column pinned as text by its text, not by the dates it holds", () => {
    const table = parse("d\n01.02.2020\n10.01.2019\n05.03.2018");
    expect(sortOrder(table, 0, "asc", {})).toEqual([2, 1, 0]);
    expect(sortOrder(table, 0, "asc", pin("d", "nominal"))).toEqual([0, 2, 1]);
  });

  /*
   * Renaming one column onto another's name. The names are not unique until the
   * new one settles, so a pin moved by the name a header shows mid-edit would be
   * taken off whichever column already answered to it.
   */
  test("should move only the edited column's pin when its typed name collides with another", () => {
    const table = parse("Jahr,Wert\n1,2");
    const typed = { ...table, columns: [ColumnName.make("Wert"), ColumnName.make("Wert")] };
    const kinds = { ...pin("Jahr", "temporal"), ...pin("Wert", "nominal") };
    const next = settleColumn(typed, 0, ColumnName.make("Jahr"), kinds);
    expect(next.table.columns).toEqual(["Wert 2", "Wert"]);
    /* The column the user never touched keeps what it was given. */
    expect(next.kinds).toEqual({ "Wert 2": "temporal", Wert: "nominal" });
  });

  test("should name an added column distinctly from one the user has already typed", () => {
    /* Two columns of one name are one column to everything that reads them by name. */
    const columns = [ColumnName.make("Spalte 2")];
    expect(addedName(columns)).toBe("Spalte 2 2");
    expect(addedName([...columns, addedName(columns)])).toBe("Spalte 3");
  });

  test("should report values a role will not be able to read, however the column is pinned", () => {
    const table = parse("Jahr,Datum,Wort,Menge\n1999,01.02.2020,x,20892");
    /* The case this exists for: a column of years is readable as dates, through the
       year parser rather than the date one. */
    expect(bearsRole(table, ColumnName.make("Jahr"), "date")).toBe(true);
    expect(bearsRole(table, ColumnName.make("Datum"), "date")).toBe(true);
    /* Neither notation takes words, or a number too large to be a year. */
    expect(bearsRole(table, ColumnName.make("Wort"), "date")).toBe(false);
    expect(bearsRole(table, ColumnName.make("Menge"), "date")).toBe(false);
    expect(bearsRole(table, ColumnName.make("Wort"), "number")).toBe(false);
    /* An unbound role has nothing to say. */
    expect(bearsRole(table, ColumnName.make(""), "date")).toBe(true);
  });

  test("should move on by one and come back round when a column's kind is clicked", () => {
    expect(nextKind("nominal")).toBe("continuous");
    expect(nextKind("continuous")).toBe("temporal");
    expect(nextKind("temporal")).toBe("nominal");
  });

  test("should report a pin the column's values will not bear", () => {
    const table = parse("Wort,Zahl,Datum,Menge\nx,1999,01.02.2020,20892");
    expect(unsupportedPins(table, pin("Wort", "nominal"))).toEqual(new Set());
    expect(unsupportedPins(table, pin("Wort", "continuous"))).toEqual(new Set(["Wort"]));
    /* Too many digits to be a year, and not a date either. */
    expect(unsupportedPins(table, pin("Menge", "temporal"))).toEqual(new Set(["Menge"]));
    /* Four digits or fewer, so pinning it to dates is a reading it can bear. */
    expect(unsupportedPins(table, pin("Zahl", "temporal"))).toEqual(new Set());
    /* The values bear it, so pinning what was detected anyway says nothing. */
    expect(unsupportedPins(table, pin("Datum", "temporal"))).toEqual(new Set());
    /* A column of dates reads as text quite happily. */
    expect(unsupportedPins(table, pin("Datum", "nominal"))).toEqual(new Set());
  });

  test("should report a column with nothing in it as unable to bear a reading", () => {
    /* `every` on no values is true, so an empty column would otherwise be held to
       be dates, satisfy a chart's date role, and draw nothing at all. */
    const table = parse("Leer\n\n");
    expect(unsupportedPins(table, pin("Leer", "temporal"))).toEqual(new Set(["Leer"]));
    expect(unsupportedPins(table, pin("Leer", "nominal"))).toEqual(new Set());
    expect(bearsRole(table, ColumnName.make("Leer"), "date")).toBe(false);
    expect(hasValues(table, ColumnName.make("Leer"))).toBe(false);
  });

  test("should read a day that rolls over the way the chart will, and say where it lands", () => {
    /* The chart plots it, so the column is still dates - refusing it would cost the
       column its whole reading over one typo, and would disagree with the code the
       builder writes. The reader is told which day it lands on instead. */
    const table = parse("Tag\n01.03.2020\n31.02.2020");
    expect(columnKinds(table, {}).get("Tag")).toBe("temporal");
    expect(bearsRole(table, ColumnName.make("Tag"), "date")).toBe(true);
    expect(rolledOver(table, ColumnName.make("Tag"))).toEqual([
      { value: "31.02.2020", on: new Date(2020, 2, 2) },
    ]);
    /* A day that exists is not reported, in a leap year or out of one. */
    expect(rolledOver(parse("Tag\n29.02.2020"), ColumnName.make("Tag"))).toEqual([]);
    expect(rolledOver(parse("Tag\n29.02.2021"), ColumnName.make("Tag"))).toHaveLength(1);
  });

  test("should read years only when told to, not on the column's own evidence", () => {
    /* `%Y` takes one to four digits, so counts would read as years. */
    const table = parse("Jahr\n1999\n2000");
    expect(columnKinds(table, {}).get("Jahr")).toBe("continuous");
    expect(columnKinds(table, pin("Jahr", "temporal")).get("Jahr")).toBe("temporal");
    /* Pinned, it bears a date role - which is the whole point of pinning it. */
    expect(bearsRole(table, ColumnName.make("Jahr"), "date")).toBe(true);
    expect(dateFormatOf(["1999", "2000"])).toBe("year");
    expect(dateFormatOf(["17.08.2014"])).toBe("swiss");
    expect(dateFormatOf(["17.08.2014", "1999"])).toBeUndefined();
  });

  test("should keep a pin under the column's new name when it is renamed", () => {
    const kinds = pin("Jahr", "nominal");
    expect(renameKind(kinds, ColumnName.make("Jahr"), ColumnName.make("Year"))).toEqual({
      Year: "nominal",
    });
    /* A pin for another column is left where it is. */
    expect(renameKind(kinds, ColumnName.make("Anzahl"), ColumnName.make("Count"))).toEqual(kinds);
  });

  test("should drop the pins when the table is replaced by a sample", () => {
    const spec: Spec = { ...initialSpec(RECIPE, YEARS), kinds: pin("Jahr", "nominal") };
    expect(applySample(spec, RECIPE, DEMO_CSV).kinds).toEqual({});
  });

  test("should emit the same code for a pinned spec as for an unpinned one", async () => {
    const recipe = Effect.runSync(findRecipe("bar-chart-vertical"));
    const spec = initialSpec(summarize(recipe), YEARS);
    const pinned: Spec = { ...spec, kinds: pin("Jahr", "nominal") };
    /* A pin steers which column fills which role; it must not reach the code. The
       fields are held equal so the two specs differ in nothing but the pin. */
    expect(Effect.runSync(compile(recipe, { ...pinned, fields: spec.fields }))).toBe(
      Effect.runSync(compile(recipe, spec)),
    );
  });

  test("should hand every recipe a callable kind accessor", () => {
    /* No recipe reads it, so nothing else would notice if it stopped arriving. */
    for (const recipe of recipes) {
      let seen: unknown;
      const probe: typeof recipe = {
        ...recipe,
        scalars: (spec, option, kind) => {
          seen = kind;
          return recipe.scalars(spec, option, kind);
        },
      };
      Effect.runSync(compile(probe, initialSpec(summarize(recipe))));
      expect(typeof seen, recipe.key).toBe("function");
    }
  });
});

describe("bindRoles", () => {
  test("should let a required category role take a date or number column, preferring text", () => {
    expect(bindRoles(RECIPE, parse("Jahr,Anzahl\n2020,1\n2021,2"), {})).toMatchObject({
      cat: "Jahr",
      num: "Anzahl",
    });
    expect(bindRoles(RECIPE, parse("Datum,Anzahl\n01.01.2020,1"), {})).toMatchObject({
      cat: "Datum",
      num: "Anzahl",
    });
  });

  test("should bind an optional role only to a column of exactly its kind", () => {
    /* A spare date or number column must not become a series on its own. */
    const fields = bindRoles(RECIPE, parse("Datum,Name,Anzahl\n01.01.2020,x,1"), {});
    expect(fields).toEqual({ cat: "Name", num: "Anzahl", series: "" });
  });

  test("should bind the date role before a category role competes for the only date column", () => {
    const fields = bindRoles(LINE, parse("Datum,Anzahl\n01.01.2020,1"), {});
    expect(fields).toEqual({ date: "Datum", num: "Anzahl", series: "" });
  });

  test("should keep a prior binding when its column still fits, and drop it when it does not", () => {
    const table = parse("Name,Anzahl,Menge\nx,1,2");
    expect(bindRoles(RECIPE, table, {}, mapping({ num: "Menge" }))[RoleKey.make("num")]).toBe(
      "Menge",
    );
    expect(bindRoles(RECIPE, table, {}, mapping({ num: "Name" }))[RoleKey.make("num")]).toBe(
      "Anzahl",
    );
  });
});

describe("unmetRoles", () => {
  test("should name the required roles the table cannot fill", () => {
    expect(unmetRoles(LINE, parse("Name,Anzahl\nx,1"), {}).map((role) => role.key)).toEqual([
      "date",
    ]);
    expect(unmetRoles(RECIPE, parse("Name,Anzahl\nx,1"), {})).toEqual([]);
    expect(unmetRoles(RECIPE, parse("Name\nx"), {})).toHaveLength(1);
  });
});

describe("switchRecipe", () => {
  test("should keep the data, shared bindings, shared options, pinned kinds and same-role annotations, and reset the rest", () => {
    const yLine = {
      kind: "reference-line",
      role: RoleKey.make("num"),
      at: { kind: "mean" },
      label: "",
    } as const;
    const spec: Spec = {
      ...initialSpec(RECIPE, DEMO_CSV),
      csv: "Datum,Anzahl,Menge\n01.01.2020,1,2",
      fields: mapping({ cat: "Datum", num: "Menge", series: "" }),
      options: opts({ title: "Mine", unit: "kg" }),
      features: [],
      tooltip: tip("cat", ["num"]),
      annotations: [yLine],
      /* Pinned to the kind it already reads as, so it proves the pin travels
         without also moving a binding and confusing what this test shows. */
      kinds: { [ColumnName.make("Anzahl")]: "continuous" },
    };
    expect(switchRecipe(spec, RECIPE, LINE)).toEqual({
      recipe: "line",
      csv: spec.csv,
      fields: { date: "Datum", num: "Menge", series: "" },
      options: opts({ title: "Mine" }),
      /* The hidden feature is not a checkbox, so it is not listed. */
      features: ["two"],
      tooltip: LINE.defaultTooltip,
      annotations: [yLine],
      kinds: { Anzahl: "continuous" },
    });
  });

  test("should drop an annotation whose role the new recipe positions by another kind", () => {
    const xDate = {
      kind: "reference-line",
      role: RoleKey.make("date"),
      at: { kind: "value", value: "01.01.2020" },
      label: "",
    } as const;
    const spec: Spec = { ...initialSpec(LINE, DEMO_CSV), annotations: [xDate] };
    const bar = {
      ...RECIPE,
      annotationAxes: [{ role: RoleKey.make("date"), axis: "x", kind: "category", label: "" }],
    } as const;
    expect(switchRecipe(spec, LINE, bar).annotations).toEqual([]);
  });

  test("should keep an annotation whose role the new recipe draws on the other axis", () => {
    const valueLine = {
      kind: "reference-line",
      role: RoleKey.make("num"),
      at: { kind: "mean" },
      label: "Mittel",
    } as const;
    const spec: Spec = { ...initialSpec(RECIPE, DEMO_CSV), annotations: [valueLine] };
    /* The same chart lying down: the value axis is still the value axis, drawn along x. */
    const horizontal = {
      ...RECIPE,
      key: RecipeKey.make("horizontal"),
      annotationAxes: [
        { role: RoleKey.make("num"), axis: "x", kind: "number", label: "Value axis" },
      ],
    } as const;
    expect(switchRecipe(spec, RECIPE, horizontal).annotations).toEqual([valueLine]);
  });
});

describe("unmappedRoles", () => {
  const spec = (fields: Readonly<Record<string, string>>): Spec => ({
    ...initialSpec(RECIPE, DEMO_CSV),
    fields: mapping(fields),
  });

  test("should report a required role when it has no column", () => {
    expect(unmappedRoles(RECIPE, spec({ cat: "", num: "Anzahl" }))).toEqual(["cat"]);
  });

  test("should report a required role when its column is no longer in the table", () => {
    expect(unmappedRoles(RECIPE, spec({ cat: "Gone", num: "Anzahl" }))).toEqual(["cat"]);
  });

  test("should report nothing when only an optional role is empty", () => {
    expect(unmappedRoles(RECIPE, spec({ cat: "Name", num: "Anzahl", series: "" }))).toEqual([]);
  });
});

describe("summarize", () => {
  const recipe: Recipe = {
    key: RecipeKey.make("demo"),
    label: "Demo",
    template: "const x = 1;",
    roles: RECIPE.roles,
    options: RECIPE.options,
    features: [
      { key: FeatureKey.make("one"), label: "One", hint: "h", fragments: { a: ["x"] } },
      {
        key: FeatureKey.make("two"),
        label: "",
        hint: "",
        hidden: true,
        fragments: { a: ["y"] },
      },
    ],
    scalars: () => ({}),
    implied: () => [],
    sample: RECIPE.sample,
    tooltipFeature: FeatureKey.make("one"),
    defaultTooltip: RECIPE.defaultTooltip,
    annotationAxes: RECIPE.annotationAxes,
  };

  test("should carry the roles, options, feature labels, tooltip default, axes and sample when summarising a recipe", () => {
    const summary = summarize(recipe);
    expect(summary.roles).toHaveLength(3);
    expect(summary.options).toHaveLength(1);
    expect(summary.features).toEqual([
      { key: "one", label: "One", hint: "h" },
      { key: "two", label: "", hint: "", hidden: true },
    ]);
    expect(summary.sample).toBe(RECIPE.sample);
    expect(summary.defaultTooltip).toEqual(RECIPE.defaultTooltip);
    expect(summary.annotationAxes).toEqual(RECIPE.annotationAxes);
  });

  test("should survive a structured clone when summarising a recipe", () => {
    /* The summary crosses to the worker; a recipe itself cannot, because of its functions. */
    expect(() => structuredClone(summarize(recipe))).not.toThrow();
    expect(() => structuredClone(recipe)).toThrow();
  });
});

describe("host", () => {
  test("should reference the bundle's file names and chart element when rendering the page", () => {
    const page = host("Title");
    expect(page).toContain(`src="${BUNDLE.chart}"`);
    expect(page).toContain(`"${BUNDLE.data}"`);
    expect(page).toContain('id="sszvis-chart"');
  });

  test("should define the config with data and id when rendering the page", () => {
    /* A chart's route to its rows is `config.data`; its only target is `config.id`. */
    expect(host("Title")).toMatch(/var config = \{[\s\S]*data:[\s\S]*id:[\s\S]*\}/);
  });

  test("should leave the page untouched when a recipe asks for no assets and no libraries", () => {
    /* Six of the seven recipes load nothing besides their data, and their page must not change. */
    expect(host("Title", [], [])).toBe(host("Title"));
  });

  test("should name an asset in the config when a recipe loads a second file", () => {
    /*
     * The chart reaches its geometry the same way it reaches its rows: a key on
     * `config`, holding the name the file has in the bundle beside it.
     */
    const page = host("Title", [{ key: "topology", path: "topo.json", source: "/anywhere.json" }]);
    expect(page).toContain('topology: "topo.json"');
    /* The source is where the builder read the bytes. Shipping it would point the export at the app. */
    expect(page).not.toContain("/anywhere.json");
  });

  test("should add a library to the page when a recipe asks for one", () => {
    const page = host("Title", [], ["topojson"]);
    expect(page).toContain(`<script src="${LIBRARIES.topojson}"></script>`);
    /* Above the chart, or the chart would call it before it exists. */
    expect(page.indexOf("topojson-client")).toBeLessThan(page.indexOf(BUNDLE.chart));
  });

  test("should ignore a library it does not know rather than emit a broken tag", () => {
    expect(host("Title", [], ["not-a-library"])).toBe(host("Title"));
  });

  test("should keep markup inert when the title contains a closing tag and a script", () => {
    expect(host("</title><script>alert(1)</script>")).not.toContain("<script>alert(1)");
  });

  test("should escape every character that ends a quoted attribute or opens a tag", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
    expect(escapeHtml("a' onerror='x")).not.toContain("'");
  });
});

describe("zip", () => {
  test("should write a well-formed archive when given two entries", () => {
    const bytes = zip([
      { name: "a.txt", content: utf8("one") },
      { name: "b.txt", content: utf8("two") },
    ]);
    const view = new DataView(bytes.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    const end = bytes.length - 22;
    expect(view.getUint32(end, true)).toBe(0x06054b50);
    expect(view.getUint16(end + 10, true)).toBe(2);
    const size = view.getUint32(end + 12, true);
    const offset = view.getUint32(end + 16, true);
    expect(offset + size).toBe(end);
    expect(view.getUint32(offset, true)).toBe(0x02014b50);
  });

  test("should produce identical bytes when zipping the same input twice", () => {
    const entry = [{ name: "a.txt", content: utf8("one") }];
    expect(Array.from(zip(entry))).toEqual(Array.from(zip(entry)));
  });

  test("should store an image beside the sources", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const bytes = zip([
      { name: "chart.js", content: utf8("x") },
      { name: "fallback.png", content: png },
    ]);
    expect(Array.from(bytes).join(",")).toContain(Array.from(png).join(","));
    expect(new TextDecoder().decode(bytes)).toContain("fallback.png");
  });

  test("should store text verbatim when it contains replacement patterns", () => {
    const text = 'const k = "Umsatz $& Kosten";';
    expect(new TextDecoder().decode(zip([{ name: "chart.js", content: utf8(text) }]))).toContain(
      text,
    );
  });
});

/*
 * Layout before the formatter. Prettier normalises indentation away in the
 * snapshots, but cannot touch a fragment inside a template literal, so what
 * `fill` and `compile` hand over is pinned here.
 */
describe("fill", () => {
  test("should indent every fragment line to the hole's column when filling a block", () => {
    expect(run(fill("start\n    // {{block:body}}\nend", {}, { body: ["a", "b"] }))).toBe(
      "start\n    a\n    b\nend",
    );
    /* A fragment may itself span lines, and a blank line stays blank rather than padded. */
    expect(run(fill("  // {{block:body}}", {}, { body: ["a", "", "b\nc"] }))).toBe(
      "  a\n\n  b\n  c",
    );
  });

  test("should remove the marker line when no fragment targets a block hole", () => {
    expect(run(fill("a\n  // {{block:body}}\nb", {}, {}))).toBe("a\nb");
    /* Trailing whitespace after the marker must not hide the hole. */
    expect(run(fill("  // {{block:body}}  ", {}, { body: ["x"] }))).toBe("  x");
  });

  test("should substitute a scalar when its hole appears in the template", () => {
    expect(run(fill("const a = __VALUE__;", { VALUE: code("1") }, {}))).toBe("const a = 1;");
  });

  test("should fail at the emit stage naming every hole when a scalar has no value", () => {
    const error = failure(fill("__A__ __B__", {}, {}));
    expect(error).toBeInstanceOf(BuilderCompileError);
    expect(error.stage).toBe("emit");
    expect(error.message).toMatch(/A, B/);
  });
});

describe("buildRecipe", () => {
  const def = (over: Partial<RecipeDef> = {}): RecipeDef => ({
    key: RecipeKey.make("demo"),
    label: "Demo",
    roles: [],
    options: [],
    features: [FeatureKey.make("thing")],
    scalars: () => ({}),
    implied: () => [],
    sample: "",
    tooltipFeature: FeatureKey.make(""),
    defaultTooltip: tip(""),
    annotationAxes: [],
    ...over,
  });

  const chart = ["const a = 1;", "// {{block:body}}"].join("\n");
  const region = (hole: string) => `// #region ${hole}\nconst x = 1;\n// #endregion`;

  test("should build when every region names a hole the chart declares", () => {
    const recipe = run(buildRecipe(def(), { chart, thing: region("body") }));
    expect(recipe.features[0]?.fragments.body).toEqual(["const x = 1;"]);
  });

  test("should fail naming the feature and the hole when a region targets a hole chart.ts has not got", () => {
    /* Without this the feature parses, renders a checkbox, and emits nothing when ticked. */
    const error = failure(buildRecipe(def(), { chart, thing: region("nope") }));
    expect(error.stage).toBe("recipe");
    expect(error.message).toMatch(/thing\.tmpl -> nope/);
  });

  test("should accept a region for a hole compile.ts consumes instead of the template", () => {
    /* `actionTypes` has no {{block:}} anywhere: compile.ts folds it into ACTIONS_TYPE. */
    const recipe = run(buildRecipe(def(), { chart, thing: region("actionTypes") }));
    expect(recipe.features[0]?.fragments.actionTypes).toEqual(["const x = 1;"]);
  });

  test("should fail when implied names a key that is not a hidden feature of the recipe", () => {
    const hidden = `// #hidden\n${region("body")}`;
    const error = failure(
      buildRecipe(def({ implied: () => [FeatureKey.make("thnig")] }), {
        chart,
        thing: hidden,
      }),
    );
    expect(error.stage).toBe("recipe");
    expect(error.message).toMatch(/thnig/);
  });

  test("should see a key that implied only names for an annotated spec", () => {
    const hidden = `// #hidden\n${region("body")}`;
    const error = failure(
      buildRecipe(
        def({
          implied: (spec) => (spec.annotations.length > 0 ? [FeatureKey.make("typo")] : []),
        }),
        {
          chart,
          thing: hidden,
        },
      ),
    );
    expect(error.message).toMatch(/typo/);
  });

  test("should have built every shipped recipe, including the indirect actionTypes hole", () => {
    expect(recipes.length).toBeGreaterThan(0);
    for (const recipe of recipes) expect(recipe.features.length, recipe.key).toBeGreaterThan(0);
    /* `actionTypes` has no {{block:}} anywhere, so a shipped feature must exercise that path. */
    const withActionTypes = recipes.flatMap((recipe) =>
      recipe.features.filter((feature) => feature.fragments.actionTypes !== undefined),
    );
    expect(withActionTypes.length).toBeGreaterThan(0);
  });
});

describe("parseFeature", () => {
  test("should read the label, hint, scalar and region when a template declares them", () => {
    const source = [
      "// #label Tooltip",
      "// #hint Shows the value.",
      "// #scalar BAR_FILL highlight",
      "const ignored = 1;",
      "// #region body",
      "  const a = 1;",
      "  const b = 2;",
      "// #endregion",
    ].join("\n");
    const feature = run(parseFeature("tooltip", source));
    expect(feature.label).toBe("Tooltip");
    expect(feature.hint).toBe("Shows the value.");
    expect(feature.scalars?.BAR_FILL).toBe("highlight");
    expect(feature.fragments.body).toEqual(["const a = 1;", "const b = 2;"]);
  });

  test("should dedent a region by its common indentation when it is written indented", () => {
    const feature = run(parseFeature("f", "// #region body\n    x\n      y\n// #endregion"));
    expect(feature.fragments.body).toEqual(["x", "  y"]);
  });

  test("should ignore lines when they sit outside every region", () => {
    const feature = run(parseFeature("f", "const ctx = 1;\n// #region body\nx\n// #endregion"));
    expect(Object.values(feature.fragments).flat()).toEqual(["x"]);
  });

  test("should mark a feature hidden when the template says #hidden, and not otherwise", () => {
    expect(run(parseFeature("f", "// #hidden\n// #region body\nx\n// #endregion")).hidden).toBe(
      true,
    );
    expect(run(parseFeature("f", "// #region body\nx\n// #endregion")).hidden).toBeUndefined();
  });

  test("should use the file name as label when no #label is given", () => {
    expect(run(parseFeature("mean-line", "// #region body\nx\n// #endregion")).label).toBe(
      "mean-line",
    );
  });

  test("should fail naming the unclosed region when a #region has no #endregion", () => {
    /* An unclosed region also contributes nothing, so a bare failure check would pass for the wrong reason. */
    const error = failure(parseFeature("f", "// #region body\nx"));
    expect(error.stage).toBe("feature");
    expect(error.message).toMatch(/unclosed/);
  });

  test("should fail when a template has neither a region nor a scalar", () => {
    expect(failure(parseFeature("f", "const x = 1;")).stage).toBe("feature");
  });
});

describe("compile", () => {
  const recipe = (features: Recipe["features"], implied: readonly string[] = []): Recipe => ({
    key: RecipeKey.make("demo"),
    label: "Demo",
    template: ["const before = 1;", "  // {{block:actions}}", "type A = __ACTIONS_TYPE__;"].join(
      "\n",
    ),
    roles: [],
    options: [],
    features,
    scalars: () => ({}),
    implied: () => implied.map((key) => FeatureKey.make(key)),
    sample: "",
    tooltipFeature: FeatureKey.make(""),
    defaultTooltip: tip(""),
    annotationAxes: [],
  });

  const spec = (keys: readonly string[]): Spec => ({
    recipe: RecipeKey.make("demo"),
    csv: "",
    fields: {},
    options: {},
    features: keys.map((key) => FeatureKey.make(key)),
    tooltip: tip(""),
    annotations: [],
    kinds: {},
  });

  const feature = (key: string, fragments: Record<string, string[]>) => ({
    key: FeatureKey.make(key),
    label: key,
    hint: "",
    fragments,
  });

  test("should wrap and indent the actions block when a feature fills it", () => {
    const out = run(
      compile(recipe([feature("a", { actions: ["select(state) {}"] })]), spec(["a"])),
    );
    expect(out).toContain(["  actions: {", "    select(state) {}", "  },"].join("\n"));
  });

  test("should include a hidden feature only when the recipe implies it, whatever the spec lists", () => {
    const hidden = {
      ...feature("h", { actions: ["hid(state) {}"] }),
      hidden: true,
    };
    expect(run(compile(recipe([hidden], ["h"]), spec([])))).toContain("hid(state) {}");
    expect(run(compile(recipe([hidden], []), spec(["h"])))).not.toContain("hid(state) {}");
  });

  test("should omit the actions wrapper when no feature fills it", () => {
    expect(run(compile(recipe([]), spec([])))).not.toContain("actions:");
  });

  test("should spell the actions type as Record<string, never> when no feature declares one", () => {
    /* `type A = {}` means "anything non-nullish", not "none". */
    expect(run(compile(recipe([]), spec([])))).toContain("type A = Record<string, never>;");
  });

  test("should build the actions type from the declared members when a feature declares them", () => {
    const out = run(
      compile(
        recipe([feature("a", { actionTypes: ["select: (state: S) => void;"] })]),
        spec(["a"]),
      ),
    );
    expect(out).toContain("select: (state: S) => void;");
    expect(out).not.toContain("Record<string, never>");
  });

  test("should separate fragments with a blank line when one spans lines, but not between one-liners", () => {
    const many = run(
      compile(
        recipe([
          feature("a", { actions: ["one() {", "}"] }),
          feature("b", { actions: ["two() {", "}"] }),
        ]),
        spec(["a", "b"]),
      ),
    );
    /* Prettier keeps a blank line between statements and re-indents everything else. */
    expect(many).toMatch(/\}\n\n\s*two\(\) \{/);
    const few = run(
      compile(
        recipe([feature("a", { actions: ["one();"] }), feature("b", { actions: ["two();"] })]),
        spec(["a", "b"]),
      ),
    );
    expect(few).toMatch(/one\(\);\n\s*two\(\);/);
  });

  test("should let a feature's scalar win when the recipe declares the same one", () => {
    const base = recipe([
      {
        ...feature("a", { actions: ["x();"] }),
        scalars: { FILL: code("loud") },
      },
    ]);
    const out = run(
      compile(
        {
          ...base,
          template: "const f = __FILL__;",
          scalars: () => ({ FILL: code("quiet") }),
        },
        spec(["a"]),
      ),
    );
    expect(out).toBe("const f = loud;");
  });
});

describe("annotations", () => {
  const axes = [
    { role: DATE, axis: "x", kind: "date", label: "Date axis" },
    { role: VALUE, axis: "y", kind: "number", label: "Value axis" },
  ] as const;
  const line = (role: RoleKey, at: Annotation["at"], label = ""): Annotation => ({
    kind: "reference-line",
    role,
    at,
    label,
  });

  test("should read a value under the notation it is written in", () => {
    expect(parseAs("swiss", "1.3.2020")).toEqual(Option.some(new Date(2020, 2, 1)));
    expect(parseAs("swiss", "2020-03-01")).toEqual(Option.none());
    expect(parseAs("year", "1999")).toEqual(Option.some(new Date(1999, 0, 1)));
    expect(parseAs("year", "17.08.2014")).toEqual(Option.none());
  });

  test("should accept a position only when it parses for the axis kind", () => {
    expect(isValidPosition("number", { kind: "mean" })).toBe(true);
    expect(isValidPosition("date", { kind: "mean" })).toBe(false);
    expect(isValidPosition("number", { kind: "value", value: " 30000 " })).toBe(true);
    expect(isValidPosition("number", { kind: "value", value: "abc" })).toBe(false);
    expect(isValidPosition("number", { kind: "value", value: "" })).toBe(false);
    expect(isValidPosition("date", { kind: "value", value: "01.01.2020" })).toBe(true);
    /* A line on a year axis is typed as a year, and reaches the chart as one. */
    expect(isValidPosition("date", { kind: "value", value: "2020" })).toBe(true);
  });

  test("should emit nothing at all for a position it rejects", () => {
    expect(positionCode("number", { kind: "value", value: "abc" })).toEqual(Option.none());
    /* The chart plots a rolled-over day, so the line may sit on one too. */
    expect(positionCode("date", { kind: "value", value: "not a date" })).toEqual(Option.none());
    expect(positionCode("category", { kind: "value", value: "Zürich" })).toEqual(Option.none());
    expect(positionCode("date", { kind: "mean" })).toEqual(Option.none());
    expect(positionCode("number", { kind: "value", value: " 30000 " })).toEqual(
      Option.some("30000"),
    );
  });

  test("should emit dates through parseDate, numbers as literals and the mean as a string", () => {
    const out = referenceLinesCode(
      [
        line(DATE, { kind: "value", value: "01.01.2020" }, "Start"),
        line(VALUE, { kind: "value", value: "30000" }, "Ziel"),
        line(VALUE, { kind: "mean" }),
      ],
      axes,
    );
    expect(out).toBe(
      '[{ axis: "x", at: sszvis.parseDate("01.01.2020"), label: "Start" }, ' +
        '{ axis: "y", at: 30000, label: "Ziel" }, ' +
        '{ axis: "y", at: "mean", label: "" }]',
    );
  });

  test("should leave out a line when its value does not parse or its role is not offered", () => {
    const out = referenceLinesCode(
      [
        line(VALUE, { kind: "value", value: "abc" }),
        line(DATE, { kind: "value", value: "01.01.2020" }),
        line(VALUE, { kind: "value", value: "10" }),
      ],
      [axes[1]],
    );
    expect(out).toBe('[{ at: 10, label: "" }]');
  });

  test("should name no axis when the recipe offers a single one", () => {
    expect(referenceLinesCode([line(VALUE, { kind: "mean" })], [axes[1]])).toBe(
      '[{ at: "mean", label: "" }]',
    );
  });
});

describe("tooltipText", () => {
  const roles: TooltipRoles = {
    [RoleKey.make("category")]: { accessor: "xAcc", kind: "category" },
    [RoleKey.make("value")]: { accessor: "yAcc", kind: "number" },
    [RoleKey.make("date")]: { accessor: "tAcc", kind: "date" },
  };

  const spec = (tooltip: Spec["tooltip"], fields: Spec["fields"]): Spec => ({
    recipe: RecipeKey.make("demo"),
    csv: "",
    fields,
    options: {},
    features: [],
    tooltip,
    annotations: [],
    kinds: {},
  });

  const bound = mapping({ category: "Sektor", value: "Anzahl", date: "Datum" });
  const fallback = tip("value");

  test("should bold the header and list the body when every role is bound", () => {
    const out = tooltipText("HTML", spec(tip("value", ["category"]), bound), roles, fallback);
    expect(out).toBe(
      [
        "sszvis.modularTextHTML()",
        ".bold((d: Datum) => sszvis.formatNumber(yAcc(d)))",
        ".newline()",
        ".plain(xAcc)",
      ].join("\n"),
    );
  });

  test("should keep an SVG label on one line when it has a body", () => {
    const out = tooltipText("SVG", spec(tip("value", ["category"]), bound), roles, fallback);
    expect(out).toBe(
      "sszvis.modularTextSVG()\n.bold((d: Datum) => sszvis.formatNumber(yAcc(d)))\n.plain(xAcc)",
    );
  });

  test("should format a date with the library's time formatter when the header is a date", () => {
    const out = tooltipText("SVG", spec(tip("date"), bound), roles, fallback);
    expect(out).toContain(".bold((d: Datum) => sszvis.formatAxisTimeFormat(tAcc(d)))");
  });

  test("should append the suffix and guard a missing number when the role declares them", () => {
    const withUnit: TooltipRoles = {
      ...roles,
      [RoleKey.make("value")]: {
        accessor: "yAcc",
        kind: "number",
        suffix: str("Stellen"),
        missing: "keine",
      },
    };
    const out = tooltipText("HTML", spec(tip("value"), bound), withUnit, fallback);
    expect(out).toBe(
      [
        "sszvis.modularTextHTML()",
        ".bold((d: Datum) => {",
        "  const value = yAcc(d);",
        '  return Number.isNaN(value) ? "keine" : sszvis.formatNumber(value);',
        "})",
        '.plain("Stellen")',
      ].join("\n"),
    );
  });

  test("should skip a body role when its column is unbound or unknown", () => {
    const out = tooltipText(
      "HTML",
      spec(tip("value", ["category", "nope", "date"]), {
        ...bound,
        ...mapping({ category: "" }),
      }),
      roles,
      fallback,
    );
    expect(out).toBe(
      "sszvis.modularTextHTML()\n.bold((d: Datum) => sszvis.formatNumber(yAcc(d)))\n.newline()\n.plain((d: Datum) => sszvis.formatAxisTimeFormat(tAcc(d)))",
    );
  });

  test("should fall back to the default header when the chosen one is unbound", () => {
    const out = tooltipText(
      "HTML",
      spec(tip("category"), { ...bound, ...mapping({ category: "" }) }),
      roles,
      fallback,
    );
    expect(out).toBe("sszvis.modularTextHTML()\n.bold((d: Datum) => sszvis.formatNumber(yAcc(d)))");
  });

  test("should emit a bare chain when neither the chosen nor the default header is bound", () => {
    const out = tooltipText("HTML", spec(tip("category"), {}), roles, fallback);
    expect(out).toBe("sszvis.modularTextHTML()");
  });

  test("should not repeat the header in the body when the same role is listed twice", () => {
    expect(
      resolveTooltip(tip("value", ["value", "category"]), fallback, [
        RoleKey.make("value"),
        RoleKey.make("category"),
      ]),
    ).toEqual(tip("value", ["category"]));
  });
});

describe("sortOrder", () => {
  const table = parse("Sektor,Anzahl\nGastgewerbe,20892\nBaugewerbe,17567\nHandel,42196");

  test("should return row indices rather than rows, so the table is untouched", () => {
    expect(sortOrder(table, 0, "asc", {})).toEqual([1, 0, 2]);
    expect(table.rows[0]?.[0]).toBe("Gastgewerbe");
  });

  test("should order an all-non-finite column deterministically, as text", () => {
    /* Sorted as numbers these went through `Infinity - Infinity`, i.e. a NaN comparator. */
    expect(sortOrder(parse("v\nInfinity\n-Infinity\nInfinity"), 0, "asc", {})).toEqual([1, 0, 2]);
  });

  test("should agree with sorting the rows outright", () => {
    for (const direction of ["asc", "desc"] as const) {
      expect(reorder(table, sortOrder(table, 1, direction, {}))).toEqual(
        sortRows(table, 1, direction, {}),
      );
    }
  });

  test("should leave the table alone when reordered by its own order", () => {
    expect(reorder(table, [0, 1, 2])).toEqual(table);
  });

  test("should drop indices no row answers to, rather than emitting a hole", () => {
    expect(reorder(table, [2, 9]).rows).toEqual([["Handel", "42196"]]);
  });
});

describe("spec identity", () => {
  const spec = initialSpec(RECIPE, DEMO_CSV);

  test("should ignore the order the record keys were written in", () => {
    const reversed: Spec = {
      ...spec,
      fields: Object.fromEntries(Object.entries(spec.fields).reverse()),
    };
    expect(Object.keys(reversed.fields)).not.toEqual(Object.keys(spec.fields));
    expect(identity(reversed)).toBe(identity(spec));
  });

  test("should still separate specs whose records hold different keys", () => {
    const { [RoleKey.make("series")]: _dropped, ...fields } = spec.fields;
    expect(identity({ ...spec, fields })).not.toBe(identity(spec));
  });

  test("should separate specs that differ anywhere the chart can see", () => {
    expect(identity({ ...spec, csv: `${spec.csv}\nz,3` })).not.toBe(identity(spec));
    expect(identity({ ...spec, options: opts({ title: "Other" }) })).not.toBe(identity(spec));
    expect(identity({ ...spec, features: [] })).not.toBe(identity(spec));
  });

  test("should return a key rather than throw when the form state does not match the schema", () => {
    /* It runs in a `useMemo` over unvalidated form state; a throw there takes
       the whole builder, and the user's pasted table, into the ErrorBoundary. */
    const invalid = {
      ...spec,
      recipe: 42,
      annotations: [{ kind: "nope" }],
    } as unknown as Spec;
    expect(() => identity(invalid)).not.toThrow();
    expect(identity(invalid)).not.toBe(identity(spec));
  });
});

describe("detectDelimiter", () => {
  test.for([
    [
      "the city's own spreadsheet export",
      "Quartier;Anzahl\nAffoltern;12340\nHöngg;9870",
      "semicolon",
    ],
    ["a copied spreadsheet block", "Quartier\tAnzahl\nAffoltern\t12340", "tab"],
    ["a single cell holding another separator", 'name,note\n"Meier, Anna","a;b;c;d"', "comma"],
    ["a candidate that splits the lines unevenly", "name,note\nAnna,one;two\nBeat,three", "comma"],
    ["nothing to go on", "", "comma"],
    ["a single column", "Sektor", "comma"],
  ] as const)("should read %s with the right separator", ([, input, expected]) => {
    expect(detectDelimiter(input)).toBe(expected);
  });
});

describe("parseDelimited", () => {
  test("should read a semicolon export into real columns rather than one wide one", () => {
    const table = parseDelimited("Quartier;Anzahl\nAffoltern;12340", "semicolon");
    expect(table.columns).toEqual(["Quartier", "Anzahl"]);
    expect(table.rows).toEqual([["Affoltern", "12340"]]);
  });

  test("should agree with parse when the separator is the comma", () => {
    const csv = "a,b\n1,2";
    expect(parseDelimited(csv, "comma")).toEqual(parse(csv));
  });

  test("should name the blank and repeated headers of an import apart", () => {
    /* A blank name is the unmapped sentinel, and repeated names address one column. */
    const table = parseDelimited("a,,a\n1,2,3", "comma");
    expect(table.columns).toEqual(["a", "Spalte 2", "a 2"]);
    expect(table.rows).toEqual([["1", "2", "3"]]);
  });

  test("should survive the round trip through the saved csv", () => {
    const table = parseDelimited("a,,a\n1,2,3", "comma");
    expect(parse(serialize(table)).columns).toEqual(table.columns);
  });
});

describe("parseBlock", () => {
  test.for([
    [
      "a copied range",
      "Affoltern\t12340\nHöngg\t9870",
      [
        ["Affoltern", "12340"],
        ["Höngg", "9870"],
      ],
    ],
    /* One plain value must stay one cell, so an ordinary paste stays ordinary. */
    ["a single plain value", "Affoltern", [["Affoltern"]]],
    ["a single copied column", "12340\n9870", [["12340"], ["9870"]]],
  ] as const)("should read %s as rows, with no line taken for a header", ([, input, expected]) => {
    expect(parseBlock(input)).toEqual(expected);
  });
});
