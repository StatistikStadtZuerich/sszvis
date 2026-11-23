import { useEffect, useState, type RefObject } from "react";

type Room = {
  readonly columnWidth: number;
  readonly maxWidth: number;
};

const same = (a: Room | null, b: Room) =>
  a !== null &&
  Math.abs(a.columnWidth - b.columnWidth) < 1 &&
  Math.abs(a.maxWidth - b.maxWidth) < 1;

export function useAvailableWidth(ref: RefObject<HTMLElement | null>) {
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    const column = ref.current?.parentElement;
    const main = ref.current?.closest("main");
    if (!column || !main) return;

    const measure = () => {
      const style = getComputedStyle(main);
      const mainRect = main.getBoundingClientRect();
      const contentLeft = mainRect.left + Number.parseFloat(style.paddingLeft);
      const contentRight = mainRect.right - Number.parseFloat(style.paddingRight);

      const columnRect = column.getBoundingClientRect();
      const centre = columnRect.left + columnRect.width / 2;

      const half = Math.min(centre - contentLeft, contentRight - centre);

      const next: Room = {
        columnWidth: columnRect.width,
        maxWidth: Math.max(0, half * 2),
      };
      setRoom((current) => (same(current, next) ? current : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(main);
    return () => observer.disconnect();
  }, [ref]);

  return room;
}
