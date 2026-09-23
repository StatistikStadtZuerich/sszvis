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
import type { Choice } from "../domain/spec";

/**
 * The colours a choice stands for, drawn as the ramp they make.
 *
 * Interpolated in Oklab rather than sRGB, which is CSS's default: the library builds its
 * scales in Lab, and a gradient run through sRGB would show a swatch the chart does not
 * match - most visibly in the middle of a diverging ramp, where sRGB dips toward grey.
 */
const Swatch = ({ stops }: { readonly stops: readonly string[] }) => {
  /* One colour is a block, not a ramp, and `linear-gradient` will not take a single stop. */
  const style =
    stops.length === 1
      ? { backgroundColor: stops[0] }
      : { backgroundImage: `linear-gradient(to right in oklab, ${stops.join(", ")})` };
  return (
    <span
      aria-hidden="true"
      className="h-3 w-10 shrink-0 rounded-xs border border-border"
      style={style}
    />
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
      {choice.swatch !== undefined && <Swatch stops={choice.swatch} />}
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
        {current?.swatch !== undefined && <Swatch stops={current.swatch} />}
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start">
        {groups.map(([name, items]) =>
          name === "" ? (
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
