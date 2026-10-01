import { Fragment } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Choice, Swatch } from "../domain/spec";

/**
 * The colours a choice stands for.
 *
 * A blended one is drawn as the ramp its stops make, in CSS's default sRGB. The library
 * writes its stops in Lab but leaves `scaleLinear` on d3's default interpolator, which
 * blends a colour in RGB, so sRGB is the space the map's own in-between colours are in.
 * Everything else is drawn as the separate colours it is, in equal blocks, since nothing
 * lies between two categories.
 */
const SwatchMark = ({ swatch }: { readonly swatch: Swatch }) => {
  const stops = swatch.colors;
  const shared = "h-3 w-10 shrink-0 overflow-hidden rounded-xs border border-border";

  /* One colour is a block whichever it asked for, and `linear-gradient` takes no single stop. */
  if (swatch.blend === true && stops.length > 1) {
    return (
      <span
        aria-hidden="true"
        className={shared}
        style={{ backgroundImage: `linear-gradient(to right, ${stops.join(", ")})` }}
      />
    );
  }
  return (
    <span aria-hidden="true" className={`${shared} flex`}>
      {stops.map((color, index) => (
        <span
          // oxlint-disable-next-line no-array-index-key -- a palette may repeat a colour, and its position is what identifies it.
          key={index}
          className="h-full flex-1"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
};

/** The choices in the order they were given, gathered under the family each one names. */
const byGroup = (choices: readonly Choice[]): readonly [string, readonly Choice[]][] => {
  const groups = new Map<string, Choice[]>();
  for (const choice of choices) {
    const name = choice.group ?? "";
    const found = groups.get(name);
    if (found === undefined) groups.set(name, [choice]);
    else found.push(choice);
  }
  return [...groups];
};

/**
 * A menu of an option's choices.
 *
 * Two things a choice can ask for beyond its name, and both are the menu's to draw rather
 * than each option's: a swatch of the colours it stands for, and the family it belongs to,
 * which gathers it under a heading. An option that asks for neither reads as a plain menu.
 */
export const ChoiceSelect = ({
  id,
  value,
  choices,
  onChange,
}: {
  readonly id: string;
  readonly value: string;
  readonly choices: readonly Choice[];
  readonly onChange: (next: string) => void;
}) => {
  const current = choices.find((choice) => choice.value === value);
  const groups = byGroup(choices);

  const item = (choice: Choice) => (
    <SelectItem key={choice.value} value={choice.value}>
      {choice.swatch !== undefined && <SwatchMark swatch={choice.swatch} />}
      {choice.label}
    </SelectItem>
  );

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next ?? "")}
      items={choices.map((choice) => ({ value: choice.value, label: choice.label }))}
    >
      <SelectTrigger id={id} className="w-full">
        {current?.swatch !== undefined && <SwatchMark swatch={current.swatch} />}
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        {groups.map(([name, items]) =>
          /* A heading over everything in the menu names nothing, so one family gets none. */
          name === "" || groups.length === 1 ? (
            <Fragment key={name}>{items.map(item)}</Fragment>
          ) : (
            <SelectGroup key={name}>
              <SelectLabel>{name}</SelectLabel>
              {items.map(item)}
            </SelectGroup>
          ),
        )}
      </SelectContent>
    </Select>
  );
};
