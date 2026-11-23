"use client";

import { useCallback, useRef } from "react";
import { CopyButton } from "~/components/copy-button";
import { typefaceCode } from "~/components/tokens/typeface";
import { cn } from "~/lib/utils";

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode;
}

export const CodeBlock = ({ className, children, ...props }: CodeBlockProps) => {
  const preRef = useRef<HTMLPreElement>(null);

  const getValue = useCallback(() => {
    if (!preRef.current) return "";
    return preRef.current.textContent ?? "";
  }, []);

  return (
    <div className="group relative mb-4 min-w-0 max-w-full">
      <pre
        ref={preRef}
        className={typefaceCode(
          cn(
            "max-w-full overflow-x-auto rounded-sm border border-border bg-code-block p-5 text-code-block-foreground",
            className,
          ),
        )}
        {...props}
      >
        {children}
      </pre>
      <CopyButton getValue={getValue} className="opacity-0 group-hover:opacity-100" />
    </div>
  );
};
