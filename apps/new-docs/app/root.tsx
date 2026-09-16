import { MDXProvider } from "@mdx-js/react";
import { useEffect, useState } from "react";
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useMatches,
} from "react-router";
import { AppSidebar } from "~/components/app-sidebar";
import { DocFooter } from "~/components/doc-footer";
import { GithubIcon } from "~/components/ui/icons";
import { TableOfContents } from "~/components/table-of-contents";
import { contentPages } from "~/content-pages";
import { ThemeToggle } from "~/components/theme-toggle";
import { proseComponents } from "~/components/tokens/prose-components";
import { typefaceWordmark } from "~/components/tokens/typeface";
import { buttonVariants } from "~/components/ui/button";
import { SidebarProvider, SidebarTrigger, useSidebar } from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";
import type { TocHandle, TOCItem } from "~/lib/remark-toc-export";
import type { Route } from "./+types/root";
import "./app.css";

export const meta: Route.MetaFunction = () => [
  { title: "SSZ Visualization Library" },
  {
    name: "description",
    content: "Documentation for the Statistik Stadt Zürich Visualization Library.",
  },
];

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.png", type: "image/png" },
];

const themeScript = `
(function() {
  var stored = localStorage.getItem('theme');
  var dark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) {
    document.documentElement.classList.add('dark');
  }
  // mdx-mermaid reads data-theme, not the class - set it before first paint so
  // diagrams render in the right palette without a flash.
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
})();
`;

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Meta />
        <Links />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-background focus-visible:px-3 focus-visible:py-2 focus-visible:text-foreground"
        >
          Skip to content
        </a>
        <SidebarProvider>
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <SiteHeader />
            <main
              id="main"
              tabIndex={-1}
              className="w-full flex-1 px-8 py-9 lg:py-12 xl:px-14 focus-visible:outline-none"
            >
              {children}
            </main>
          </div>
        </SidebarProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

export default function App() {
  const matches = useMatches();
  const location = useLocation();
  const lastMatch = matches[matches.length - 1];
  // SAFETY: the only route modules that export a `handle` are the MDX pages, and remark-toc-export writes every one of those as `{ toc }`.
  const handle = lastMatch?.handle as TocHandle | undefined;
  const routeToc: TOCItem[] = [...(handle?.toc ?? [])];
  const [toc, setToc] = useState(routeToc);

  useEffect(() => {
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>("main h2[id], main h3[id], main h4[id]"),
    );
    setToc(
      headings.map((heading) => ({
        id: heading.id,
        value: heading.textContent?.trim() ?? heading.id,
        depth: Number(heading.tagName.slice(1)),
      })),
    );
  }, [location.pathname]);

  /* The chart builder is a two-column tool, not prose, so it opts out of the reading measure. */
  const isWide = location.pathname.startsWith("/builder");

  const hasToc = toc.length > 0;
  const tocMaxDepth = contentPages.find((page) => page.href === location.pathname)?.tocMaxDepth;
  return (
    <MDXProvider components={proseComponents}>
      {hasToc && <TableOfContents toc={toc} maxDepth={tocMaxDepth} />}
      <div className={cn("@container/page w-full", hasToc && "xl:pr-46")}>
        <div className={isWide ? "w-full" : "content-column mx-auto w-full max-w-[70ch]"}>
          <Outlet />
          {!isWide && <DocFooter />}
        </div>
      </div>
      {hasToc && <TableOfContents toc={toc} desktopOnly maxDepth={tocMaxDepth} />}
    </MDXProvider>
  );
}

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }
  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
};

const SiteHeader = () => {
  const { state, isMobile } = useSidebar();
  const sidebarVisible = state === "expanded" && !isMobile;
  return (
    <header className="sticky top-0 z-(--z-chrome) flex h-(--header-height) shrink-0 items-center gap-3 border-border/60 border-b bg-background/85 px-5 backdrop-blur-xl sm:px-8">
      <SidebarTrigger size="icon-touch" />
      {!sidebarVisible && (
        <Link to="/" className={typefaceWordmark()}>
          sszvis
        </Link>
      )}
      <div className="flex-1" />
      <a
        href="https://github.com/StatistikStadtZuerich/sszvis"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        className={buttonVariants({
          variant: "ghost",
          size: "icon-touch",
          className: "text-muted-foreground hover:text-foreground",
        })}
      >
        <GithubIcon />
      </a>
      <ThemeToggle />
    </header>
  );
};
