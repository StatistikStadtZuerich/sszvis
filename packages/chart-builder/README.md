# @sszvis/chart-builder

Spec in, chart code out. A `Spec` names a recipe (a chart type), carries the
user's table as CSV, maps the table's columns to the recipe's roles, and sets its
options and features. From that this package emits a `chart.ts`, its stripped
`chart.js`, and an `index.html` to run it in - the same code whether it is
previewed or downloaded. The spec is the only state; code is a projection of it.

A private workspace package, shared within this monorepo. Its modules are
exported as TypeScript source, one subpath each, so a consumer needs no build
step but does need Vite: the recipe loader reads its templates with
`import.meta.glob`. The chart builder in `apps/docs/app/builder` is the
first consumer, and its README covers the form around this.

## Using it

```ts
import { generate } from "@sszvis/chart-builder/generate";
import { initialSpec } from "@sszvis/chart-builder/initial-spec";
import { recipes } from "@sszvis/chart-builder/recipes";
import { summarize } from "@sszvis/chart-builder/spec";

const recipe = recipes[0];
/* Opens on the recipe's own sample table; pass a CSV to start from yours. */
const spec = initialSpec(summarize(recipe));
const { ts, js, html, csv, assets, scripts } = await generate(recipe, spec);
```

A form edits the spec and asks again. `summarize` gives what a form needs to draw
itself - roles, options, features, which axes take annotations - as plain data
that survives `structuredClone`, so a worker can hand it across; a `Recipe`
carries functions and cannot.

What the host app decides:

- **Where it runs `generate`.** Prettier and `ts-blank-space` load on first use
  and come to about 1.2MB, so the builder runs `generate` in a worker. Every other
  module is light enough for the main thread; keep `generate` off any path a page
  imports eagerly. `makeGenerate` is the same thing for a caller in Effect.
- **Where a chart's extra files are served.** An `Asset` names one of
  `@sszvis/geodata`'s TopoJSON bundles by `file`, not by URL, because only the
  app knows its routes. Resolve it to a URL for a preview, and hand `bundleEntries`
  the resolved URLs when building the download.
- **What a preview page loads.** `host()` writes the exported page by default.
  For a preview, override where sszvis loads from (`cdn`), where `config` points
  the chart (`files`), pass the chart `inline` for a `srcdoc` frame, and put an
  error reporter `before` the scripts.
- **The Effect version.** The spec is an Effect `Schema` and the pipeline returns
  Effects, so an app that uses Effect itself should pin the same version rather
  than load a second copy beside this one.

## Modules

| Subpath        | What it holds                                                                  |
| -------------- | ------------------------------------------------------------------------------ |
| `spec`         | The `Spec` schema, the branded keys, `RecipeSummary`, `optionValue`            |
| `recipes`      | Every recipe, loaded and checked; `findRecipe` by key                          |
| `initial-spec` | A spec from a table: `initialSpec`, `bindRoles`, `switchRecipe`, `applySample` |
| `samples`      | The sample tables, real Zurich figures                                         |
| `csv`          | Reading a table as the chart will: parsing, column kinds, date formats         |
| `generate`     | Spec to files: compile, format, strip, wrap in the page                        |
| `host`         | The page that runs a chart, its CDN, and the bundle's file names               |
| `bundle`       | The files of the downloadable archive, fetched and checked                     |
| `zip`          | The archive itself                                                             |
| `tooltip`      | Which roles a tooltip can show, and its emitted text                           |
| `annotations`  | Reference lines: validation and emitted code                                   |
| `controls`     | Which columns can carry a filter control, and the control drawn                |
| `palettes`     | The colour choices each chart offers, and its scale code                       |
| `emit`         | `BuilderCompileError`, the error every stage fails with                        |
| `identity`     | A stable key for a spec, to cache or deduplicate compiles                      |

`compile.ts` (spec to unformatted TypeScript) and `recipe.ts` (template parsing)
are internal: recipes live in this package, so nothing outside it needs either.

## Templates

A recipe is a folder under `src/recipes/` with a `recipe.ts` (roles, options,
feature list, default scalars, the key of the sample it opens on), a `chart.ts` and one `.tmpl` per
feature. `chart.ts` is a real, runnable chart with two kinds of hole, both spelled
so the file stays valid TypeScript:

