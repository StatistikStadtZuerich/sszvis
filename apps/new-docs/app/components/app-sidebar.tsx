import { ChevronRight, Package } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { GithubIcon } from "~/components/icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";
import { type NavEntry, navigation } from "~/nav.config";

const REPO_URL = "https://github.com/StatistikStadtZuerich/sszvis";

const sectionLabelClassName = (isCurrent: boolean) =>
  cn(
    "h-auto rounded-none px-10 pt-4 pb-4 font-normal text-base leading-[1.44] normal-case tracking-normal data-active:bg-transparent data-active:font-normal",
    isCurrent ? "text-primary" : "text-sidebar-foreground",
  );

/**
 * A collapsible group. Like the old Catalog sidebar, a section starts expanded
 * only while it holds the current page, so the full page list stays short.
 */
const NavSectionGroup = ({
  section,
  pathname,
  onNavigate,
}: {
  readonly section: Extract<NavEntry, { kind: "section" }>;
  readonly pathname: string;
  readonly onNavigate: () => void;
}) => {
  const isCurrentSection = section.items.some((item) => item.href === pathname);
  const [isOpen, setIsOpen] = useState(isCurrentSection);
  return (
    <SidebarGroup className="gap-0 border-sidebar-border border-t p-0">
      {/* The section holding the current page stays open, however the user
          navigated to it - the footer's prev/next links can land here too. */}
      <Collapsible open={isOpen || isCurrentSection} onOpenChange={setIsOpen}>
        <CollapsibleTrigger
          className={cn(
            "group/trigger flex w-full items-center justify-between gap-2 px-10 py-4 text-left",
            "data-[panel-open]:pb-2",
            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
            isCurrentSection ? "text-primary" : "text-sidebar-foreground",
          )}
        >
          <span className="font-normal text-base leading-[1.44]">{section.title}</span>
          <ChevronRight className="size-4 shrink-0 transition-transform group-data-[panel-open]/trigger:rotate-90" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={
                        <Link
                          to={item.href}
                          onClick={onNavigate}
                          aria-current={isActive ? "page" : undefined}
                        />
                      }
                      isActive={isActive}
                      className="h-auto rounded-none py-2 pr-6 pl-15 text-base leading-[1.44] data-active:bg-transparent data-active:font-normal"
                    >
                      {item.label}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
};

export const AppSidebar = () => {
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-0">
        <Link
          to="/"
          onClick={closeMobileSidebar}
          className="block px-10 pt-12 pb-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span className="block max-w-43.5 font-heading font-bold text-[1.2rem] text-primary leading-[1.2]">
            SSZ Visualization Library
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((entry) =>
          entry.kind === "link" ? (
            <SidebarGroup key={entry.href} className="gap-0 border-sidebar-border border-t p-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={
                      <Link
                        to={entry.href}
                        onClick={closeMobileSidebar}
                        aria-current={location.pathname === entry.href ? "page" : undefined}
                      />
                    }
                    isActive={location.pathname === entry.href}
                    className={sectionLabelClassName(location.pathname === entry.href)}
                  >
                    {entry.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          ) : (
            <NavSectionGroup
              key={entry.title}
              section={entry}
              pathname={location.pathname}
              onNavigate={closeMobileSidebar}
            />
          ),
        )}
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t">
        <div className="flex items-center justify-between gap-2 px-4 py-1">
          <a
            href="https://www.stadt-zuerich.ch/statistik"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-10 items-center rounded-md text-muted-foreground text-xs transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Statistik Stadt Zürich
          </a>
          <div className="flex items-center gap-3">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:size-8"
              title="GitHub"
            >
              <GithubIcon className="size-4" />
            </a>
            <a
              href="https://www.npmjs.com/package/sszvis"
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:size-8"
              title="npm package"
            >
              <Package className="size-4" />
            </a>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
