import { ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { NavLink } from "~/components/ui/nav-link";
import { useActiveHeading } from "~/hooks/use-active-heading";
import type { TOCItem } from "~/lib/remark-toc-export";
import { typefaceMeta } from "~/components/tokens/typeface";
import { cn } from "~/lib/utils";

interface TableOfContentsProps {
  toc: TOCItem[];
  desktopOnly?: boolean;
  maxDepth?: number;
}

export const TableOfContents = ({ toc, desktopOnly, maxDepth }: TableOfContentsProps) => {
  const visible = useMemo(
    () => (maxDepth === undefined ? toc : toc.filter((item) => item.depth <= maxDepth)),
    [toc, maxDepth],
  );
  const ids = useMemo(() => visible.map((item) => item.id), [visible]);
  const activeId = useActiveHeading(ids);

  if (visible.length === 0) return null;

  if (desktopOnly) {
    return (
      <nav className="hidden xl:block fixed top-16 right-8 max-h-[calc(100vh-4rem)] w-48 overflow-y-auto scrollbar-none">
        <p className={typefaceMeta("mb-3 text-foreground/70")}>On this page</p>
        <TOCList toc={visible} activeId={activeId} />
      </nav>
    );
  }

  return <MobileTOC toc={visible} activeId={activeId} />;
};

const MobileTOC = ({ toc, activeId }: { toc: TOCItem[]; activeId: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="xl:hidden mb-8 rounded-xl border bg-card/70 px-4 py-3 shadow-sm shadow-foreground/3"
    >
      <CollapsibleTrigger className={typefaceMeta("flex w-full items-center justify-between")}>
        On this page
        <ChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <TOCList toc={toc} activeId={activeId} onClick={() => setOpen(false)} />
      </CollapsibleContent>
    </Collapsible>
  );
};

interface TOCNode {
  item: TOCItem;
  children: TOCNode[];
}

const buildTree = (items: TOCItem[]): TOCNode[] => {
  const root: TOCNode[] = [];
  const stack: TOCNode[] = [];

  for (const item of items) {
    const node: TOCNode = { item, children: [] };

    while (stack.length > 0 && (stack[stack.length - 1]?.item.depth || 0) >= item.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1]?.children.push(node);
    }

    stack.push(node);
  }

  return root;
};

const TOCList = ({
  toc,
  activeId,
  onClick,
}: {
  toc: TOCItem[];
  activeId: string;
  onClick?: () => void;
}) => {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
        history.replaceState(null, "", `#${id}`);
      }
      onClick?.();
    },
    [onClick],
  );

  const tree = useMemo(() => buildTree(toc), [toc]);

  return (
    <ul>
      {tree.map((node) => (
        <TOCNodeItem key={node.item.id} node={node} activeId={activeId} onClickLink={handleClick} />
      ))}
    </ul>
  );
};

const TOCNodeItem = ({
  node,
  activeId,
  onClickLink,
}: {
  node: TOCNode;
  activeId: string;
  onClickLink: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
}) => {
  const { item, children } = node;
  const isActive = item.id === activeId;

  return (
    <li>
      <NavLink
        href={`#${item.id}`}
        variant="list"
        aria-current={isActive ? "location" : undefined}
        onClick={(e) => onClickLink(e, item.id)}
      >
        {item.value}
      </NavLink>
      {children.length > 0 && (
        <ul className="ml-3 border-l border-border pl-3 space-y-0.5">
          {children.map((child) => (
            <TOCNodeItem
              key={child.item.id}
              node={child}
              activeId={activeId}
              onClickLink={onClickLink}
            />
          ))}
        </ul>
      )}
    </li>
  );
};
