# Pitfalls

What goes wrong in practice, usually while every check passes. The first three
sections are about the history of the codebase. They explain most of the others.

## The code is older than it looks

Many people wrote sszvis over many years, in the style of d3 v3 to v5. Components are
chainable factories with manual DOM joins and mutable selections. Some code works
around language features JavaScript did not have yet. The TypeScript port changed
the language, not the design. Much of the code could be simpler today, both in its
functional style and in how it handles the DOM.

Do not copy a pattern because it appears everywhere. Check the conventions in
`AGENTS.md` first.

Comments and JSDoc are not a reliable source either. They built up in layers: notes
from past maintainers, comments from separate development sessions and, more
recently, comments that LLMs wrote. Many are useful, so nobody removed them in bulk.
Others describe legacy systems, sit next to the wrong code, or contradict what the
code does. If a comment and the code disagree, trust the code and its tests. Then fix
or delete the comment.

## The tests record old behavior, not intended behavior

Before the TypeScript port, the library had no unit tests. The snapshot suite is also
fairly recent. The unit tests were written during the port to record what the
JavaScript did, so the port could not change behavior unnoticed.

As a result:

- A test that asserts a behavior does not prove the behavior is intended. Some tests
  record known quirks and mark them `// NOTE:`. Others record quirks nobody noticed.
- Nobody has audited the suite. It is larger and noisier than a planned suite, and
  some tests may not catch a regression in what they claim to cover. Mutation
  testing, for example with Stryker, can show which tests catch anything.
  [Issue 497](https://github.com/StatistikStadtZuerich/sszvis/issues/497) tracks the
  audit.
- If you change a behavior on purpose, update the test that records it, and say why
  in the commit message. A failing test of this kind is a question, not a verdict.

## Fixing a bug can break a chart

Consumer charts are hand-written JavaScript and can use the library in any way the
language allows. So some chart depends on every behavior anyone can observe. This is
Hyrum's Law. The port found many places where the types show the implementation is
wrong. For example, a `null` that should throw or warn is silently ignored. Often a
chart relies on that silence.

A correct fix can therefore be a breaking change. Before you release a behavior fix,
run the [consumer chart check](how-to/check-consumer-charts.md). If a chart depends on
the bug, fix that chart upstream first, against the version it pins. Then release the
library fix.

## Passing tests do not prove a public API change is safe

The unit tests, the snapshots and a `matches baseline` verdict can all pass while a
chart draws its axes and no data. For any change to public behavior, compare the
rendered mark counts on the consumer charts. The `renders-empty` verdict and the mark
count in each pane of the regression harness show this.

## Snapshot tolerance hides real changes

The 5% pixel tolerance absorbs font differences between systems. It also absorbs
small real regressions. During the port, two of them passed every check:

- Date keys computed with UTC `getTime`, which moved values by the time zone offset.
- A dropped `ticks(null)` call.

If a change touches scales, time handling or axes, compare old and new renders side
by side. On maps, the PNG comparison cannot see the hatch texture for missing values
at all. The `*-map.txt` baselines exist for that reason.

## A PNG baseline from a Mac fails in CI

A Mac renders text differently from the Linux container in CI. Never regenerate a PNG
baseline on a Mac. See [decisions.md](decisions.md#snapshot-baselines-come-from-linux).

## The two READMEs serve different readers

npm shows `packages/sszvis/README.md`. It must stand on its own, use absolute links,
and say nothing about the monorepo. The root `README.md` is for contributors. The npm
page went stale after the monorepo migration because the two were mixed up.

## Hard-coded paths break the docs on GitHub Pages

Locally, the docs site runs at `/`. On GitHub Pages it runs at `/sszvis/`, which
`DOCS_BASE` sets. A hard-coded absolute path works with `pnpm run dev` and breaks in
production. Build URLs with the helpers in `apps/docs/app/lib/base-url.ts` or with
`import.meta.env.BASE_URL`. If you change routes or asset paths, build once with
`DOCS_BASE=/sszvis/` and check the result.

## pnpm passes `--` to the script

With npm, `run x -- --flag` passes `--flag` to the script. pnpm passes the `--` as
well, so the script reads `--flag` as a positional argument. Write
`pnpm run x --flag` instead.

## `pnpm add` re-resolves the latest tools

The root `package.json` pins `oxlint`, `oxfmt` and `@effect/tsgo` to `latest`. Every
`pnpm add` resolves them again and can put a new tsgo or oxlint into the lockfile next
to your change. After you add a dependency, run `git checkout pnpm-lock.yaml`. Then
add the dependency again or run a plain `pnpm install`. Check that the lockfile diff
contains only what you meant to change.

## The `stack-effect` scaffold overwrites repository config

`stack.effect.json` belongs to an Effect project scaffold. If you run that scaffold
over the repository, it replaces the lint, format and TypeScript configuration with
its own presets. Plain oxlint cannot load its oxlint presets. If you must run it,
do a dry run first, and restore every file it changes outside the Effect apps.

## Experimental apps

These apps are experimental, so this section only names the traps. Their READMEs have
the details.

- The chart builder's templates refer to recipe variables by name. If you rename a
  variable in a recipe, generated charts can break, and the type check does not
  notice.
- The recipes type check cannot see `.datum()`. A template value passed to `.datum()`
  accepts any type. Only the browser test that counts marks catches a wrong one.
- Generated charts inside an MCP App run under a strict content security policy.
  They cannot use `fetch` or `d3.csvParse`, which needs `new Function`. Inline the
  data instead.
