"use client";
import React from "react";

export default function LeaveAccountPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4">
      <h1 className="text-3xl font-extrabold text-red-600 dark:text-red-300 mb-6">会員退会</h1>
      <p className="mb-4 text-lg text-slate-700 dark:text-slate-200">本当に退会しますか？<br />退会すると全てのデータが削除され、元に戻せません。</p>
      <button className="px-8 py-4 rounded-2xl bg-red-500 text-white font-bold text-xl shadow-lg hover:bg-red-700 transition mb-4">退会する</button>
      <a href="/" className="text-blue-500 underline">キャンセルして戻る</a>
    </div>
  );
}
