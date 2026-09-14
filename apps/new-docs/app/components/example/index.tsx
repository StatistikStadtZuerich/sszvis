import { ExternalLink, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ResizeHandle } from "~/components/example/resize-handle";
import { SourcePanel, type LoadSources } from "~/components/example/source-panel";
import { Button } from "~/components/ui/button";
import { useAvailableWidth } from "~/hooks/use-available-width";

import { examples } from "virtual:examples";
import { typefaceCodeLabel, typefaceMeta } from "~/components/tokens/typeface";

import {
  DEFAULT_WIDTH,
  ViewportToggle,
  viewportWidth,
  type ViewportId,
} from "~/components/example/viewport-toggle";

const MIN_WIDTH = 280;
const HANDLE_SPACE = 20;
const RESERVED_HEIGHT = 420;

const measuredHeights = new Map<string, number>();

export const Example = ({ id }: { readonly id: string }) => {
  const example = examples[id];
  if (example === undefined) return <PendingExample id={id} />;
  return (
    <ExamplePreview
      url={example.url}
      title={example.title}
      views={example.views}
      loadSources={example.load}
    />
  );
};

const PendingExample = ({ id }: { readonly id: string }) => (
  <figure className="my-8 rounded-lg border border-dashed bg-muted/30 px-5 py-6 text-center">
    <div className={typefaceCodeLabel("text-foreground")}>{id}</div>
    <figcaption className={typefaceMeta("mt-2 text-muted-foreground")}>
      Not ported yet — add <code>examples/{id}/</code> and this becomes the live chart.
    </figcaption>
  </figure>
);

const ExamplePreview = ({
  url,
  title,
  views,
  loadSources,
}: {
  readonly url: string;
  readonly title: string;
  readonly views: ReadonlyArray<string>;
  readonly loadSources: LoadSources;
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [viewport, setViewport] = useState<ViewportId>("responsive");
  const [height, setHeight] = useState(
    () => measuredHeights.get(`${url}@${DEFAULT_WIDTH}`) ?? RESERVED_HEIGHT,
  );
  const [ready, setReady] = useState(false);
  const [draggedWidth, setDraggedWidth] = useState<number | null>(null);

  const room = useAvailableWidth(rootRef);
  const maxWidth = room === null ? null : Math.max(MIN_WIDTH, room.maxWidth - HANDLE_SPACE);

  const isResponsive = viewport === "responsive";

  const presetWidth =
    maxWidth === null ? null : Math.min(viewportWidth(viewport) ?? DEFAULT_WIDTH, maxWidth);
  const width =
    isResponsive && draggedWidth !== null && maxWidth !== null
      ? Math.min(draggedWidth, maxWidth)
      : presetWidth;

  const selectViewport = (id: ViewportId) => {
    setViewport(id);
    setDraggedWidth(null);
  };

  const centreX = useCallback(() => {
    const rect = rootRef.current?.getBoundingClientRect();
    return rect ? rect.left + rect.width / 2 : null;
  }, []);

  const syncHeight = useCallback(() => {
    const measured = frameRef.current?.contentDocument?.body?.scrollHeight ?? 0;
    // Zero means the chart has not drawn yet; hold the reserved height rather
    // than collapsing the box and pushing the page around.
    if (measured <= 0) return;
    setHeight(Math.ceil(measured));
    setReady(true);
  }, []);

  useEffect(() => {
    /* Remember it, so this example never has to be guessed at again. */
    if (ready && width !== null) measuredHeights.set(`${url}@${width}`, height);
  }, [ready, url, width, height]);

  useEffect(() => {
    /* A width already seen can be reserved exactly. */
    const known = width === null ? undefined : measuredHeights.get(`${url}@${width}`);
    if (known !== undefined) setHeight(known);
  }, [url, width]);

  useEffect(() => {
    const interval = setInterval(syncHeight, 200);
    return () => clearInterval(interval);
  }, [syncHeight]);

  return (
    <div ref={rootRef} className="my-8">
      <div className="relative">
        <div
          style={
            width === null ? undefined : { width, marginInline: `calc((100% - ${width}px)/2)` }
          }
          className="min-w-0"
        >
          <figure className="@container overflow-hidden rounded-lg border border-border">
            <figcaption className="flex flex-wrap items-center justify-between gap-2 border-border border-b bg-muted/40 px-2 py-1.5">
              <span className={typefaceMeta("pl-1.5 text-muted-foreground tabular-nums")}>
                {title}
                {width !== null && <span className="ml-2">{Math.round(width)}px</span>}
              </span>
              <div className="flex items-center gap-1">
                <ViewportToggle value={viewport} onChange={selectViewport} />
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<a href={url} target="_blank" rel="noopener noreferrer" />}
                  title="Open the standalone page"
                  className="text-muted-foreground"
                >
                  <ExternalLink />
                  <span className="hidden @[34rem]:inline">Open</span>
                </Button>
              </div>
            </figcaption>

            <div className="relative bg-white" style={{ height }}>
              <iframe
                ref={frameRef}
                src={url}
                title={title}
                onLoad={syncHeight}
                className="block size-full border-0"
              />
              {!ready && (
                <div
                  className={typefaceMeta(
                    "absolute inset-0 flex items-center justify-center gap-2 bg-white text-muted-foreground",
                  )}
                  role="status"
                >
                  <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />
                  Loading the chart…
                </div>
              )}
            </div>
          </figure>
        </div>

        {isResponsive && width !== null && maxWidth !== null && (
          <ResizeHandle
            centreX={centreX}
            width={width}
            min={MIN_WIDTH}
            max={maxWidth}
            onResize={setDraggedWidth}
            className="absolute inset-y-0"
            style={{ left: `calc(50% + ${width / 2}px)` }}
          />
        )}
      </div>

      <div className="-mx-4 mt-3 overflow-hidden rounded-lg border border-border">
        <SourcePanel views={views} load={loadSources} initial="js" />
      </div>
    </div>
  );
};
