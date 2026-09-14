/**
 * The one place a page is registered: routes.ts and nav.config.ts are both
 * derived from this list, in this order. An empty routePath is the site index.
 */
export const contentPages = [
  {
    section: "Introduction",
    label: "Installation",
    href: "/",
    routePath: "",
    contentPath: "content/index.mdx",
  },
  {
    section: "Introduction",
    label: "Getting Started",
    href: "/getting-started",
    routePath: "getting-started",
    contentPath: "content/getting-started.mdx",
  },
] as const;
