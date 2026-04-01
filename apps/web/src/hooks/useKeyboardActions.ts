import { useEffect, useState } from "react";



export function useKeyboardActions<T>(
  items: T[], 
  onAction: (item: T, type: "approve" | "reject") => void,
  active: boolean = true
) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case "j":
          setSelectedIndex((curr) => Math.min(curr + 1, items.length - 1));
          break;
        case "k":
          setSelectedIndex((curr) => Math.max(curr - 1, 0));
          break;
        case "a":
          if (items[selectedIndex]) onAction(items[selectedIndex], "approve");
          break;
        case "r":
          if (items[selectedIndex]) onAction(items[selectedIndex], "reject");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, items, selectedIndex, onAction]);

  return { selectedIndex, setSelectedIndex };
}
