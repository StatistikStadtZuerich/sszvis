# Chart builder

Spec in, chart code out. The user picks a recipe, pastes a table, maps columns to
roles, sets options and toggles features; `@sszvis/chart-builder` emits a
`chart.ts`, its stripped `chart.js`, and an `index.html` to run it in, each
highlighted for the code panel. The preview runs the exact exported code, so the preview and the
export cannot disagree. The spec is the only state; code is a projection of it.

## Layers

The spec-to-code pipeline - the spec, the recipes and their templates, the
generated files - is `@sszvis/chart-builder`, in `packages/chart-builder`, and
its README is where those are described. What is here is the form around it.

- `workers/` - the package's `generate` and shiki behind an Effect RPC worker
  (`domain.ts` is the contract, `pipeline.ts` highlights what `generate`
  returns, `builder.worker.ts` wires the handlers). The parsers are about
  1.2MB and the highlighter with its four grammars a few hundred KB more; the
  worker keeps all of it off the thread the user types on. `boundary.test.ts`
  asserts that nothing reachable from `page.tsx` imports them. Each of the four
  files comes back as a `Source` (`{ raw, html }`, the shape in `~/lib/source`),
  highlighted with `~/lib/highlight` - the same options the examples plugin uses
  at build time, so a builder block and an example block look the same.
- `builder-client.ts`, `builder-form.ts` - the main-thread glue: an
  `AtomRpc.Service` over the worker (`recipesAtom`, `useBuilderCompile`,
  `compileErrorMessage`) and the TanStack form whose values are the `Spec`.
- `assets.ts`, `table.ts` - what only this app can say: the URL it serves a
  chart's topology under, and the table editor's own operations (renaming,
  sorting, cycling a column's kind). Neither reaches the emitted code, so neither
  belongs in the package.
- `page.tsx`, `components/` - layout only. `code-panel.tsx` renders the sources
  through `~/components/source-view`, which the example source panel also uses;
  it adds nothing of its own beyond the download buttons.

## The table

The sample picker in step 1 replaces the table alone (`applySample`, described in
the package README). Replacing a table the user has edited discards that work, so
the picker asks first; a table still exactly as a sample left it (`isPristine`) is
swapped without a prompt.

A pin is the kind the user set on a column, overruling the one read from its
values (Kinds, in the package README). A rename re-keys the pin at exactly one
moment: when the typed name settles (`settleColumn` in `table.ts`), from the name
the column carried before the caret entered it. Mid-edit a header may read exactly
what another column is called, and a pin moved by the name showing then would be
taken off whichever column already answered to it. For the same reason `addedName`
names a new column distinctly rather than by the count alone - two columns of one
name are one column to everything that reads them by name, pins included.

## Verifying

From `apps/docs`, `pnpm test:node` runs the table editor's tests, the worker's
highlighting, and `boundary.test.ts`. The recipes and the code they generate are
verified in the package; its README says how.
