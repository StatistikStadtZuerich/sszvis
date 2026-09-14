import { contentPages } from "./content-pages";

export type NavItem = { readonly label: string; readonly href: string };
export type NavSection = {
  readonly title: string;
  readonly items: ReadonlyArray<NavItem>;
};

export const navigation: ReadonlyArray<NavSection> = contentPages.reduce<Array<NavSection>>(
  (sections, page) => {
    const current = sections.at(-1);
    const item = { label: page.label, href: page.href };
    if (current?.title === page.section) {
      sections[sections.length - 1] = {
        title: current.title,
        items: [...current.items, item],
      };
    } else {
      sections.push({ title: page.section, items: [item] });
    }
    return sections;
  },
  [],
);