- `__NAME__` - a scalar: one expression, type or literal, substituted inline.
- `// {{block:name}}` - a block: feature fragments, indented to the hole's
  column; the line disappears when nothing contributes.

Scalars are `Safe`-branded: `str` quotes free text, `comment` neutralises it for
a block comment, `code` asserts an authored expression. `recipes/tsconfig.json`
type-checks every `chart.ts` against `holes.d.ts` and the examples' globals.

A feature `.tmpl` reads like the chart it contributes to, marked up with comment
directives:

- `// #label text` and `// #hint text` - the checkbox label and the sentence under it.
- `// #hidden` - no checkbox; the recipe's `implied(spec)` switches the feature on
  from the spec's content (reference lines whenever `annotations` has one).
- `// #scalar NAME value` - overrides a scalar the template or recipe declared.
- `// #region hole` ... `// #endregion` - lines aimed at `// {{block:hole}}`,
  dedented on the way in.

Text outside a region is ignored, so a file can carry explanatory prose.

An option with `choices` is drawn as a menu, and a choice can ask that menu for two
things beyond its name: a `swatch` of the colours it stands for, and a `group` naming
the family it belongs to, which the menu heads. `group` is load-bearing beyond the
menu - `coverage.ts` type-checks one choice per family, on the grounds that a family
is one shape, so only group choices that emit the same shape. The map's eight colour
ramps are one expression with one of eight names in it, and the two families differ
only in that a diverging ramp brings a second domain with it.

A swatch `blend`s its colours into one ramp or shows them as the separate colours they
are; only a continuous scale interpolates between its stops, and a blended set of twelve
categories would read as a rainbow gradient.

An option can also name, in `supersededBy`, a feature that does its job instead: while
that feature is on, the panel says so underneath rather than leaving a live control
that changes nothing. The map's bubbles supersede its colours, since they draw the
areas in one flat grey.

Which families a chart is offered is the chart's own to say, because the question a
scale answers differs: a choropleth shades a number, so `src/palettes.ts` offers it
the sequential and diverging ramps; a stack tells categories apart, so it offers the
categorical ones; a chart with a single named series gets the four `qual` scales, since
Automatic has nothing to decide where one colour is picked. A spec carrying a palette
its chart cannot use falls back to that chart's own default.

A choice that colours values rather than positions lists them in `expects`, and its
option names in `keyedTo` the role whose column they are checked against. The library's
gender scales carry their own domain - that is why they are chosen, so that Frauen is
teal wherever it appears - and the cost is that a value they were not built for takes
the scale's first colour while the legend is labelled from the scale's domain rather
than the chart's. The panel names the values that will not be coloured rather than
letting a stack come out one colour under a legend that describes something else.

## Data

Sample tables live in `src/samples.ts`, independent of the recipes. A recipe
names one by key as the table it opens on (`sample`), but the two are chosen
separately after that: the sample picker in step 1 replaces the table alone,
leaving the chart type, options, features, tooltip and annotations as the user
set them, and rebinding each role to the new columns (`applySample`), preferring
the column that role already names. A sample whose columns do not fit leaves a
role unmapped rather than being hidden - the builder's mapping step says what the
chart still needs.

`spec.chosen` names the roles whose column the user picked in step 3, as against
the ones `bindRoles` guessed, and changing the chart type carries only those. A
guess is about the chart it was made for, and `rank` prefers a role's existing
column over any other - so a carried guess takes a column the new chart wants for
something else. A map is where that shows: its area code and its value are both
numbers, and a value guessed under a bar chart holds the code column, leaving the
geometry to be matched against the measure and drawing nothing. Loading a sample
clears `chosen` with the table it was about, while still offering the old
bindings as a preference, so a role whose column the new table also has stays
where it is.

## Kinds

Two vocabularies, because a column's data and a chart's appetite are different
questions. A `ColumnKind` - `nominal`, `continuous`, `temporal` - says what a
column holds. A `RoleKind` - `category`, `number`, `date` - says what a recipe
wants of one, and what kind of value positions a reference line. `fitRank` maps
between them: an exact fit is 0, and a category role will take anything since
any value can be a label, preferring dates over numbers because dates read as
labels still read in order. Keeping them apart is what lets a finer measurement
level - `ordinal` beside `nominal`, `discrete` beside `continuous` - be added
without every recipe acquiring an opinion about it. The names are measurement
levels for the same reason; `continuous` covers whole numbers until `discrete`
earns its place by changing something observable.

