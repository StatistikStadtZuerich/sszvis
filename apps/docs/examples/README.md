# Examples

One folder per example. Everything here is real source: it is type-checked
against the library, linted, formatted, and it is the code readers copy.

```txt
examples/
  globals.d.ts                 declares d3, sszvis and config for tsc
  _template.html               the page every example is rendered into
  _static/                     assets more than one example loads
  <chart-type>/<name>/
    chart.ts                   the example
    example.json               title + the config injected into the page
    data.csv                   whatever the example fetches
```

Anything the example loads at runtime sits beside it and is served from its own
URL. An asset several examples share goes in `_static/` instead and is loaded
from `../../_static/`; the TopoJSON the maps draw comes from
`@sszvis/geodata` and is served at `../../_static/topo/` without being
copied here at all.

Load shared assets by that relative path, never from the site root: the site is
served under a base path on GitHub Pages (`/sszvis/`), where `/preview/…` does
not exist.

## Adding one

1. Create `examples/<chart-type>/<name>/` with `chart.ts` and `example.json`,
   plus any data the chart loads.
2. Reference it from a page: `<Example id="<chart-type>/<name>" />`. Until the
   folder exists that renders a placeholder naming the folder it wants, so a
   page can be written before its example is ported.

No registration step: `vite-plugin-examples.ts` discovers folders, and the dev
server picks up a new one without a restart.

## How an example is written

Examples are plain scripts in the globals idiom — no imports, reading `d3`,
`sszvis` and `config` off the window — because that is what a consumer pastes
into a page that loads `sszvis.min.js` from a script tag.

They are still TypeScript. `globals.d.ts` declares those three globals, so
`tsc` checks the example against the library's own types without changing how
the code is written. The app's `type-check` script runs that check over
`examples/tsconfig.json` alongside its own:

```bash
pnpm --filter @sszvis/docs run type-check
```

## What the build produces

`vite-plugin-examples.ts` renders each folder into a standalone page at
`preview/<chart-type>/<name>/` under the site base — script tags, a `config` global, and the
example inlined. That page is what the docs embed in an iframe, and it is also
exactly the file a consumer would write by hand.

The JavaScript in it (and in the source panel's JS tab) is `chart.ts` with its
types erased by `ts-blank-space` and the result formatted with the repo's own
`oxfmt`, so the two languages can never drift and both read as hand-written.
