"use client";
import React from "react";
import InputForm from "../../lib/components/InputForm";

export default function InputBoardCustomize() {
  // 必要に応じてpropsや状態管理を追加
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6 py-8">
      <h2 className="text-xl font-bold mb-4">入力・ボード（カスタマイズ）</h2>
      <InputForm onSuccess={()=>{}} recentTransactions={[]} />
      {/* ここにボード表示やカスタマイズUIを追加 */}
      <div className="mt-6 p-4 bg-slate-800 rounded-xl text-slate-200 text-center">
        <p>ここに家計簿ボードや履歴、グラフなどをカスタマイズして表示できます。</p>
      </div>
    </div>
  );
}
