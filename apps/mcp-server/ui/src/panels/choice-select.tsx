import { Fragment } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select.tsx";
import type { Choice, Swatch } from "@sszvis/chart-builder/spec";

const SwatchMark = ({ swatch }: { readonly swatch: Swatch }) => {
  const stops = swatch.colors;
  const shared = "h-3 w-10 shrink-0 overflow-hidden rounded-xs border border-border";

  if (swatch.blend === true && stops.length > 1) {
    /* One colour is a block whichever it asked for, and `linear-gradient` takes no single stop. */
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
