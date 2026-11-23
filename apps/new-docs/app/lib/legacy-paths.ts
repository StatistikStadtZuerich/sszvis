import { contentPages } from "../content-pages";

export const CHANGELOG_URL =
  "https://github.com/StatistikStadtZuerich/sszvis/blob/master/packages/sszvis/CHANGELOG.md";

/**
 * Old Catalog slug -> current route, for slugs that changed. Catalog URLs were flat
 * (`#/accessibility`, not `#/guides/accessibility`), so nested routes key on their last segment.
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
