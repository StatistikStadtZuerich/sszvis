import type { ThemeRegistrationRaw } from "shiki";

/**
 * Syntax colours lifted from the old Catalog docs, which highlighted with Prism
 * and used a deliberately restrained scheme - three accents over a single base:
 *
 *   #00263e  default: strings, numbers, identifiers, operators
 *   #535353  punctuation and brackets
 *   #3f7397  keywords (var, function, return, ...) and comments
 *   #ff5555  function names, at declaration and at the call site
 *
 * Markup is the exception: in an HTML block Prism painted tag names, attribute
 * names and attribute values all #ff5555, leaving only punctuation grey - so
 * markup carries a few extra scopes below. Note that HTML attribute values are
 * #ff5555 while JavaScript strings stay at the base, which is why the string
 * scopes here are language-qualified rather than a bare `string`.
 *
 * Nothing else was coloured; Prism's remaining token types fell through to the
 * base. The scope lists below reproduce that, so anything not named here stays
 * at the editor foreground rather than picking up a highlighter's own palette.
 */

const BASE = "#00263e";
const PUNCTUATION = "#535353";
const KEYWORD = "#3f7397";
const FUNCTION = "#ff5555";

const KEYWORD_SCOPES = [
  "comment",
  "keyword",
  "keyword.control",
  "keyword.operator.new",
  "keyword.operator.expression",
  "storage",
  "storage.type",
  "storage.modifier",
  "variable.language",
  "constant.language",
];

/*
 * Deliberately narrow: the broad `meta.function-call` scope wraps the whole call
 * expression, which would colour the receiver too (`sszvis` in
 * `sszvis.parseDate()`), where Prism coloured only the called name.
 */
const FUNCTION_SCOPES = [
  "entity.name.function",
  "support.function",
  "variable.function",
  // Markup: tag names, attribute names, and the attribute values themselves.
  "entity.name.tag",
  "entity.other.attribute-name",
  "string.quoted.double.html",
  "string.quoted.single.html",
  "string.unquoted.html",
  // CSS in a style attribute was red the same way.
  "support.type.property-name.css",
];

const PUNCTUATION_SCOPES = [
  "punctuation",
  "meta.brace",
  "punctuation.definition.tag",
  "punctuation.separator",
  "punctuation.terminator",
  "punctuation.accessor",
];

const theme = (
  name: string,
  type: "light" | "dark",
  background: string,
  colors: { base: string; punctuation: string; keyword: string; function: string },
): ThemeRegistrationRaw => ({
  name,
  type,
  colors: { "editor.foreground": colors.base, "editor.background": background },
  settings: [
    { settings: { foreground: colors.base, background } },
    { scope: PUNCTUATION_SCOPES, settings: { foreground: colors.punctuation } },
    { scope: KEYWORD_SCOPES, settings: { foreground: colors.keyword } },
    { scope: FUNCTION_SCOPES, settings: { foreground: colors.function } },
  ],
});

export const catalogLight = theme("catalog-light", "light", "#ffffff", {
  base: BASE,
  punctuation: PUNCTUATION,
  keyword: KEYWORD,
  function: FUNCTION,
});

/**
 * The old docs were light-only. Dark keeps each accent's hue and lifts its
 * lightness until it carries on a dark panel.
 */
export const catalogDark = theme("catalog-dark", "dark", "#111111", {
  base: "#cbd9e3",
  punctuation: "#8c8c8c",
  keyword: "#7fb0d0",
  function: "#ff8f8f",
});
