import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  ARABIC_UI_FONTS,
  DEFAULT_QURAN_FONT,
  QURAN_FONTS,
  buildQuranFontStack,
  buildUiFontStack,
  findQuranFont,
  findUiFont,
} from "../../src/shared/constants/arabicFonts.ts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const BASE = "system-ui, sans-serif";

test("font ids are unique within each list", () => {
  for (const list of [ARABIC_UI_FONTS, QURAN_FONTS]) {
    const ids = list.map((f) => f.id);
    assert.equal(new Set(ids).size, ids.length);
  }
});

test("buildUiFontStack returns null for default/unknown ids", () => {
  assert.equal(buildUiFontStack("default", BASE), null);
  assert.equal(buildUiFontStack("nope", BASE), null);
  assert.equal(buildUiFontStack(undefined, BASE), null);
});

test("buildUiFontStack puts the chosen family first and keeps the base stack", () => {
  assert.equal(buildUiFontStack("cairo", BASE), `"Cairo", ${BASE}`);
  assert.equal(findUiFont("tajawal")?.family, "Tajawal");
});

test("buildQuranFontStack falls back to the default Quran font", () => {
  assert.ok(buildQuranFontStack("unknown").startsWith('"Amiri Quran"'));
  assert.ok(buildQuranFontStack("scheherazade-new").startsWith('"Scheherazade New"'));
  assert.equal(findQuranFont(DEFAULT_QURAN_FONT)?.family, "Amiri Quran");
});

test("every font is declared in package.json and imported in globals.css", () => {
  const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const css = readFileSync(path.join(ROOT, "src/app/globals.css"), "utf8");
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const ids = new Set([...ARABIC_UI_FONTS, ...QURAN_FONTS].map((f) => f.id));
  for (const id of ids) {
    assert.ok(deps[`@fontsource/${id}`], `missing dependency @fontsource/${id}`);
    assert.match(css, new RegExp(`@import "@fontsource/${id}/arabic-400\\.css";`));
  }
});

test("installed @fontsource files declare the family names used by the picker", (t) => {
  const dir = path.join(ROOT, "node_modules/@fontsource");
  if (!existsSync(dir)) {
    t.skip("node_modules not installed");
    return;
  }
  for (const font of [...ARABIC_UI_FONTS, ...QURAN_FONTS]) {
    const css = readFileSync(path.join(dir, font.id, "arabic-400.css"), "utf8");
    assert.ok(css.includes(`font-family: '${font.family}'`), `${font.id} family mismatch`);
  }
});
