import { Array, Option, Record, String } from "effect";

import { code, str, type Safe } from "./emit";
import { RoleKey, type RoleKind, type Spec, type Tooltip } from "./spec";

export type TooltipRole = {
  readonly accessor: string;
  readonly kind: RoleKind;
  readonly suffix?: Safe;
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

const formatted = (role: TooltipRole): string => {
  const { accessor, kind, missing } = role;
  if (kind === "category") return accessor;
  if (kind === "date") return `(d: Datum) => sszvis.formatAxisTimeFormat(${accessor}(d))`;
  if (missing === undefined) return `(d: Datum) => sszvis.formatNumber(${accessor}(d))`;
  return [
    "(d: Datum) => {",
    `  const value = ${accessor}(d);`,
    `  return Number.isNaN(value) ? ${str(missing)} : sszvis.formatNumber(value);`,
    "}",
  ].join("\n");
};

const words = (style: "bold" | "plain", role: TooltipRole): string[] => [
  `.${style}(${formatted(role)})`,
  ...(role.suffix === undefined ? [] : [`.plain(${role.suffix})`]),
];

export const tooltipText = (
  format: TextFormat,
  spec: Spec,
  roles: TooltipRoles,
  fallback: Tooltip,
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
    ...(headerRole === undefined ? [] : words("bold", headerRole)),
    ...(format === "HTML" && headerRole !== undefined && bodyRoles.length > 0
      ? [".newline()"]
      : []),
    ...bodyRoles.flatMap((role) => words("plain", role)),
  ];
  return code(lines.join("\n"));
};
