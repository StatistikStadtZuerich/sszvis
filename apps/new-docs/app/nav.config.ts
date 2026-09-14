import { contentPages } from "./content-pages";

export type NavItem = { readonly label: string; readonly href: string };
export type NavLink = NavItem & { readonly kind: "link" };
export type NavSection = {
  readonly kind: "section";
  readonly title: string;
  readonly items: ReadonlyArray<NavItem>;
};
export type NavEntry = NavLink | NavSection;

/**
 * Pages with a `section` collapse into one expandable entry; a page without one
 * stands alone as a plain link.
 */
export const navigation: ReadonlyArray<NavEntry> = contentPages.reduce<Array<NavEntry>>(
  (entries, page) => {
    const item = { label: page.label, href: page.href };
    if (page.section === null) {
      entries.push({ kind: "link", ...item });
      return entries;
    }
    const current = entries.at(-1);
    if (current?.kind === "section" && current.title === page.section) {
      entries[entries.length - 1] = {
        kind: "section",
        title: current.title,
        items: [...current.items, item],
      };
    } else {
      entries.push({ kind: "section", title: page.section, items: [item] });
    }
    return entries;
  },
  [],
);
