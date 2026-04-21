import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "app-theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY) as Theme | null;
  } catch {
    return null;
  }
}

function setStoredTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors
  }
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = "system" }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() || defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    const stored = getStoredTheme();
    if (stored && stored !== "system") return stored;
    return getSystemTheme();
  });

  useEffect(() => {
    const root = document.documentElement;
    const newResolvedTheme = theme === "system" ? getSystemTheme() : theme;
    
    setResolvedTheme(newResolvedTheme);
    root.setAttribute("data-theme", newResolvedTheme);
    
    // Update color-scheme for native UI elements
    root.style.colorScheme = newResolvedTheme;
  }, [theme]);

  // Listen to system theme changes
  useEffect(() => {
    if (theme !== "system") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const newTheme = mediaQuery.matches ? "dark" : "light";
      setResolvedTheme(newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
      document.documentElement.style.colorScheme = newTheme;
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setStoredTheme(newTheme);
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
