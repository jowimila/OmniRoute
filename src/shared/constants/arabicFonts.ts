/**
 * Arabic UI fonts and Quran (Mushaf-style) fonts.
 *
 * All families are self-hosted through `@fontsource/*` packages imported in
 * `src/app/globals.css`, so no runtime CDN request is made (same policy as
 * Material Symbols, #3695).
 */

export interface ArabicFontOption {
  id: string;
  /** CSS family name, exactly as declared by the @fontsource @font-face. */
  family: string;
  /** Short Arabic label shown next to the English one in the picker. */
  labelAr: string;
  labelEn: string;
}

export const DEFAULT_UI_FONT = "default";
export const DEFAULT_QURAN_FONT = "amiri-quran";

/** Modern/readable Arabic fonts suitable for dashboard text. */
export const ARABIC_UI_FONTS: readonly ArabicFontOption[] = [
  { id: "cairo", family: "Cairo", labelAr: "القاهرة", labelEn: "Cairo" },
  { id: "tajawal", family: "Tajawal", labelAr: "تجوال", labelEn: "Tajawal" },
  { id: "almarai", family: "Almarai", labelAr: "المراعي", labelEn: "Almarai" },
  {
    id: "ibm-plex-sans-arabic",
    family: "IBM Plex Sans Arabic",
    labelAr: "آي بي إم بلكس",
    labelEn: "IBM Plex Sans Arabic",
  },
  {
    id: "noto-kufi-arabic",
    family: "Noto Kufi Arabic",
    labelAr: "نوتو كوفي",
    labelEn: "Noto Kufi Arabic",
  },
  { id: "reem-kufi", family: "Reem Kufi", labelAr: "ريم كوفي", labelEn: "Reem Kufi" },
  {
    id: "noto-naskh-arabic",
    family: "Noto Naskh Arabic",
    labelAr: "نوتو نسخ",
    labelEn: "Noto Naskh Arabic",
  },
  { id: "amiri", family: "Amiri", labelAr: "أميري", labelEn: "Amiri" },
];

/** Fonts designed for (or well suited to) fully vowelled Quranic text. */
export const QURAN_FONTS: readonly ArabicFontOption[] = [
  { id: "amiri-quran", family: "Amiri Quran", labelAr: "أميري قرآن", labelEn: "Amiri Quran" },
  {
    id: "scheherazade-new",
    family: "Scheherazade New",
    labelAr: "شهرزاد الجديد",
    labelEn: "Scheherazade New",
  },
  { id: "amiri", family: "Amiri", labelAr: "أميري", labelEn: "Amiri" },
  {
    id: "noto-naskh-arabic",
    family: "Noto Naskh Arabic",
    labelAr: "نوتو نسخ",
    labelEn: "Noto Naskh Arabic",
  },
  { id: "lateef", family: "Lateef", labelAr: "لطيف", labelEn: "Lateef" },
];

/** Generic fallbacks appended after the chosen family. */
const SERIF_FALLBACK = '"Amiri Quran", "Scheherazade New", "Traditional Arabic", serif';

function quote(family: string): string {
  return `"${family}"`;
}

/** Returns the option for an id, or undefined for "default"/unknown ids. */
export function findUiFont(id: string | undefined | null): ArabicFontOption | undefined {
  return ARABIC_UI_FONTS.find((f) => f.id === id);
}

export function findQuranFont(id: string | undefined | null): ArabicFontOption | undefined {
  return QURAN_FONTS.find((f) => f.id === id);
}

/**
 * CSS value for `--font-ui-override`, or null when the default system stack
 * should be used. The chosen family goes first; the base sans stack still
 * serves Latin glyphs the Arabic subset does not cover.
 */
export function buildUiFontStack(id: string | undefined | null, baseStack: string): string | null {
  const font = findUiFont(id);
  return font ? `${quote(font.family)}, ${baseStack}` : null;
}

/** CSS value for `--font-quran`. Unknown ids fall back to the default Quran font. */
export function buildQuranFontStack(id: string | undefined | null): string {
  const font = findQuranFont(id) ?? findQuranFont(DEFAULT_QURAN_FONT)!;
  return `${quote(font.family)}, ${SERIF_FALLBACK}`;
}

/** Sample text used by the picker previews (Al-Fatiha, verse 1, fully vowelled). */
export const QURAN_PREVIEW_TEXT = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
export const ARABIC_UI_PREVIEW_TEXT = "بوابة موحدة لجميع مزودي الذكاء الاصطناعي";
