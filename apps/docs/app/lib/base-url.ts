/* Router links get the base path on their own; a plain root-relative `src` or `href` does not. */

export function withBase(url: string): string;
export function withBase(url: string | undefined): string | undefined;
export function withBase(url: string | undefined) {
  if (url === undefined || !url.startsWith("/") || url.startsWith("//")) return url;
  return `${import.meta.env.BASE_URL}${url.slice(1)}`;
}
