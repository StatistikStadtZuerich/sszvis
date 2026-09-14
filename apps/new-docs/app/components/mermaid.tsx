import mermaid from "mermaid";
import { useEffect, useId, useState } from "react";

export const Mermaid = ({ chart }: { chart: string }) => {
  // mermaid needs a DOM-id-safe handle; useId's colons are not.
  const id = `mermaid-${useId().replaceAll(":", "")}`;
  const [svg, setSvg] = useState("");

  useEffect(() => {
    let cancelled = false;
    const root = document.documentElement;

    const render = async () => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: root.getAttribute("data-theme") === "dark" ? "dark" : "neutral",
      });
      try {
        const rendered = await mermaid.render(id, chart);
        if (!cancelled) setSvg(rendered.svg);
      } catch {
        if (!cancelled) setSvg("");
      }
    };

    void render();

    // Re-render on a theme switch so the diagram's palette follows the page.
    const observer = new MutationObserver(() => void render());
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [chart, id]);

  return (
    <div
      className="my-6 overflow-x-auto rounded-sm border border-border bg-muted/50 px-5 py-4 text-foreground [&_.mermaid]:m-0 [&_svg]:mx-auto [&_svg]:max-w-none"
      role="img"
      aria-label="Diagram"
      data-content-block=""
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
