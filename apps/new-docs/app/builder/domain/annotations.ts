import { Array, Option } from "effect";

import { parseSwissDate } from "./csv";
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
    case "date":
      return Option.map(parseSwissDate(at.value), () =>
        code(`sszvis.parseDate(${str(at.value.trim())})`),
      );
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
      /* The spec names a role; the template draws on an axis. The recipe joins the two. */
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
