"use client";
import React from "react";

export default function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <button
      className="px-6 py-3 rounded-2xl bg-slate-500 text-white font-bold text-lg shadow-lg hover:bg-slate-700 transition"
      onClick={onLogout}
    >
      ログアウト
    </button>
  );
}
