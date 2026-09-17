import { BUNDLE } from "./host";
import { utf8, type ZipEntry } from "./zip";
import type { Asset } from "./spec";

/** What the bundle carries besides its source: bytes fetched from the app's own build. */
export type Binary = { readonly url: string; readonly name: string };

/**
 * Fetches one file, or gives up on it. `fetch` rejects only when the network does,
 * so a 404 arrives as a perfectly good response carrying an error page - which
 * would otherwise ship as the image, or as the geometry.
 */
const fetchEntry = (read: typeof fetch, file: Binary): Promise<ZipEntry | null> =>
  read(file.url)
    .then(async (response) =>
      response.ok
        ? { name: file.name, content: new Uint8Array(await response.arrayBuffer()) }
        : null,
    )
    .catch(() => null);

/**
 * An asset the archive could not read. The chart cannot draw without one - the emitted
 * `index.html` names it - so this ends the download rather than shipping an archive that
 * is certain to fail when it is opened.
 */
export class MissingAssetError extends Error {
  constructor(readonly files: readonly string[]) {
    super(`The chart could not read ${files.join(", ")}, so the archive was not built.`);
    this.name = "MissingAssetError";
  }
}

/**
 * Everything the exported archive holds. The three sources are already in hand; the
 * fallback image and whatever else the chart loads have to be read from the app.
 *
 * A file that cannot be read is never shipped empty, so an archive holds a good copy or
 * none at all. The two kinds of file differ in what "none at all" may mean: the fallback
 * image is decoration and the archive is still a working chart without it, while an asset
 * is named by the emitted page and the chart is broken without it - so a missing asset
 * fails the download instead of quietly producing an archive that cannot draw.
 */
export const bundleEntries = async (
  generated: { readonly html: string; readonly js: string; readonly csv: string },
  assets: readonly Asset[],
  fallbackUrl: string,
  read: typeof fetch = fetch,
): Promise<readonly ZipEntry[]> => {
  const fallback = await fetchEntry(read, { url: fallbackUrl, name: BUNDLE.fallback });
  const fetched = await Promise.all(
    assets.map(
      async (asset) =>
        [asset, await fetchEntry(read, { url: asset.source, name: asset.path })] as const,
    ),
  );

  const missing = fetched.filter(([, entry]) => entry === null).map(([asset]) => asset.path);
  if (missing.length > 0) throw new MissingAssetError(missing);

  return [
    { name: BUNDLE.html, content: utf8(generated.html) },
    { name: BUNDLE.chart, content: utf8(generated.js) },
    { name: BUNDLE.data, content: utf8(generated.csv) },
    ...(fallback === null ? [] : [fallback]),
    ...fetched.map(([, entry]) => entry).filter((entry) => entry !== null),
  ];
};
