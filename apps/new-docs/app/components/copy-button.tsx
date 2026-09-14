"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";

interface CopyButtonProps {
  getValue: () => string;
  className?: string;
}

export const CopyButton = ({ getValue, className }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(getValue()).catch(() => setCopied(false));
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, [getValue]);

  return (
    <Button
      onClick={handleCopy}
      variant="ghost"
      className={cn(
        "absolute top-2 right-2 flex size-10 items-center justify-center transition-[color,background-color,opacity] duration-150 hover:bg-background/70 hover:text-code-block-foreground",
        className,
      )}
      aria-label={copied ? "Copied" : "Copy code"}
    >
      {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
    </Button>
  );
};
