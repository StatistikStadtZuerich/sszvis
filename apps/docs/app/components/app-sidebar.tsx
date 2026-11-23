import { ChevronRight, Package } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { GithubIcon } from "~/components/ui/icons";
import { Button } from "~/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { NavLink } from "~/components/ui/nav-link";
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
import { typefaceBody, typefaceWordmark } from "~/components/tokens/typeface";
import { cn } from "~/lib/utils";
import { type NavEntry, navigation } from "~/nav.config";

const REPO_URL = "https://github.com/StatistikStadtZuerich/sszvis";

const sectionLabelClassName = (isCurrent: boolean) =>
  typefaceBody(
    cn(
      "h-auto rounded-none px-10 pt-4 pb-4 font-normal normal-case data-active:bg-transparent data-active:font-normal",
      isCurrent ? "text-primary" : "text-sidebar-foreground",
    ),
  );

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
      <Collapsible open={isOpen || isCurrentSection} onOpenChange={setIsOpen}>
        <CollapsibleTrigger
          className={cn(
            "group/trigger flex w-full items-center justify-between gap-2 px-10 py-4 text-left",
            "data-panel-open:pb-2",
            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
            isCurrentSection ? "text-primary" : "text-sidebar-foreground",
          )}
        >
          <span className={typefaceBody("font-normal")}>{section.title}</span>
          <ChevronRight className="size-4 shrink-0 transition-transform group-data-panel-open/trigger:rotate-90" />
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
                      className={typefaceBody(
                        "h-auto rounded-none py-2 pr-6 pl-15 data-active:bg-transparent data-active:font-normal",
                      )}
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
          <span className={typefaceWordmark("block max-w-43.5")}>SSZ Visualization Library</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* The one navigation landmark on the page: without it a screen reader has no
            way to jump to the docs tree, and no way to skip past it. */}
        <nav aria-label="Documentation">
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
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t">
        <div className="flex items-center justify-between gap-2 px-4 py-1">
          <NavLink
            href="https://www.stadt-zuerich.ch/statistik"
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            className="min-h-10 rounded-md"
          >
            Statistik Stadt Zürich
          </NavLink>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-touch"
              nativeButton={false}
              render={<a href={REPO_URL} target="_blank" rel="noopener noreferrer" />}
              title="GitHub"
              className="text-muted-foreground hover:bg-sidebar-accent"
            >
              <GithubIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-touch"
              nativeButton={false}
              render={
                <a
                  href="https://www.npmjs.com/package/sszvis"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              title="npm package"
              className="text-muted-foreground hover:bg-sidebar-accent"
            >
              <Package />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
