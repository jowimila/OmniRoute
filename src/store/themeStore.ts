"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { THEME_CONFIG } from "@/shared/constants/appConfig";
import {
  DEFAULT_QURAN_FONT,
  DEFAULT_UI_FONT,
  buildQuranFontStack,
  buildUiFontStack,
} from "@/shared/constants/arabicFonts";

interface ThemeState {
  theme: string;
  colorTheme: string;
  customColor: string;
  uiFont: string;
  quranFont: string;
  setTheme: (theme: string) => void;
  setColorTheme: (colorTheme: string) => void;
  setCustomColorTheme: (color: string) => void;
  setUiFont: (fontId: string) => void;
  setQuranFont: (fontId: string) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: THEME_CONFIG.defaultTheme,
      colorTheme: "coral",
      customColor: "#3b82f6",
      uiFont: DEFAULT_UI_FONT,
      quranFont: DEFAULT_QURAN_FONT,

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      setColorTheme: (colorTheme) => {
        set({ colorTheme });
        applyColorTheme(colorTheme, get().customColor);
      },

      setCustomColorTheme: (color) => {
        const normalized = normalizeHexColor(color);
        set({ colorTheme: "custom", customColor: normalized });
        applyColorTheme("custom", normalized);
      },

      setUiFont: (uiFont) => {
        set({ uiFont });
        applyUiFont(uiFont);
      },

      setQuranFont: (quranFont) => {
        set({ quranFont });
        applyQuranFont(quranFont);
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        set({ theme: newTheme });
        applyTheme(newTheme);
      },

      initTheme: () => {
        const { theme, colorTheme, customColor, uiFont, quranFont } = get();
        applyTheme(theme);
        applyColorTheme(colorTheme, customColor);
        applyUiFont(uiFont);
        applyQuranFont(quranFont);
      },
    }),
    {
      name: THEME_CONFIG.storageKey,
    }
  )
);

export const COLOR_THEMES: Record<string, string> = {
  coral: "#e54d5e",
  blue: "#3b82f6",
  red: "#ef4444",
  green: "#22c55e",
  violet: "#8b5cf6",
  orange: "#f97316",
  cyan: "#06b6d4",
};

// Apply light/dark theme to document
function applyTheme(theme: string) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const effectiveTheme = theme === "system" ? systemTheme : theme;

  if (effectiveTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function applyColorTheme(colorTheme: string, customColor: string) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const baseColor =
    colorTheme === "custom"
      ? normalizeHexColor(customColor)
      : COLOR_THEMES[colorTheme] || COLOR_THEMES.coral;
  const hoverColor = shadeHexColor(baseColor, -0.14);

  root.style.setProperty("--color-primary", baseColor);
  root.style.setProperty("--color-primary-hover", hoverColor);
}

const FALLBACK_SANS = "system-ui, sans-serif";

function applyUiFont(fontId: string) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const base = getComputedStyle(root).getPropertyValue("--font-sans").trim() || FALLBACK_SANS;
  const stack = buildUiFontStack(fontId, base);
  if (stack) {
    root.style.setProperty("--font-ui-override", stack);
  } else {
    root.style.removeProperty("--font-ui-override");
  }
}

function applyQuranFont(fontId: string) {
  if (typeof window === "undefined") return;
  document.documentElement.style.setProperty("--font-quran", buildQuranFontStack(fontId));
}

function normalizeHexColor(color: string) {
  const value = (color || "").trim();
  const hex = value.startsWith("#") ? value : `#${value}`;
  const valid = /^#([0-9a-fA-F]{6})$/.test(hex);
  return valid ? hex.toLowerCase() : "#3b82f6";
}

function shadeHexColor(hex: string, percent: number) {
  const normalized = normalizeHexColor(hex).slice(1);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  const shade = (channel: number) => {
    const target = percent < 0 ? 0 : 255;
    const amount = Math.round((target - channel) * Math.abs(percent));
    const next = percent < 0 ? channel - amount : channel + amount;
    return Math.max(0, Math.min(255, next));
  };

  const toHex = (channel: number) => channel.toString(16).padStart(2, "0");
  return `#${toHex(shade(r))}${toHex(shade(g))}${toHex(shade(b))}`;
}

export default useThemeStore;
