# Reading the production corpus

`.reference/d3charts-website` holds roughly 1095 real sszvis charts as shipped by
Stadt Zürich. It is the ground truth for how the library is actually used, and
the best source of patterns when a docs example needs to model something real.

Read it with three caveats.

## Contents

- Two API generations coexist
- It is deliberately ES5
- What it gets wrong
- What it gets right

## Two API generations coexist

About 658 charts are on 3.4.0 with the flat API. **369 are still on 1.0.0** with
the namespaced `sszvis.fn.*` / `sszvis.axis.x` / `sszvis.color.qual12` API. Only
a handful mix the two.

So roughly a third of what looks like current practice is a full generation
behind. Before copying a call, check it exists in `packages/sszvis/src/index.ts`
— a flat barrel of `export *` over 26 modules.

## It is deliberately ES5

IIFE wrappers, `"use strict"`, `var`; only 74 of 1095 files use `const`/`let` at
top level. Loose equality (`==`) is used throughout, which works only because CSV
values are strings.

Examples are modern TypeScript. Take the patterns, not the idioms.

## What it gets wrong

Do not import these along with the pattern you came for.

**Accessibility is empty everywhere.** `createSvgLayer` is passed empty title and
description strings in 816 of 817 call sites, so essentially every production
chart ships `aria-label=" – "`. Where a title is forwarded at all, the value is
literally `"Title"`, `"sdf"` or `""`. There are zero real `aria*` attributes in
the corpus.

**Fallback is configured and then ignored.** `fallback: "fallback.png"` is passed
in 687 HTML files, but the renderer is called _without_ the `{src}` option in 661
of 664 cases, so `config.fallback` is dead config and the library default is
silently used.

**Hardcoded colour.** ~3500 hex literals bypass `sszvis.scale*`, including a
copy-pasted colour ladder that shadows an ordinal scale defined three lines
above.

**Dead code ships.** ~1875 commented-out lines, 629 commented-out `console.log`s,
and 119 live `console.log` calls still in production.

**Helpers reimplemented and abandoned.** `labelWrapWidth` is defined in 112 files
and referenced in none of 18 of them; `handleMissingVal` in 16.

**`sszvis.component()` is used zero times** in the whole production corpus,
despite 27 files hand-rolling d3 closure components — one a ~180-line box plot.
That says the "how to extend the library" recipe is missing from the docs, not
that people prefer the manual way.

## What it gets right

Worth imitating, and already reflected in the examples:

- The fallback guard runs first, before anything else.
- `.catch(sszvis.loadError)` on every load. Without it a failed load is an
  unhandled rejection and the reader sees an empty chart with no clue why.
- `selectGroup(…).call(component)` rather than manual `append`.
- The section banners — the examples' banner scheme comes from here.
- `panning()` for discrete marks versus `move()` for continuous ones: 344 and 385
  charts respectively, and only 25 use both. That split is a real convention, not
  an accident.
- The params-object contract: the page supplies `{ data, title, description,
fallback, id }` and the chart reads it. `example.json` plus the injected
  `config` global is the docs equivalent.