`detectedKinds` reads a column from its values. `spec.kinds` is what the user
said instead, and it is **sparse**: a column appears only where they overruled
the detector, so everything else keeps re-reading as it is edited. `columnKinds`
lays one over the other and is what every consumer asks. It takes the overrides
with no default, so a call site that has not been told about pins fails to
compile rather than quietly ignoring them.

A pin steers `bindRoles`, and through it which chart types report an unmet role;
it picks the sort comparator; and it names the kind the mapping step reports. It
is also what `unsupportedPins` and `bearsRole` measure a column's values against -
the warning on the column's own button, and the one under its mapping. It
reaches no emitted code. Pins carry through a chart-type switch and through a
column rename, and are dropped whenever the whole table is replaced - loading a
sample, or saving from the paste panel - because a pin that survived would land
on whichever new column happened to share its name.

`RecipeDef.scalars` receives a `kind` accessor that no recipe reads. It is there
because a sparse `spec.kinds` cannot be resolved by a recipe on its own, so the
first recipe that needs to emit differently per kind would otherwise have to
change the type and all eight call sites to reach one.

`KIND_LABEL` in `spec.ts` names the three for the reader - text, number, date -
and every surface that speaks of a kind reads from it, so the table editor and
the chart-type picker cannot come to word them differently. The measurement
levels stay in the types, where the room for a finer one is worth their jargon.

Whether a column's values can be _read_ as a kind is a second question, and
`admits` is the one place it is asked: by the detector of every kind, and by the
two warnings of the kind the user chose. A column with nothing in it bears only
`nominal` - `every` over no values is true, and without that an empty column
would pass as dates and satisfy a chart that then draws nothing.

## Dates

Two notations reach a chart, and they need different parsers: `17.08.2014` through
`sszvis.parseDate`, `1999` through `sszvis.parseYear`. Which one a column is
written in is `DateFormat`, and it sits beside `ColumnKind` rather than inside it -
a role wants a date, never a date in a particular notation, so role-fitting and the
kind cycle stay out of it. `compile` hands each recipe the facts about a column and
the two date recipes emit the parser that fits, which is what the accessor on
`RecipeDef.scalars` was put there for.

Years are never guessed at. `%Y` reads one to four digits, so a column of counts
under 10000 reads as years perfectly well, and a count is far the likelier thing
for a bare number to be - so a bare number column is a number until someone pins it
to dates, which is exactly what pinning is for.

`parseAs` reads both notations exactly as d3 does, rolling `31.02.2020` over to the
second of March rather than refusing it, because that is the day the chart plots it
on. Refusing it would be the builder disagreeing with the code it writes, and would
cost a column its whole reading over one typo. `rolledOver` reports such a day
instead, and the column stays dates. The readers are written out rather than
imported - sszvis touches `document` as it loads, and this runs in a worker - so
`parse-conformance.test.ts` puts every case to both and fails if they part.

## Keys

Five kinds of name run through the spec, and every one of them is a string: a
recipe key (`line-chart`), a role key (`value`), a column name of the user's
table (`Anzahl`), a feature key (`tooltip`) and an option key (`unit`). Nothing
but the argument order used to keep them apart, so `spec.ts` brands each one
(`RecipeKey`, `RoleKey`, `ColumnName`, `FeatureKey`, `OptionKey`) and the rest
of the builder carries the brand. `Schema.brand` is type-level only - it appends
a `brands` annotation to the AST, adds no check and leaves the encoded shape
alone - so the RPC payload and any persisted spec are exactly what they were.

A raw string becomes a key only where one genuinely enters, by calling the
brand's own `make` (`RoleKey.make(...)`), which cannot fail. A recipe names its
option and feature keys once as consts at the top of its `recipe.ts` and uses
them for `features`, `options` and every lookup; the CSV parser brands the
header row; the table editor brands a column the user renames or adds; and a
`.tmpl` filename becomes a feature key in `recipe.ts`.

Role keys are the exception: a role means the same thing in every recipe, so
`spec.ts` exports `CATEGORY`, `VALUE`, `DATE` and `SERIES` and recipes import
them rather than minting their own. Switching chart type carries the user's
annotations over by role, which only works while the recipes agree on the
spelling - a recipe that said `val` would silently keep nothing. A role
peculiar to one recipe still belongs in that recipe. The two option keys the
builder itself reads are exported from `spec.ts` the same way, as `TITLE` and
`DESCRIPTION`.

