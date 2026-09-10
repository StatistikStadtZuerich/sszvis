/**
 * The note that ships inside an export, for whoever receives it.
 *
 * It lives apart from the export logic because it is prose, and because the one
 * thing a recipient must be told - that the folder has to be served over HTTP -
 * is easy to lose in the middle of a file-copying loop.
 */
export const startHere = (options: {
  readonly stamp: string;
  readonly charts: number;
  readonly hasReport: boolean;
}): string => `# sszvis side-by-side comparison — ${options.stamp}

${options.charts} charts, each rendered twice: the pinned sszvis release the chart was
written against ("current"), and the development build this snapshot was taken from
("working copy").

## Viewing it

The charts load their data files over HTTP, which a browser will not do from a
\`file://\` page — so opening \`index.html\` by double-clicking shows empty charts.
Serve the folder instead, from inside it:

    npx serve .

or, with no Node available:

    python3 -m http.server 8000

Then open the address it prints (\`http://localhost:3000\` or \`http://localhost:8000\`).

## Reading it

One row per chart, current on the left, working copy on the right. Each pane reports
how many SVGs it drew and how many errors it raised:

- **matches baseline** — same number of rendered charts, no new errors
- **new errors in candidate** — the working copy threw where the release did not
- **render count differs** — one side drew a chart and the other did not
- **candidate renders no marks** — the SVG and axes are there, the data marks are gone
- **nothing rendered on either side** — broken independently of the working copy

Filter by chart id, folder or library version at the top; "only flagged" narrows to
rows where the two sides disagree. "fit to content" sizes each pane to its chart.

A caveat worth knowing: a chart that only fails when a render lands before its data
arrives will flag on one load and not the next, and can flag on either side. If a row
looks wrong, reload it a few times before believing it.

## What is in here

    index.html      the comparison page
    manifest.json   the chart list it reads
    chart/          each chart, its data, and one page per side
    lib/baseline/   the pinned sszvis release, with its d3 and topojson
    lib/candidate/  the working copy's build, with the same d3 and topojson
${options.hasReport ? "    report.json     verdicts from the headless sweep this export was filtered by\n" : ""}
Only sszvis differs between the two sides. d3 and topojson are the same files in
both, so nothing here is explained by a different d3.
`;
