"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import { useCharacterImage } from "../../lib/hooks/useCharacterImage";
import { useBgTheme, BG_PRESETS } from "../../lib/hooks/useBgTheme";

export default function SettingsPage() {
  // ── キャラクター ──────────────────────────────────────
  const { characterUrl, characterName, setCharacterUrl, setCharacterName, clearCharacter } = useCharacterImage();
  const [inputUrl, setInputUrl] = useState("");
  const [inputName, setInputName] = useState("");
  const [preview, setPreview] = useState("");
  const [charSaved, setCharSaved] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ── 背景テーマ ────────────────────────────────────────
  const { bgId, setBg, resetBg } = useBgTheme();

  function handleUrlChange(v: string) {
    setInputUrl(v);
    setPreview(v);
    setFileError("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      setFileError("ファイルサイズは1.5MB以下にしてください");
      return;
    }
    setFileError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setInputUrl(result);
      setPreview(result);
    };
    reader.readAsDataURL(file);
  }

  function handleSaveChar() {
    const urlToSave = inputUrl || characterUrl;
    const nameToSave = inputName || characterName;
    if (urlToSave) setCharacterUrl(urlToSave);
    if (nameToSave !== characterName) setCharacterName(nameToSave);
    setCharSaved(true);
    setTimeout(() => setCharSaved(false), 2000);
  }

  function handleClearChar() {
    clearCharacter();
    setInputUrl("");
    setInputName("");
    setPreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const displayUrl = preview || characterUrl;
  const displayName = inputName || characterName;
  const currentBgPreset = BG_PRESETS.find(p => p.id === bgId) ?? BG_PRESETS[0];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-8 px-4" style={{ background: "var(--background)" }}>

      {/* ヘッダー */}
      <div className="w-full max-w-md mb-6 flex items-center gap-3">
        <button type="button" onClick={() => window.history.back()}
          className="p-2 rounded-xl bg-white/70 dark:bg-slate-800 border border-pink-200 dark:border-slate-700 text-pink-500 dark:text-slate-300 hover:bg-pink-50 dark:hover:bg-slate-700 transition shadow">
          ← 戻る
        </button>
        <h1 className="text-xl font-extrabold text-pink-500 dark:text-violet-300 drop-shadow">
          🎨 カスタマイズ設定
        </h1>
      </div>

      {/* ══ キャラクター設定カード ══ */}
      <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 rounded-3xl shadow-2xl border border-pink-200 dark:border-slate-700 p-6 flex flex-col items-center gap-5 mb-5">
        <h2 className="w-full text-sm font-extrabold text-pink-500 dark:text-violet-300 tracking-wide">🌟 キャラクター</h2>

        {/* プレビュー */}
        <div className="relative flex flex-col items-center py-6 w-full rounded-2xl border border-pink-100 dark:border-slate-700 overflow-hidden"
          style={{ background: "var(--background)" }}>
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            {["10%,20%", "80%,30%", "50%,70%", "20%,75%", "75%,15%"].map((pos, i) => (
              <span key={i} className="absolute text-pink-300 dark:text-violet-400 opacity-40 text-lg select-none"
                style={{ left: pos.split(",")[0], top: pos.split(",")[1] }}>✦</span>
            ))}
          </div>
          {displayUrl ? (
            <div className="animate-float z-10">
              <Image src={displayUrl} alt={displayName || "キャラクター"} width={112} height={112}
                className="w-28 h-28 rounded-full object-cover border-4 border-pink-300 dark:border-violet-400 shadow-xl" unoptimized />
            </div>
          ) : (
            <div className="animate-float-slow z-10 w-28 h-28 rounded-full border-4 border-dashed border-pink-300 dark:border-slate-600 flex items-center justify-center bg-white/60 dark:bg-slate-800/60">
              <span className="text-4xl">🌟</span>
            </div>
          )}
          {displayName && <p className="mt-3 text-sm font-bold text-pink-500 dark:text-violet-300 drop-shadow z-10">{displayName}</p>}
          {!displayUrl && <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 z-10">画像を設定するとここに表示されます</p>}
        </div>

        {/* URL入力 */}
        <div className="w-full">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">画像URL</label>
          <input type="url" value={inputUrl} onChange={e => handleUrlChange(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-xl border-2 border-pink-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-pink-400 dark:focus:border-violet-400 transition" />
        </div>

        {/* ファイルアップロード */}
        <div className="w-full">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
            ファイルアップロード <span className="font-normal text-slate-400">(1.5MB以下)</span>
          </label>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange}
            className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-pink-100 dark:file:bg-slate-700 file:text-pink-600 dark:file:text-violet-300 file:font-bold file:text-xs hover:file:bg-pink-200 dark:hover:file:bg-slate-600 cursor-pointer" />
          {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
        </div>

        {/* キャラクター名 */}
        <div className="w-full">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">キャラクター名（任意）</label>
          <input type="text" value={inputName} onChange={e => setInputName(e.target.value)}
            placeholder={characterName || "名前をつけよう！"}
            className="w-full px-3 py-2 rounded-xl border-2 border-pink-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-pink-400 dark:focus:border-violet-400 transition" />
        </div>

        {/* 保存・クリアボタン */}
        <div className="w-full flex gap-3">
          <button type="button" onClick={handleSaveChar}
            disabled={!inputUrl && !inputName && !characterUrl}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-linear-to-r from-pink-400 to-violet-400 text-white shadow hover:from-pink-500 hover:to-violet-500 transition disabled:opacity-40 disabled:cursor-not-allowed">
            {charSaved ? "✓ 保存しました！" : "保存する"}
          </button>
          {characterUrl && (
            <button type="button" onClick={handleClearChar}
              className="px-4 py-2.5 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition border border-slate-200 dark:border-slate-600">
              クリア
            </button>
          )}
        </div>
      </div>

      {/* ══ 背景テーマ選択カード ══ */}
      <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 rounded-3xl shadow-2xl border border-pink-200 dark:border-slate-700 p-6 flex flex-col gap-4 mb-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-pink-500 dark:text-violet-300 tracking-wide">🖼️ 背景テーマ</h2>
          <button type="button" onClick={resetBg}
            className="text-xs px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition border border-slate-200 dark:border-slate-600">
            リセット
          </button>
        </div>

        {/* プリセットグリッド */}
        <div className="grid grid-cols-4 gap-2">
          {BG_PRESETS.map((preset) => (
            <button key={preset.id} type="button" onClick={() => setBg(preset.id, preset.value)}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-2xl border-2 transition-all ${
                bgId === preset.id
                  ? "border-pink-400 dark:border-violet-400 scale-105 shadow-lg"
                  : "border-transparent hover:border-pink-200 dark:hover:border-slate-600"
              }`}
              title={preset.label}>
              <div className="w-12 h-12 rounded-xl shadow-inner border border-black/10"
                style={{ background: preset.value }} />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-tight font-medium">
                {preset.label.replace(/^\S+\s/, "")}
              </span>
            </button>
          ))}
        </div>

        {/* 選択中表示 */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-pink-50 dark:bg-slate-800 border border-pink-100 dark:border-slate-700">
          <div className="w-6 h-6 rounded-lg shrink-0 border border-black/10 shadow"
            style={{ background: currentBgPreset.value }} />
          <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{currentBgPreset.label}</span>
          <span className="ml-auto text-xs text-pink-400 dark:text-violet-400 font-bold">選択中</span>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          ログイン・設定・お問い合わせ画面などの背景が変わります
        </p>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center pb-4">
        設定はこのブラウザのみに保存されます
      </p>
    </div>
  );
}
