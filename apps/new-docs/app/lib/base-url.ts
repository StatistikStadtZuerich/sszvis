/**
 * @module new-docs/lib/base-url
 *
 * Router links pick up the site's base path on their own; a plain `src` or `href`
 * written from the root does not. This prefixes one, so `/favicon.png` is still
 * found when the site is served under `/sszvis/` on GitHub Pages.
 */

/** A root-relative path (`/guides/x.png`) under the site base; anything else unchanged. */
export function withBase(url: string): string;
export function withBase(url: string | undefined): string | undefined;
export function withBase(url: string | undefined) {
  if (url === undefined || !url.startsWith("/") || url.startsWith("//")) return url;
  return `${import.meta.env.BASE_URL}${url.slice(1)}`;
}
