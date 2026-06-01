import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeId =
  | "purple"
  | "ocean"
  | "forest"
  | "rose"
  | "amber"
  | "midnight"
  | "crimson"
  | "light";

export interface Theme {
  id: ThemeId;
  name: string;
  preview: string;
  description: string;
}

export const THEMES: Theme[] = [
  { id: "purple",   name: "Dark Purple",  preview: "oklch(0.65 0.25 280)", description: "Classic dark purple — default" },
  { id: "ocean",    name: "Dark Ocean",   preview: "oklch(0.60 0.22 200)", description: "Deep teal & ocean blue" },
  { id: "forest",   name: "Dark Forest",  preview: "oklch(0.62 0.22 145)", description: "Rich dark forest green" },
  { id: "rose",     name: "Dark Rose",    preview: "oklch(0.65 0.25 355)", description: "Elegant dark rose & pink" },
  { id: "amber",    name: "Dark Amber",   preview: "oklch(0.70 0.22 65)",  description: "Warm amber & gold tones" },
  { id: "midnight", name: "Midnight",     preview: "oklch(0.55 0.18 265)", description: "Ultra dark deep indigo" },
  { id: "crimson",  name: "Dark Crimson", preview: "oklch(0.60 0.25 20)",  description: "Bold dark crimson red" },
  { id: "light",    name: "Light Mode",   preview: "oklch(0.55 0.25 280)", description: "Clean & bright light mode" },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      return (localStorage.getItem("speaksmart-theme") as ThemeId) || "purple";
    } catch {
      return "purple";
    }
  });

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    try {
      localStorage.setItem("speaksmart-theme", id);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const root = document.documentElement;
    THEMES.forEach((t) => root.classList.remove(`theme-${t.id}`));
    if (theme !== "purple") {
      root.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