## Parameters

Three parts of the spec feed features with values rather than switching them on:

- `tooltip` names the roles the tooltip (or hover ruler) shows, as role keys;
  `src/tooltip.ts` turns it into a `modularText` chain the recipe emits as a
  scalar. `RecipeSummary.tooltipFeature` says which checkbox the settings sit under.
- `annotations` is a tagged union (`reference-line` so far). `src/annotations.ts`
  validates and emits it as one `REFERENCE_LINES` constant that the hidden
  `reference-lines.tmpl` draws generically; `RecipeSummary.annotationAxes` says
  which axes a recipe offers and what kind of value positions a line there.
  A new kind of annotation is a new union member, a template region that draws
  it, and a UI row.
- `control` names a column to filter the chart on, or is `null`.
  `src/controls.ts` decides which columns can carry one - not already bound to
  a role, not a date, and holding at least two values - and resolves the control
  the chart will draw. A control that no longer resolves emits nothing rather
  than failing the compile, so renaming its column away loses the control and not
  the chart. The hidden `controls.tmpl` draws it, and `implied` asks whether the
  control resolves rather than whether the spec names one: switching the feature
  on for an unresolvable control would emit a button group with no buttons.

## Language

Two audiences, two languages, and the line between them is what a string ends up
inside rather than which file it lives in.

- **English** is the builder talking to the person building: role labels and
  hints, feature labels, option labels, buttons, notices, errors. `RecipeDef`'s
  `label` names the recipe in the chart-type picker, so it is English.
- **German** is the chart talking to the public it is published for. That covers
  every option `fallback` (`Vertikales Balkendiagramm`, `Serie`, `Einheiten`),
  the `missing` text a tooltip shows for an absent value (`keine`), the sample
  tables of real Zurich figures, the `Spalte n` a new column is named -
  which is a header in the exported CSV and an accessor in the emitted code -
  and the `Datum` type the generated chart declares, as every hand-written
  example under `examples/` does. The host page is `lang="de"` for the same
  reason.

A `label` and a `fallback` on the same option therefore disagree on purpose:
`{ key: "title", label: "Title", fallback: "Vertikales Balkendiagramm" }` labels
the field in English and titles the chart in German.

## Adding things

- A feature: add `name.tmpl` to the recipe folder and list `name` in the
  recipe's `features` array (order is UI order and emission order). Every hole it
  targets must exist in `chart.ts`; every scalar it sets must be declared in
  `holes.d.ts`.
- A recipe: add a folder with `recipe.ts`, `chart.ts` and its `.tmpl` files, then
  list it in `src/recipes/defs.ts`. `sample` names the table it opens on.
- A sample table: add an entry to `samples` in `src/samples.ts`. Nothing else
  changes - every sample is offered under every chart type.

## Verifying

From `packages/chart-builder`:

- `pnpm test` - both suites below, node first.
- `pnpm test:node` - the unit tests beside the code in `src/`, and the
  integration suites in `test/`. `compile.test.ts` emits every feature
  combination into `test/_generated/` and runs `tsc -p test/generated.tsconfig.json`
  over it, so the generated code is checked against the library's real types,
  then removes the directory. `emission.test.ts` compares each recipe's output
  with the baselines in `test/__snapshots__/emission/`.
- `pnpm test:browser` - `test/marks.browser.test.ts`, in headless chromium
  (`vitest.browser.config.ts`). It runs each recipe's emitted chart the way the
  generated `index.html` does - `d3`, `sszvis` and `config` as globals, the CSV
  as a `data:` URL - and checks what it drew.
- `pnpm type-check` - the package, and `src/recipes/tsconfig.json` for the
  templates, against `test/globals.d.ts`.

The browser suite exists because everything else passes for a chart that draws
nothing. Its `EXPECTED` table names, per recipe, the selector for the data marks
alone and how many of them the recipe's sample should produce, and every mark has
to measure non-empty. Both halves are needed and each catches what the other
misses: emitting a value column that does not exist still renders one rect per
row, at `height="0"`, so the count stays right while the chart is blank; reading
every row as one series draws a line of full size, so the extents stay right
while a series is missing. A recipe absent from `EXPECTED` fails rather than
passing quietly, so a new one has to say what it draws.
