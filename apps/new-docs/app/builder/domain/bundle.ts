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
 * Everything the exported archive holds. The three sources are already in hand; the
 * fallback image and whatever else the chart loads have to be read from the app.
 *
 * A file that cannot be read is left out rather than shipped empty, so an archive is
 * always missing a file or holding a good one, never holding a broken one.
 */
export const bundleEntries = async (
  generated: { readonly html: string; readonly js: string; readonly csv: string },
  assets: readonly Asset[],
  fallbackUrl: string,
  read: typeof fetch = fetch,
): Promise<readonly ZipEntry[]> => {
  const binaries: readonly Binary[] = [
    { url: fallbackUrl, name: BUNDLE.fallback },
    ...assets.map((asset) => ({ url: asset.source, name: asset.path })),
  ];
  const fetched = await Promise.all(binaries.map((file) => fetchEntry(read, file)));
  return [
    { name: BUNDLE.html, content: utf8(generated.html) },
    { name: BUNDLE.chart, content: utf8(generated.js) },
    { name: BUNDLE.data, content: utf8(generated.csv) },
    ...fetched.filter((entry) => entry !== null),
  ];
};
