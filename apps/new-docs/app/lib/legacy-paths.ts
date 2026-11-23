import { contentPages } from "../content-pages";

/** The previous docs served the changelog as a page; these docs have none, so old links go to the file. */
export const CHANGELOG_URL =
  "https://github.com/StatistikStadtZuerich/sszvis/blob/master/packages/sszvis/CHANGELOG.md";

/**
 * Where a page of the previous docs (Catalog) lives now, by its old slug, for every
 * slug that did not carry over unchanged.
 *
 * Catalog gave each page the URL of its own `path`, whatever group it sat in, so the
 * guides were `#/accessibility`, not `#/guides/accessibility`. These docs nest them,
 * so each nested route is listed under its last segment. Two more were renamed or
 * dropped outright.
 */
export const LEGACY_PATHS: Readonly<Record<string, string>> = {
  ...Object.fromEntries(
    contentPages
      .filter((page) => page.routePath.includes("/"))
      .map((page) => [page.routePath.slice(page.routePath.lastIndexOf("/") + 1), page.routePath]),
  ),
  "line-charts": "line-chart",
  changelog: CHANGELOG_URL,
};
