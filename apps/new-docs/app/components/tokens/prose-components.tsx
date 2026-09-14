import type React from "react";
import type { ComponentPropsWithoutRef } from "react";
import { Link } from "react-router";

import { CodeBlock } from "~/components/code-block";
import { Callout } from "~/components/ui/callout";
import { Demo } from "~/components/demo";
import { Example } from "~/components/example";
import { Gallery } from "~/components/gallery";
import { Mermaid } from "~/components/mermaid";
import {
  typefaceAnchor,
  typefaceBody,
  typefaceHeading1,
  typefaceHeading2,
  typefaceHeading3,
  typefaceHeading4,
  typefaceHeading5,
  typefaceHeading6,
  typefaceLead,
} from "~/components/tokens/typeface";
import { cn } from "~/lib/utils";

export const proseComponents = {
  h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className={cn(typefaceHeading1(), "mt-2 scroll-m-20", className)} {...props} />
  ),
  h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={cn(typefaceHeading2(), "mt-12 scroll-m-20 first:mt-0", className)} {...props} />
  ),
  h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn(typefaceHeading3(), "mt-8 scroll-m-20", className)} {...props} />
  ),
  h4: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className={cn(typefaceHeading4(), "mt-8 scroll-m-20", className)} {...props} />
  ),
  h5: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5 className={cn(typefaceHeading5(), "mt-8 scroll-m-20", className)} {...props} />
  ),
  h6: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h6 className={cn(typefaceHeading6(), "mt-8 scroll-m-20", className)} {...props} />
  ),
  p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn(typefaceBody("not-first:mt-5"), className)} {...props} />
  ),
  ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className={cn(typefaceBody(), "my-5 ml-6 list-disc", className)} {...props} />
  ),
  ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className={cn(typefaceBody(), "my-5 ml-6 list-decimal", className)} {...props} />
  ),
  li: ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className={cn(typefaceBody(), "mt-2", className)} {...props} />
  ),
  /*
   * In the ported docs a `>` block is never a quotation: it is the lead
   * paragraph each page opens with. The old docs drew it as plain prose one
   * step up in size, so it gets no rule, tint or italics here either.
   */
  blockquote: ({ className, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className={cn(typefaceLead(), "mt-5 mb-8 *:text-inherit *:leading-[inherit]", className)}
      {...props}
    />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  a: ({ className, href, children, ...props }: ComponentPropsWithoutRef<"a">) => {
    if (href?.startsWith("/")) {
      return (
        <Link to={href} className={typefaceAnchor(className)} {...props}>
          {children}
        </Link>
      );
    }
    if (href?.startsWith("#")) {
      return (
        <a href={href} className={typefaceAnchor(className)} {...props}>
          {children}
        </a>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={typefaceAnchor(className)}
        {...props}
      >
        {children}
      </a>
    );
  },
  hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-4 md:my-8" {...props} />
  ),
  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 w-full overflow-x-auto rounded-lg border">
      <table className={cn("w-full", className)} {...props} />
    </div>
  ),
  tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className={cn("m-0 border-t p-0 first:border-t-0", className)} {...props} />
  ),
  th: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <th
      className={cn(
        "border-r bg-muted/45 px-4 py-2.5 text-left font-semibold last:border-r-0 [[align=center]]:text-center [[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className={cn(
        "border-r px-4 py-2.5 text-left last:border-r-0 [[align=center]]:text-center [[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <CodeBlock className={className} {...props}>
      {children}
    </CodeBlock>
  ),
  code: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => {
    // Code inside pre has data-language from rehype-pretty-code; skip styling
    if ((props as Record<string, unknown>)["data-language"]) {
      return <code className={className} {...props} />;
    }
    return (
      <code
        className={cn(
          "wrap-break-word rounded-md bg-code text-code-foreground border border-code-border px-1.5 py-0.5 font-mono text-[0.875em] tracking-normal",
          className,
        )}
        {...props}
      />
    );
  },
  figure: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <figure className={cn("my-6", className)} {...props} />
  ),
  img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img style={{ width: "100%", height: "auto" }} {...props} alt={props.alt ?? ""} />
  ),
  mermaid: Mermaid,
  Example,
  Gallery,
  Demo,
  Callout,
};
