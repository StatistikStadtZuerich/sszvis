import { useCallback, useRef, useState } from "react";
import { cn } from "~/lib/utils";

const KEY_STEP = 32;

export const ResizeHandle = ({
  centreX,
  width,
  min,
  max,
  onResize,
  className,
  style,
}: {
  readonly centreX: () => number | null;
  readonly width: number;
  readonly min: number;
  readonly max: number;
  readonly onResize: (width: number) => void;
  readonly className?: string;
  readonly style?: React.CSSProperties;
}) => {
  const [dragging, setDragging] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const widthAt = useCallback(
    (clientX: number) => {
      const centre = centreX();
      if (centre === null) return null;
      return Math.round(Math.min(max, Math.max(min, (clientX - centre) * 2)));
    },
    [centreX, max, min],
  );

  const stop = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    try {
      if (elementRef.current?.hasPointerCapture(event.pointerId)) {
        elementRef.current.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* already released */
    }
  }, []);

  return (
    <div
      ref={elementRef}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the preview"
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={(event) => {
        // Captured, so the drag survives the pointer crossing into the iframe.
        // Capture can be refused (a pointer that is already gone); the drag is
        // still usable without it, so never let that throw out of the handler.
        try {
          elementRef.current?.setPointerCapture(event.pointerId);
        } catch {
          /* not capturable - carry on */
        }
        setDragging(true);
        event.preventDefault();
      }}
      onPointerMove={(event) => {
        if (!dragging) return;
        const next = widthAt(event.clientX);
        if (next !== null) onResize(next);
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onKeyDown={(event) => {
        const step =
          event.key === "ArrowRight" ? KEY_STEP : event.key === "ArrowLeft" ? -KEY_STEP : 0;
        if (step === 0) return;
        event.preventDefault();
        onResize(Math.round(Math.min(max, Math.max(min, width + step))));
      }}
      style={style}
      className={cn(
        "group flex w-5 shrink-0 cursor-ew-resize touch-none items-center justify-center",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
        className,
      )}
    >
      <div
        className={cn(
          "h-8 w-1 rounded-full transition-colors",
          dragging ? "bg-primary" : "bg-border group-hover:bg-muted-foreground",
        )}
      />
    </div>
  );
};
