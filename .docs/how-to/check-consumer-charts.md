# How to check consumer charts before a release

The regression harness in `apps/regression-cli` renders production charts twice. One
side uses the sszvis version the chart pins, the other uses your working copy. It is
not a CI gate. It is the only way to see what a change does to real charts. To
understand why that matters, read
[Fixing a bug can break a chart](../pitfalls.md#fixing-a-bug-can-break-a-chart).

Know what the harness does not cover:

- It renders only charts that pin a version in `COMPARABLE_VERSIONS`
  (`apps/regression-cli/src/domain/Chart.ts`), at present 3.4.0 and 3.2.1. A clean
  sweep says nothing about charts pinned to other versions. Check those by hand if
  your change can reach them.
- Only sszvis differs between the two sides. Both sides load the d3, the
  `topojson.js` and the chart data from the reference checkout. The harness cannot
  test a new d3 or new map data on its own.
- Its verdicts compare errors, SVG counts and whether marks are drawn. They do not
  compare pixels. A change to fills, positions or mark sizes can leave every chart
  unflagged.

The harness needs the consumer chart repository checked out at
`.reference/d3charts-website`.

## Run the sweep

1. Build the library, so the candidate side is current:

   ```bash
   pnpm --filter sszvis run build
   ```

2. Run a headless sweep with screenshots of the flagged charts:

   ```bash
   pnpm run regression:crawl --shots
   ```

   It writes `__report__/report.json` and, with `--shots`, before and after images
   under `__report__/shots/`.

3. To look at charts side by side instead, run `pnpm run regression` and open
   <http://localhost:8100>.

## Read the verdicts

Look first at the verdicts your change can cause: `new-errors`, `render-differs` and
`renders-empty`. A `matches baseline` row can still have fewer marks, so compare the
mark counts for any change to public behavior.

`shared-errors` and `renders-nothing` were broken before your change. `fixed` means
your change removed an error.

`apps/regression-cli/README.md` lists every verdict and flag.

## Decide for each broken chart

1. Find out whether the chart relies on a bug that your change fixes.
2. If it does, fix the chart upstream first, against the version it currently pins.
   Then release the library fix.
3. If it does not, your change is wrong. Change the library.
