import { Package } from "lucide-react";
import { Link, useLocation } from "react-router";
import { GithubIcon } from "~/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";
import { navigation } from "~/nav.config";

const REPO_URL = "https://github.com/StatistikStadtZuerich/sszvis";

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
        {navigation.map((section) => {
          const isCurrentSection = section.items.some((item) => item.href === location.pathname);
          return (
            <SidebarGroup key={section.title} className="gap-0 border-sidebar-border border-t p-0">
              <SidebarGroupLabel
                className={cn(
                  "h-auto rounded-none px-10 pt-4 pb-2 font-normal text-base leading-[1.44] normal-case tracking-normal",
                  isCurrentSection ? "text-primary" : "text-sidebar-foreground",
                )}
              >
                {section.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          render={
                            <Link
                              to={item.href}
                              onClick={closeMobileSidebar}
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
            </SidebarGroup>
          );
        })}
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
