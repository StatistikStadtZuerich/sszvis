import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Link, useLocation } from "react-router";
import { contentPages } from "~/content-pages";

const REPO_URL = "https://github.com/StatistikStadtZuerich/sszvis";
const CONTENT_BASE = "blob/master/apps/new-docs/app/content";

/** Pages in reading order - the same order the sidebar lists them in */
const flatNav = contentPages;

/** Where the page's source lives, so "View on GitHub" links to the real file */
const getContentPath = (pathname: string): string =>
  contentPages.find((page) => page.href === pathname)?.contentPath.replace(/^content\//, "") ??
  "index.mdx";

export const DocFooter = () => {
  const { pathname } = useLocation();
  const normalizedPathname = pathname === "/" ? pathname : pathname.replace(/\/+$/, "");

  const currentIndex = flatNav.findIndex((item) => item.href === normalizedPathname);
  const prev = currentIndex > 0 ? flatNav[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < flatNav.length - 1 ? flatNav[currentIndex + 1] : null;

  const editUrl = `${REPO_URL}/${CONTENT_BASE}/${getContentPath(normalizedPathname)}`;

  return (
    <footer className="mt-16 border-t border-border/50 pt-6">
      <div className="flex items-center justify-between">
        <div>
          {prev && (
            <Link
              to={prev.href}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="size-4" />
              {prev.label}
            </Link>
          )}
        </div>
        <div>
          {next && (
            <Link
              to={next.href}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {next.label}
              <ChevronRight className="size-4" />
            </Link>
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <a
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View this page on GitHub
          <ExternalLink className="size-3" />
        </a>
      </div>
    </footer>
  );
};
