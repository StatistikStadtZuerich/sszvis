import { Array, Option, Record, String } from "effect";

import { code, str, type Safe } from "./emit";
import { escapeHtml } from "./host";
import { RoleKey, type RoleKind, type Spec, type Tooltip } from "./spec";

export type TooltipRole = {
  readonly accessor: string;
  readonly kind: RoleKind;
  /** Plain text after the value, a unit; escaped here, since the tooltip is markup. */
  readonly suffix?: string;
  readonly missing?: string;
};

export type TooltipRoles = { readonly [key in RoleKey]: TooltipRole };

const NO_ROLE = RoleKey.make("");

export type TextFormat = "HTML" | "SVG";

export const resolveTooltip = (
  tooltip: Tooltip,
  fallback: Tooltip,
  bound: readonly RoleKey[],
): Tooltip => {
  const header = Array.findFirst([tooltip.header, fallback.header], (candidate) =>
    bound.includes(candidate),
  ).pipe(Option.getOrElse(() => NO_ROLE));
  return {
    header,
    body: tooltip.body.filter((key) => key !== header && bound.includes(key)),
  };
};

export const boundRoles = (spec: Spec, keys: readonly RoleKey[]): readonly RoleKey[] =>
  keys.filter((key) => Option.exists(Record.get(spec.fields, key), String.isNonEmpty));

/*
 * Both modularText flavours build markup - HTML for a tooltip, SVG tspans for a ruler label -
 * and write every word into it as is. A category is the table's own text, so the emitted code
 * escapes it as it reads it; numbers and dates come out of sszvis's formatters, and the
 * suffix and missing label are known now, so they are escaped here instead.
 */
const ESCAPE = ".replace(/[&<>]/g, (c) => `&#${c.charCodeAt(0)};`)";

const formatted = (role: TooltipRole, datum: string): string => {
  const { accessor, kind, missing } = role;
  if (kind === "category") return `(d: ${datum}) => String(${accessor}(d))${ESCAPE}`;
  if (kind === "date") return `(d: ${datum}) => sszvis.formatAxisTimeFormat(${accessor}(d))`;
  if (missing === undefined) return `(d: ${datum}) => sszvis.formatNumber(${accessor}(d))`;
  return [
    `(d: ${datum}) => {`,
    `  const value = ${accessor}(d);`,
    `  return Number.isNaN(value) ? ${str(escapeHtml(missing))} : sszvis.formatNumber(value);`,
    "}",
  ].join("\n");
};

const words = (style: "bold" | "plain", role: TooltipRole, datum: string): string[] => [
  `.${style}(${formatted(role, datum)})`,
  ...(role.suffix === undefined ? [] : [`.plain(${str(escapeHtml(role.suffix))})`]),
];

/**
 * `datum` names the type the accessors take, which is the row type for most charts
 * and is not always: a stacked area's ruler reads a point on a band, so its
 * accessors take that instead. It is a type name rather than a type because the
 * result is source, and the name has to be one the template declares.
 */
export const tooltipText = (
  format: TextFormat,
  spec: Spec,
  roles: TooltipRoles,
  fallback: Tooltip,
  datum = "Datum",
): Safe => {
  const { header, body } = resolveTooltip(
    spec.tooltip,
    fallback,
    boundRoles(spec, Record.keys(roles)),
  );
  const headerRole = roles[header];
  const bodyRoles = Array.getSomes(body.map((key) => Record.get(roles, key)));

  const lines = [
    `sszvis.modularText${format}()`,
    ...(headerRole === undefined ? [] : words("bold", headerRole, datum)),
    ...(format === "HTML" && headerRole !== undefined && bodyRoles.length > 0
      ? [".newline()"]
      : []),
    ...bodyRoles.flatMap((role) => words("plain", role, datum)),
  ];
  return code(lines.join("\n"));
};
