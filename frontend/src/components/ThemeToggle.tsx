"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  // Start with null to avoid hydration mismatch (server doesn't know the theme)
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    // Read theme preference only on the client, after hydration
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = storedTheme === "dark" || (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Render a placeholder during SSR / before hydration to prevent mismatch
  if (isDark === null) {
    return (
      <button
        className="p-2 mr-4 rounded-md text-foreground/50 hover:bg-surface-hover hover:text-foreground transition-colors border border-transparent hover:border-border w-[34px] h-[34px]"
        aria-label="Toggle Dark Mode"
      />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 mr-4 rounded-md text-foreground/50 hover:bg-surface-hover hover:text-foreground transition-colors border border-transparent hover:border-border"
      aria-label="Toggle Dark Mode"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
