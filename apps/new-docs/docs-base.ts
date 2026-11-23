/**
 * The URL path the site is served under: `/` on its own domain, `/sszvis/` on
 * GitHub Pages. Set `DOCS_BASE` at build time to change it; both Vite's `base`
 * and React Router's `basename` read it from here so they cannot disagree.
 */
const raw = process.env.DOCS_BASE ?? "/";

/** Always with a leading and a trailing slash, which is the form Vite expects. */
export const DOCS_BASE = `/${raw}/`.replace(/\/+/g, "/");
