import type { CodeToHastOptions } from "shiki/core";

import { languageForPath } from "./example-languages.ts";
import { catalogDark, catalogLight } from "./shiki-catalog-theme.ts";

export const HIGHLIGHT_THEMES = [catalogLight, catalogDark];

export const highlightOptions = (filename: string): CodeToHastOptions | null => {
  const lang = languageForPath(filename);
  if (lang === null) return null;
  return {
    lang,
    themes: { light: catalogLight.name ?? "", dark: catalogDark.name ?? "" },
    defaultColor: false,
  };
};
