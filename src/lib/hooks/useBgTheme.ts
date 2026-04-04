"use client";
import { useState, useEffect, useCallback } from "react";

export const BG_KEY = "kakeibo-custom-bg";

export const BG_PRESETS = [
  { id: "pink",    label: "🌸 ピンク",      value: "linear-gradient(135deg, #ffe6fa 0%, #e0c3fc 100%)" },
  { id: "blue",    label: "🌊 ブルー",      value: "linear-gradient(135deg, #e0f7ff 0%, #bfdbfe 100%)" },
  { id: "mint",    label: "🌿 ミント",      value: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)" },
  { id: "sunset",  label: "🌅 サンセット",  value: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)" },
  { id: "cherry",  label: "🍒 チェリー",   value: "linear-gradient(135deg, #ffd6e7 0%, #ffb3c6 100%)" },
  { id: "lemon",   label: "🍋 レモン",      value: "linear-gradient(135deg, #fffde7 0%, #fff9c4 100%)" },
  { id: "lavender",label: "💜 ラベンダー",  value: "linear-gradient(135deg, #f3e8ff 0%, #ddd6fe 100%)" },
  { id: "sky",     label: "☁️ そら",       value: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)" },
  { id: "gold",    label: "✨ ゴールド",    value: "linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)" },
  { id: "galaxy",  label: "🌌 ギャラクシー",value: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)" },
  { id: "night",   label: "🌙 ナイト",      value: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" },
  { id: "dark",    label: "⬛ ダーク",      value: "#020617" },
] as const;

export type BgPresetId = typeof BG_PRESETS[number]["id"];

function applyBg(value: string) {
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--background", value);
  }
}

export function useBgTheme() {
  const [bgId, setBgIdState] = useState<string>(() => {
    if (typeof window === "undefined") return "pink";
    return localStorage.getItem(BG_KEY + "-id") || "pink";
  });

  useEffect(() => {
    const savedId = localStorage.getItem(BG_KEY + "-id") || "pink";
    const savedValue = localStorage.getItem(BG_KEY);
    setBgIdState(savedId);
    if (savedValue) applyBg(savedValue);

    function handleUpdate() {
      const id = localStorage.getItem(BG_KEY + "-id") || "pink";
      const val = localStorage.getItem(BG_KEY);
      setBgIdState(id);
      if (val) applyBg(val);
    }
    window.addEventListener("kakeibo-bg-updated", handleUpdate);
    return () => window.removeEventListener("kakeibo-bg-updated", handleUpdate);
  }, []);

  const setBg = useCallback((id: string, value: string) => {
    localStorage.setItem(BG_KEY, value);
    localStorage.setItem(BG_KEY + "-id", id);
    setBgIdState(id);
    applyBg(value);
    window.dispatchEvent(new Event("kakeibo-bg-updated"));
  }, []);

  const resetBg = useCallback(() => {
    localStorage.removeItem(BG_KEY);
    localStorage.removeItem(BG_KEY + "-id");
    setBgIdState("pink");
    applyBg(BG_PRESETS[0].value);
    window.dispatchEvent(new Event("kakeibo-bg-updated"));
  }, []);

  return { bgId, setBg, resetBg };
}
