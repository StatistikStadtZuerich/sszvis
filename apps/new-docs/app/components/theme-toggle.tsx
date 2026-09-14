import { MoonIcon, SunIcon } from "lucide-react";
import { useCallback, useEffect } from "react";
import { Button } from "~/components/ui/button";

export const ThemeToggle = () => {
  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem("theme");
    const dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", dark);
    root.setAttribute("data-theme", dark ? "dark" : "light");
  }, []);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    const next = root.classList.contains("dark") ? "light" : "dark";
    root.classList.toggle("dark", next === "dark");
    // Tailwind keys off the class, but mdx-mermaid reads data-theme (and
    // watches it for mutations) to pick its diagram palette. Keep both in sync.
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }, []);

  return (
    <Button
      onClick={toggle}
      variant="ghost"
      size="icon"
      className="size-11 text-muted-foreground hover:text-foreground md:size-8"
      aria-label="Toggle dark mode"
    >
      <SunIcon size={16} className="hidden dark:block" />
      <MoonIcon size={16} className="block dark:hidden" />
    </Button>
  );
};
