"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

function subscribe(onChange: () => void) {
  const sync = (event: StorageEvent) => {
    if (event.key === "speak-easy-theme") {
      document.documentElement.dataset.theme = event.newValue === "dark" ? "dark" : "light";
      onChange();
    }
  };
  window.addEventListener("speak-easy-theme-change", onChange);
  window.addEventListener("storage", sync);
  return () => { window.removeEventListener("speak-easy-theme-change", onChange); window.removeEventListener("storage", sync); };
}

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme === "dark", () => false);
  function toggle() {
    const theme = dark ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("speak-easy-theme", theme); } catch { /* Theme still works for this visit. */ }
    window.dispatchEvent(new Event("speak-easy-theme-change"));
  }
  return <button className="theme-toggle" aria-label="Dark mode" aria-pressed={dark} title={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={toggle}>{dark ? <Sun size={20}/> : <Moon size={20}/>}</button>;
}
