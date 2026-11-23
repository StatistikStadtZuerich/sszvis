/*
 * The docs builder's code panel, cut down to what an iframe can offer: the two scripts and
 * a copy button. No highlighting (shiki would ship its grammars into the page) and no zip
 * download, which the host would have to allow.
 */
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button.tsx";
import { ToggleButton, ToggleButtonGroup } from "../components/ui/toggle-button-group.tsx";
import type { ChartUpdate } from "../../../src/chartTools.ts";

const FILES = { ts: "chart.ts", js: "chart.js" } as const;
type File = keyof typeof FILES;

/** A sandboxed frame may lack clipboard-write; selecting the text still lets the reader copy it. */
async function copyText(text: string, fallback: HTMLElement | null) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (fallback === null) return false;
    const range = document.createRange();
    range.selectNodeContents(fallback);
    document.getSelection()?.removeAllRanges();
    document.getSelection()?.addRange(range);
    return document.execCommand("copy");
  }
}

export const CodePanel = ({ update }: { readonly update: ChartUpdate }) => {
  const [file, setFile] = useState<File>("ts");
  const [copied, setCopied] = useState(false);
  const [source, setSource] = useState<HTMLElement | null>(null);
  const text = update[file];

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex items-center gap-2">
        <ToggleButtonGroup
          aria-label="File"
          value={file}
          onValueChange={(next) => setFile(next === "js" ? "js" : "ts")}
        >
          {(Object.keys(FILES) as File[]).map((key) => (
            <ToggleButton key={key} value={key} size="sm">
              {FILES[key]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={async () => {
            setCopied(await copyText(text, source));
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="max-h-[32rem] min-h-0 overflow-auto rounded-md border bg-muted p-3 font-mono text-xs">
        <code id="source" ref={setSource}>
          {text}
        </code>
      </pre>
    </div>
  );
};
