"use client";
import React from "react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4">
      <h1 className="text-2xl font-extrabold text-pink-500 dark:text-violet-300 mb-8">カスタマイズ設定</h1>
      <p className="mb-6">カスタマイズ機能は新しいページに統合されました。</p>
      <a href="/customize" className="px-6 py-3 rounded-xl bg-pink-500 text-white font-bold shadow hover:bg-pink-600 transition">カスタマイズページへ</a>
    </div>
  );
}
