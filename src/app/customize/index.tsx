"use client";
import React, { useState } from "react";
import PresetSetupKids from "../../lib/components/PresetSetupKids";
import PresetSetupSenior from "../../lib/components/PresetSetupSenior";
import PresetSetupGeneral from "../../lib/components/PresetSetupGeneral";

export default function CustomizePage() {
  const [mode, setMode] = useState<"kids"|"senior"|"general">("general");

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4">
      {/* 主要ボタンバー */}
      <div className="flex flex-wrap gap-3 mb-8 w-full justify-center">
        <button className="px-6 py-3 rounded-lg bg-emerald-400 text-white font-bold text-lg shadow active:scale-95 transition">カスタマイズ</button>
        <button className="px-6 py-3 rounded-lg bg-slate-700 text-white font-bold text-lg shadow active:scale-95 transition">ダーク</button>
        <button className="px-6 py-3 rounded-lg bg-yellow-400 text-white font-bold text-lg shadow active:scale-95 transition">ライト</button>
        <button className="px-6 py-3 rounded-lg bg-pink-400 text-white font-bold text-lg shadow active:scale-95 transition">印刷</button>
        <button className="px-6 py-3 rounded-lg bg-blue-400 text-white font-bold text-lg shadow active:scale-95 transition">共有</button>
        <button className="px-6 py-3 rounded-lg bg-gray-400 text-white font-bold text-lg shadow active:scale-95 transition">ログアウト</button>
        <button className="px-6 py-3 rounded-lg bg-red-500 text-white font-bold text-lg shadow active:scale-95 transition">会員退会</button>
      </div>
      {/* モード切替ボタン */}
      <div className="flex gap-4 mb-8">
        <button onClick={() => setMode("general")} className={`px-4 py-2 rounded ${mode==="general" ? "bg-pink-200" : "bg-white"}`}>全体</button>
        <button onClick={() => setMode("kids")} className={`px-4 py-2 rounded ${mode==="kids" ? "bg-yellow-200" : "bg-white"}`}>子供</button>
        <button onClick={() => setMode("senior")} className={`px-4 py-2 rounded ${mode==="senior" ? "bg-blue-200" : "bg-white"}`}>シニア</button>
        <a href="#input-board" className="px-4 py-2 rounded bg-emerald-200 text-emerald-900 font-bold ml-2">入力・ボード</a>
      </div>
      {mode === "general" && <PresetSetupGeneral onComplete={()=>{}} />}
      {mode === "kids" && <PresetSetupKids onComplete={()=>{}} />}
      {mode === "senior" && <PresetSetupSenior onComplete={()=>{}} />}
      {/* 入力・ボード共通UI */}
      <div id="input-board" className="w-full mt-12">
        <hr className="my-8 border-t-2 border-emerald-300" />
        <h2 className="text-xl font-bold mb-4 text-emerald-700">入力・ボード（全世代共通）</h2>
        <div className="w-full flex justify-center">
          <iframe src="/customize/InputBoard" title="カスタマイズ入力ボード" className="w-full max-w-2xl min-h-150 rounded-xl border-2 border-emerald-300 bg-white shadow-lg" />
        </div>
      </div>
    </div>
  );
}
