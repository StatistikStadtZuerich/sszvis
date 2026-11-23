import { Array, Option } from "effect";

import { dateFormatOf } from "./csv";
import { code, str, type Safe } from "./emit";
import type { Annotation, AnnotationAxis, Position, RoleKind } from "./spec";

const parseFiniteNumber = (value: string): Option.Option<number> => {
  const trimmed = value.trim();
  if (trimmed === "") return Option.none();
  const number = Number(trimmed);
  return Number.isFinite(number) ? Option.some(number) : Option.none();
};

export const positionCode = (kind: RoleKind, at: Position): Option.Option<Safe> => {
  if (at.kind === "mean") return kind === "number" ? Option.some(str("mean")) : Option.none();
  switch (kind) {
    case "number":
      return Option.map(parseFiniteNumber(at.value), (number) => code(String(number)));
    case "date": {
      const value = at.value.trim();
      const format = dateFormatOf([value]);
      return format === undefined
        ? Option.none()
        : Option.some(
            code(`${format === "year" ? "sszvis.parseYear" : "sszvis.parseDate"}(${str(value)})`),
          );
    }
    case "category":
      return Option.none();
  }
};

export const isValidPosition = (kind: RoleKind, at: Position): boolean =>
  Option.isSome(positionCode(kind, at));

export const referenceLinesCode = (
  annotations: readonly Annotation[],
  axes: readonly AnnotationAxis[],
): Safe => {
  const entries = Array.getSomes(
    annotations.map((annotation) =>
      Array.findFirst(axes, (candidate) => candidate.role === annotation.role).pipe(
        Option.flatMap((axis) =>
          Option.map(positionCode(axis.kind, annotation.at), (at) => ({ axis, at })),
        ),
        Option.map(({ axis, at }) => {
          const fields = [
            ...(axes.length > 1 ? [`axis: ${str(axis.axis)}`] : []),
            `at: ${at}`,
            `label: ${str(annotation.label)}`,
          ];
          return `{ ${fields.join(", ")} }`;
        }),
      ),
    ),
  );
  return code(`[${entries.join(", ")}]`);
};
