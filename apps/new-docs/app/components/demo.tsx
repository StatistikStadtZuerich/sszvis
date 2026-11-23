import { useEffect, useRef, useState, type ReactNode } from "react";

import { withBase } from "~/lib/base-url";

/**
 * Runs the HTML snippet in its children and shows the result above it. These
 * are the handful-of-lines snippets the colors and tooltips guides use to draw
 * swatches and tooltips inline: too small for an example page of their own.
 *
 * The snippet is read back from the rendered code block, so the page shows and
 * runs the same text. It runs in a same-origin frame with d3, the library and
 * `public/guide-demos/helpers.{js,css}`, and the frame grows to fit what it draws.
 */
export const Demo = ({ children }: { readonly children?: ReactNode }) => {
  const codeRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const snippet = codeRef.current?.querySelector("pre")?.textContent ?? "";
    setSrcDoc(demoPage(snippet));
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (frame === null || srcDoc === null) return;
    let observer: ResizeObserver | undefined;
    const onLoad = () => {
      const body = frame.contentDocument?.body;
      if (!body) return;
      observer = new ResizeObserver(() => setHeight(body.scrollHeight));
      observer.observe(body);
    };
    frame.addEventListener("load", onLoad);
    return () => {
      frame.removeEventListener("load", onLoad);
      observer?.disconnect();
    };
  }, [srcDoc]);

  return (
    <div className="my-6">
      <div className="mb-2 overflow-hidden rounded-lg border border-border bg-white">
        {srcDoc !== null && (
          <iframe
            ref={frameRef}
            srcDoc={srcDoc}
            title="Live demo"
            className="block w-full border-0"
            style={{ height }}
          />
        )}
      </div>
      <div ref={codeRef}>{children}</div>
    </div>
  );
};

const absolute = (url: string) => new URL(withBase(url), window.location.href).href;

const demoPage = (snippet: string) => `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <link href="${absolute("/preview/_assets/sszvis.css")}" rel="stylesheet" />
    <link href="${absolute("/guide-demos/helpers.css")}" rel="stylesheet" />
    <style>
      html { color-scheme: light; }
      html, body { margin: 0; background: #fff; }
      body { box-sizing: border-box; padding: 24px; display: flow-root; }
    </style>
  </head>
  <body>
    <script src="https://unpkg.com/d3@7/dist/d3.min.js"></script>
    <script src="${absolute("/preview/_assets/sszvis.js")}"></script>
    <script src="${absolute("/guide-demos/helpers.js")}"></script>
    ${snippet}
  </body>
</html>`;
