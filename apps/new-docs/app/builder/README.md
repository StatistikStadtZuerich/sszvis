# Chart builder

Spec in, chart code out. The user picks a recipe, pastes a table, maps columns to
roles, sets options and toggles features; the builder emits a `chart.ts`, its
stripped `chart.js`, and an `index.html` to run it in, each highlighted for the
code panel. The preview runs the exact exported code, so the preview and the
export cannot disagree. The spec is the only state; code is a projection of it.

## Layers

- `domain/` - pure and parser-free: the `Spec` schemas (`spec.ts`), the
  hole-filling emitter (`emit.ts`), `.tmpl` parsing (`recipe.ts`), spec to
  TypeScript (`compile.ts`), the host page (`host.ts`), CSV, ZIP, the initial
  spec, the sample tables (`samples.ts`) and the recipes themselves under
  `domain/recipes/`. Runs in the worker,
  and in tests under plain node.
- `workers/builder/` - prettier, `ts-blank-space` and shiki behind an Effect RPC
  worker (`domain.ts` is the contract, `pipeline.ts` formats, strips and
  highlights, `builder.worker.ts` wires the handlers). The parsers are about
  1.2MB and the highlighter with its four grammars a few hundred KB more; the
  worker keeps all of it off the thread the user types on. `boundary.test.ts`
  asserts that nothing reachable from `page.tsx` imports them. Each of the four
  files comes back as a `Source` (`{ raw, html }`, the shape in `~/lib/source`),
  highlighted with `~/lib/highlight` - the same options the examples plugin uses
  at build time, so a builder block and an example block look the same.
- `builder-client.ts`, `builder-form.ts` - the main-thread glue: an
  `AtomRpc.Service` over the worker (`recipesAtom`, `useBuilderCompile`,
  `compileErrorMessage`) and the TanStack form whose values are the `Spec`.
- `page.tsx`, `components/` - layout only. `code-panel.tsx` renders the sources
  through `~/components/source-view`, which the example source panel also uses;
  it adds nothing of its own beyond the download buttons.

## Templates

A recipe is a folder under `domain/recipes/` with a `recipe.ts` (roles, options,
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

## Data

Sample tables live in `domain/samples.ts`, independent of the recipes. A recipe
names one by key as the table it opens on (`sample`), but the two are chosen
separately after that: the sample picker in step 1 replaces the table alone,
leaving the chart type, options, features, tooltip and annotations as the user
set them, and rebinding each role to the new columns (`applySample`), preferring
the column that role already names. A sample whose columns do not fit leaves a
role unmapped rather than being hidden - step 2 says what the chart still needs.
Replacing a table the user has edited discards that work, so the picker asks
first; a table still exactly as a sample left it (`isPristine`) is swapped
without a prompt.

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
reaches no emitted code. Pins carry through a chart-type switch and through a
column rename, and are dropped whenever the whole table is replaced - loading a
sample, or saving from the paste panel - because a pin that survived would land
on whichever new column happened to share its name.

A rename re-keys the pin at exactly one moment: when the typed name settles
(`settleColumn`), from the name the column carried before the caret entered it.
Mid-edit a header may read exactly what another column is called, and a pin moved
by the name showing then would be taken off whichever column already answered to
it. For the same reason `addedName` names a new column distinctly rather than by
the count alone - two columns of one name are one column to everything that reads
them by name, pins included.

`RecipeDef.scalars` receives a `kind` accessor that no recipe reads. It is there
because a sparse `spec.kinds` cannot be resolved by a recipe on its own, so the
first recipe that needs to emit differently per kind would otherwise have to
change the type and all eight call sites to reach one.

The three kinds are named for the reader in `page.tsx` - text, number, date -
not by their measurement levels, which are jargon outside the type system.

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

Two parts of the spec feed features with values rather than switching them on:

- `tooltip` names the roles the tooltip (or hover ruler) shows, as role keys;
  `domain/tooltip.ts` turns it into a `modularText` chain the recipe emits as a
  scalar. `RecipeSummary.tooltipFeature` says which checkbox the settings sit under.
- `annotations` is a tagged union (`reference-line` so far). `domain/annotations.ts`
  validates and emits it as one `REFERENCE_LINES` constant that the hidden
  `reference-lines.tmpl` draws generically; `RecipeSummary.annotationAxes` says
  which axes a recipe offers and what kind of value positions a line there.
  A new kind of annotation is a new union member, a template region that draws
  it, and a UI row.

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
  list it in `domain/recipes/defs.ts`. `sample` names the table it opens on.
- A sample table: add an entry to `samples` in `domain/samples.ts`. Nothing else
  changes - every sample is offered under every chart type.

## Verifying

From `apps/new-docs`:

- `pnpm test` - both suites below, node first.
- `pnpm test:node` - the domain and pipeline tests. `compile.test.ts` emits every
  feature combination into `examples/_builder-check/` and runs
  `tsc -p examples/tsconfig.json` over it, so the generated code is checked
  against the library's real types, then removes the directory.
- `pnpm test:browser` - `marks.browser.test.ts`, in headless chromium
  (`vitest.browser.config.ts`). It runs each recipe's emitted chart the way the
  generated `index.html` does - `d3`, `sszvis` and `config` as globals, the CSV
  as a `data:` URL - and checks what it drew.
- `pnpm type-check` - three projects: the app, `examples/`, and
  `domain/recipes/tsconfig.json` for the templates.

The browser suite exists because everything else passes for a chart that draws
nothing. Its `EXPECTED` table names, per recipe, the selector for the data marks
alone and how many of them the recipe's sample should produce, and every mark has
to measure non-empty. Both halves are needed and each catches what the other
misses: emitting a value column that does not exist still renders one rect per
row, at `height="0"`, so the count stays right while the chart is blank; reading
every row as one series draws a line of full size, so the extents stay right
while a series is missing. A recipe absent from `EXPECTED` fails rather than
passing quietly, so a new one has to say what it draws.
