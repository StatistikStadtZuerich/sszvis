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
brand's own `make` (`RoleKey.make(...)`), which cannot fail. A recipe names its keys once as consts at
the top of its `recipe.ts` and uses them for `roles`, `features`, `options` and
every `spec.fields[...]` lookup; the CSV parser brands the header row; the table
editor brands a column the user renames or adds; a `.tmpl` filename becomes a
feature key in `recipe.ts`; and the two option keys the builder itself reads are
exported from `spec.ts` as `TITLE` and `DESCRIPTION`.

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

- `pnpm test` - the domain and pipeline tests. `compile.test.ts` emits every
  feature combination into `examples/_builder-check/` and runs
  `tsc -p examples/tsconfig.json` over it, so the generated code is checked
  against the library's real types, then removes the directory.
- `pnpm type-check` - three projects: the app, `examples/`, and
  `domain/recipes/tsconfig.json` for the templates.
