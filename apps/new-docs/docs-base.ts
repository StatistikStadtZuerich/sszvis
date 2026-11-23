/** Site base path (`/sszvis/` on GitHub Pages); Vite's `base` and React Router's `basename` both read it. */
const raw = process.env.DOCS_BASE ?? "/";

export const DOCS_BASE = `/${raw}/`.replace(/\/+/g, "/");
