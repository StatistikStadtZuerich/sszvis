import { Array, Option } from "effect";

import { code, str, type Safe } from "./emit";
import type { Annotation, AnnotationAxis, Position, RoleKind } from "./spec";

/** `dd.mm.yyyy`, which is what `sszvis.parseDate` reads. */
const SWISS_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

/** The date a `dd.mm.yyyy` string names, or `None` when it does not name a calendar day. */
export const parseSwissDate = (value: string): Option.Option<Date> => {
  const match = SWISS_DATE.exec(value.trim());
  if (match === null) return Option.none();
  const [, day = "", month = "", year = ""] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const isCalendarDay =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);
  return isCalendarDay ? Option.some(date) : Option.none();
};

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
      Array.findFirst(axes, (candidate) => candidate.axis === annotation.axis).pipe(
        Option.flatMap((axis) => positionCode(axis.kind, annotation.at)),
        Option.map((at) => {
          const fields = [
            ...(axes.length > 1 ? [`axis: ${str(annotation.axis)}`] : []),
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
