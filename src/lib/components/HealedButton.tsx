"use client";
import React from "react";

export default function HealedButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="px-8 py-4 rounded-2xl bg-emerald-400 text-white font-bold text-xl shadow-lg hover:bg-emerald-600 transition"
      onClick={onClick}
    >
      治った！すっきり！
    </button>
  );
}
