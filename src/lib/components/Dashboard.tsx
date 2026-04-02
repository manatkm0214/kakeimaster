"use client"

import { Transaction, Budget, Profile, formatCurrency } from "@/lib/utils"
import { useMemo } from "react"

interface Props {
  transactions: Transaction[]
  budgets: Budget[]
  currentMonth: string
  profile: Profile | null
}

function safeLevel(savingRate: number): { level: string; color: string; bar: number } {
  if (savingRate >= 30) return { level: "S", color: "text-emerald-400", bar: 100 }
  if (savingRate >= 20) return { level: "A", color: "text-green-400", bar: 80 }
  if (savingRate >= 10) return { level: "B", color: "text-yellow-400", bar: 60 }
  if (savingRate >= 5)  return { level: "C", color: "text-orange-400", bar: 40 }
  return { level: "D", color: "text-red-400", bar: 20 }
}

export default function Dashboard({ transactions, budgets, currentMonth, profile }: Props) {
  const stats = useMemo(() => {
    const monthly = transactions.filter(t => t.date.startsWith(currentMonth))
    const income = monthly.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const expense = monthly.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    const saving = monthly.filter(t => t.type === "saving").reduce((s, t) => s + t.amount, 0)
    const investment = monthly.filter(t => t.type === "investment").reduce((s, t) => s + t.amount, 0)
    const fixed = monthly.filter(t => t.is_fixed && t.type === "expense").reduce((s, t) => s + t.amount, 0)
    const balance = income - expense - saving - investment
    const savingRate = income > 0 ? Math.round(((saving + investment) / income) * 100) : 0
    const fixedRate = expense > 0 ? Math.round((fixed / expense) * 100) : 0
    const wasteRate = income > 0 ? Math.round(((expense - fixed) / income) * 100) : 0
    const defenseFund = saving * 6

    // カテゴリ別支出
    const categoryMap: Record<string, number> = {}
    monthly.filter(t => t.type === "expense").forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount
    })

    // 予算進捗
    const budgetProgress = budgets.filter(b => b.month === currentMonth).map(b => {
      const spent = monthly.filter(t => t.type === "expense" && t.category === b.category).reduce((s, t) => s + t.amount, 0)
      return { ...b, spent, pct: Math.round((spent / b.amount) * 100) }
    })

    return { income, expense, saving, investment, balance, savingRate, fixedRate, wasteRate, defenseFund, fixed, categoryMap, budgetProgress }
  }, [transactions, budgets, currentMonth])

  const forecast = useMemo(() => {
    const [year, month] = currentMonth.split("-").map(Number)
    const now = new Date()
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month
    const daysInMonth = new Date(year, month, 0).getDate()
    const daysElapsed = isCurrentMonth ? Math.max(1, now.getDate()) : daysInMonth

    const projectedIncome = Math.round((stats.income / daysElapsed) * daysInMonth)
    const projectedExpense = Math.round((stats.expense / daysElapsed) * daysInMonth)
    const projectedSaving = Math.round((stats.saving / daysElapsed) * daysInMonth)
    const projectedInvestment = Math.round((stats.investment / daysElapsed) * daysInMonth)
    const projectedBalance = projectedIncome - projectedExpense - projectedSaving - projectedInvestment

    const recentMonths = Array.from({ length: 3 }).map((_, index) => {
      const d = new Date(year, month - 1 - index, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    })
    const targetMonths = isCurrentMonth ? recentMonths : [currentMonth, ...recentMonths.slice(0, 2)]

    const monthlyBalances = targetMonths.map((m) => {
      const monthly = transactions.filter((t) => t.date.startsWith(m))
      const income = monthly.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
      const expense = monthly.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
      const saving = monthly.filter((t) => t.type === "saving").reduce((s, t) => s + t.amount, 0)
      const investment = monthly.filter((t) => t.type === "investment").reduce((s, t) => s + t.amount, 0)
      return income - expense - saving - investment
    }).filter((v) => Number.isFinite(v))

    const avgMonthlyBalance = monthlyBalances.length > 0
      ? Math.round(monthlyBalances.reduce((sum, value) => sum + value, 0) / monthlyBalances.length)
      : stats.balance

    return {
      daysElapsed,
      daysInMonth,
      projectedIncome,
      projectedExpense,
      projectedSaving,
      projectedInvestment,
      projectedBalance,
      avgMonthlyBalance,
      annualProjection: avgMonthlyBalance * 12,
    }
  }, [currentMonth, stats.balance, stats.expense, stats.income, stats.investment, stats.saving, transactions])

  const allocation = useMemo(() => {
    const takeHome = profile?.allocation_take_home && profile.allocation_take_home > 0
      ? profile.allocation_take_home
      : stats.income
    const targetFixed = profile?.allocation_target_fixed_rate ?? 35
    const targetVariable = profile?.allocation_target_variable_rate ?? 25
    const targetSavings = profile?.allocation_target_savings_rate ?? 20

    const actualFixed = takeHome > 0 ? Math.round((stats.fixed / takeHome) * 100) : 0
    const actualVariable = takeHome > 0 ? Math.round(((stats.expense - stats.fixed) / takeHome) * 100) : 0
    const actualSavings = takeHome > 0 ? Math.round(((stats.saving + stats.investment) / takeHome) * 100) : 0

    return {
      takeHome,
      fixed: { actual: actualFixed, target: targetFixed, ok: actualFixed <= targetFixed },
      variable: { actual: actualVariable, target: targetVariable, ok: actualVariable <= targetVariable },
      savings: { actual: actualSavings, target: targetSavings, ok: actualSavings >= targetSavings },
    }
  }, [profile, stats.expense, stats.fixed, stats.income, stats.investment, stats.saving])

  const { level, color, bar } = safeLevel(stats.savingRate)

  const cards = [
    { label: "収入", value: stats.income, color: "from-emerald-500/20 to-emerald-600/5", text: "text-emerald-400" },
    { label: "支出", value: stats.expense, color: "from-red-500/20 to-red-600/5", text: "text-red-400" },
    { label: "貯金", value: stats.saving, color: "from-blue-500/20 to-blue-600/5", text: "text-blue-400" },
    { label: "収支", value: stats.balance, color: "from-violet-500/20 to-violet-600/5", text: stats.balance >= 0 ? "text-violet-400" : "text-red-400" },
  ]

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 基本4指標 */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map(c => (
          <div key={c.label} className={`bg-linear-to-br ${c.color} border border-slate-700/50 rounded-2xl p-4`}>
            <p className="text-xs text-slate-400 mb-1">{c.label}</p>
            <p className={`text-xl font-bold ${c.text}`}>{formatCurrency(c.value)}</p>
          </div>
        ))}
      </div>

      {/* 生活安全レベル */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">生活安全レベル</span>
          <span className={`text-2xl font-black ${color}`}>{level}</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${
              level === "S" ? "bg-emerald-400" : level === "A" ? "bg-green-400" : level === "B" ? "bg-yellow-400" : level === "C" ? "bg-orange-400" : "bg-red-400"
            }`}
            style={{ width: `${bar}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">貯蓄率 {stats.savingRate}% 目標: 20%以上</p>
      </div>

      {/* 目標達成ミニカード */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-300">🎯 目標達成状況（手取り基準）</h3>
          <span className="text-xs text-slate-500">手取り: {formatCurrency(allocation.takeHome)}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          {[
            { label: "固定費", data: allocation.fixed },
            { label: "変動費", data: allocation.variable },
            { label: "貯蓄+投資", data: allocation.savings },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
              <p className="text-slate-400 mb-1">{item.label}</p>
              <p className={item.data.ok ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                実績 {item.data.actual}% / 目標 {item.data.target}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 赤字アラートと将来予測 */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">🔮 赤字・将来予測</h3>

        <div className={`rounded-xl border p-3 ${stats.balance < 0 ? "border-red-500/40 bg-red-900/20" : "border-emerald-500/30 bg-emerald-900/20"}`}>
          <p className="text-xs text-slate-300 mb-1">今月の実績判定</p>
          <p className={`text-sm font-semibold ${stats.balance < 0 ? "text-red-300" : "text-emerald-300"}`}>
            {stats.balance < 0 ? `赤字です（${formatCurrency(Math.abs(stats.balance))}）` : `黒字です（${formatCurrency(stats.balance)}）`}
          </p>
        </div>

        <div className={`rounded-xl border p-3 ${forecast.projectedBalance < 0 ? "border-red-500/40 bg-red-900/20" : "border-blue-500/30 bg-blue-900/20"}`}>
          <p className="text-xs text-slate-300 mb-1">月末見込み（現在ペース）</p>
          <p className={`text-sm font-semibold ${forecast.projectedBalance < 0 ? "text-red-300" : "text-blue-300"}`}>
            {forecast.projectedBalance < 0
              ? `月末は赤字見込み ${formatCurrency(Math.abs(forecast.projectedBalance))}`
              : `月末は黒字見込み ${formatCurrency(forecast.projectedBalance)}`}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            進捗 {forecast.daysElapsed}/{forecast.daysInMonth}日 | 収入見込み {formatCurrency(forecast.projectedIncome)} | 支出見込み {formatCurrency(forecast.projectedExpense)}
          </p>
        </div>

        <div className={`rounded-xl border p-3 ${forecast.annualProjection < 0 ? "border-red-500/40 bg-red-900/20" : "border-violet-500/30 bg-violet-900/20"}`}>
          <p className="text-xs text-slate-300 mb-1">12か月予測（直近3か月平均ベース）</p>
          <p className={`text-sm font-semibold ${forecast.annualProjection < 0 ? "text-red-300" : "text-violet-300"}`}>
            {forecast.annualProjection < 0
              ? `年間で赤字見込み ${formatCurrency(Math.abs(forecast.annualProjection))}`
              : `年間で黒字見込み ${formatCurrency(forecast.annualProjection)}`}
          </p>
          <p className="text-xs text-slate-400 mt-1">平均月次収支: {formatCurrency(forecast.avgMonthlyBalance)}</p>
        </div>
      </div>

      {/* 詳細指標 */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">詳細指標</h3>
        {[
          { label: "貯蓄率", value: `${stats.savingRate}%`, good: stats.savingRate >= 20 },
          { label: "固定費率", value: `${stats.fixedRate}%`, good: stats.fixedRate <= 50 },
          { label: "浪費率", value: `${stats.wasteRate}%`, good: stats.wasteRate <= 30 },
          { label: "防衛資金（6ヶ月分）", value: formatCurrency(stats.defenseFund), good: true },
          { label: "固定費合計", value: formatCurrency(stats.fixed), good: true },
          { label: "投資額", value: formatCurrency(stats.investment), good: true },
        ].map(item => (
          <div key={item.label} className="flex justify-between items-center">
            <span className="text-xs text-slate-400">{item.label}</span>
            <span className={`text-sm font-semibold ${item.good ? "text-slate-200" : "text-orange-400"}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* 予算進捗 */}
      {stats.budgetProgress.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">予算進捗</h3>
          {stats.budgetProgress.map(b => (
            <div key={b.id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{b.category}</span>
                <span className={b.pct >= 100 ? "text-red-400 font-bold" : b.pct >= 80 ? "text-orange-400" : "text-slate-300"}>
                  {formatCurrency(b.spent)} / {formatCurrency(b.amount)} ({b.pct}%)
                </span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full">
                <div
                  className={`h-1.5 rounded-full ${b.pct >= 100 ? "bg-red-500" : b.pct >= 80 ? "bg-orange-400" : "bg-violet-500"}`}
                  style={{ width: `${Math.min(b.pct, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
