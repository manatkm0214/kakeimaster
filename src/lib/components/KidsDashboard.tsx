import React from "react";
import type { Transaction, Budget, Profile } from "../utils";

interface KidsDashboardProps {
  transactions: Transaction[];
  budgets?: Budget[];
  currentMonth: string;
  profile?: Profile | null;
}

const KidsDashboard: React.FC<KidsDashboardProps> = ({ transactions, budgets, currentMonth, profile }) => {
  // シンプルなキッズ向けダッシュボードの例
  // 多言語対応
  const lang = typeof window !== "undefined" && window.localStorage.getItem("kakeibo-lang") || "ja";
  const TT = {
    ja: { title: "こどもダッシュボード", count: "取引件数", feature: "おこづかい帳・目標・使いすぎ注意アラート" },
    en: { title: "Kids Dashboard", count: "Transactions", feature: "Allowance book, goals, overspending alert" },
    zh: { title: "儿童仪表板", count: "交易数", feature: "零用钱记录、目标、超支提醒" }
  }[lang] || { title: "こどもダッシュボード", count: "取引件数", feature: "おこづかい帳・目標・使いすぎ注意アラート" };
  return (
    <div className="p-6 bg-pink-50 dark:bg-pink-900 rounded-2xl shadow">
      <h2 className="text-xl font-bold text-pink-600 dark:text-pink-200 mb-4">{TT.title}</h2>
      <p className="mb-2">{currentMonth} {TT.count}: <span className="font-bold">{transactions.length}</span></p>
      <ul className="list-disc pl-5 text-pink-800 dark:text-pink-100">
        {transactions.slice(0, 5).map((t) => (
          <li key={t.id}>
            {t.date}: {t.category} - {t.amount}円
          </li>
        ))}
      </ul>
      <div className="mt-4 text-xs text-pink-600 bg-pink-100 rounded p-2">
        <strong>機能:</strong> {TT.feature}
      </div>
    </div>
  );
};

export default KidsDashboard;
