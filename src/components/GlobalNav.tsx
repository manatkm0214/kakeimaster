import React from "react";

export default function GlobalNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-center gap-4 py-4 bg-white/80 dark:bg-slate-900/80 border-t border-emerald-300 z-50">
      <button className="px-6 py-3 rounded-lg bg-emerald-400 text-white font-bold text-lg shadow active:scale-95 transition">カスタマイズ</button>
      <button className="px-6 py-3 rounded-lg bg-slate-700 text-white font-bold text-lg shadow active:scale-95 transition">ダーク</button>
      <button className="px-6 py-3 rounded-lg bg-yellow-400 text-white font-bold text-lg shadow active:scale-95 transition">ライト</button>
      <button className="px-6 py-3 rounded-lg bg-pink-400 text-white font-bold text-lg shadow active:scale-95 transition">印刷</button>
      <button className="px-6 py-3 rounded-lg bg-blue-400 text-white font-bold text-lg shadow active:scale-95 transition">共有</button>
      <button className="px-6 py-3 rounded-lg bg-gray-400 text-white font-bold text-lg shadow active:scale-95 transition">ログアウト</button>
      <button className="px-6 py-3 rounded-lg bg-red-500 text-white font-bold text-lg shadow active:scale-95 transition">会員退会</button>

      {/* 追加: 規約・プライバシー・問い合わせ */}
      <a href="/privacy" className="px-6 py-3 rounded-lg bg-slate-300 text-slate-800 font-bold text-lg shadow active:scale-95 transition">プライバシー</a>
      <a href="/terms" className="px-6 py-3 rounded-lg bg-slate-300 text-slate-800 font-bold text-lg shadow active:scale-95 transition">利用規約</a>
      <a href="/contact" className="px-6 py-3 rounded-lg bg-slate-300 text-slate-800 font-bold text-lg shadow active:scale-95 transition">お問い合わせ</a>
    </nav>
  );
}
