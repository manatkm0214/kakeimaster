"use client"

import { Budget, Profile, Transaction, formatCurrency } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useState, useMemo, useEffect } from "react"

interface Props {
  transactions: Transaction[]
  budgets: Budget[]
  currentMonth: string
  profile: Profile | null
  onProfileUpdate: (next: Partial<Profile>) => void
}

interface AnalysisResult {
  summary: string
  positives: string[]
  warnings: string[]
  actions: string[]
  actions_detailed?: {
    title: string
    expected_impact_yen: number
    priority: "high" | "medium" | "low"
  }[]
}

interface SavingsPlan {
  fixed_savings: string[]
  variable_savings: string[]
  income_boost: string[]
  monthly_save: string
  summary: string
}

type GoalDirection = "max" | "min"

interface AllocationMetric {
  key: "fixed" | "variable" | "savings"
  label: string
  actual: number
  target: number
  direction: GoalDirection
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

export default function AIAnalysis({ transactions, budgets, currentMonth, profile, onProfileUpdate }: Props) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [savingsPlan, setSavingsPlan] = useState<SavingsPlan | null>(null)
  const [goal, setGoal] = useState("")
  const [takeHomeInput, setTakeHomeInput] = useState("")
  const [targetFixedRate, setTargetFixedRate] = useState(35)
  const [targetVariableRate, setTargetVariableRate] = useState(25)
  const [targetSavingsRate, setTargetSavingsRate] = useState(20)
  const [loading, setLoading] = useState(false)
  const [savingLoading, setSavingLoading] = useState(false)
  const [goalSaving, setGoalSaving] = useState(false)

  const stats = useMemo(() => {
    const monthly = transactions.filter(t => t.date.startsWith(currentMonth))
    const income = monthly.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const expense = monthly.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    const saving = monthly.filter(t => t.type === "saving").reduce((s, t) => s + t.amount, 0)
    const investment = monthly.filter(t => t.type === "investment").reduce((s, t) => s + t.amount, 0)
    const fixed = monthly.filter(t => t.is_fixed).reduce((s, t) => s + t.amount, 0)
    const variable = expense - fixed
    const savingRate = income > 0 ? Math.round(((saving + investment) / income) * 100) : 0
    const fixedRate = expense > 0 ? Math.round((fixed / expense) * 100) : 0
    const catMap: Record<string, number> = {}
    monthly.filter(t => t.type === "expense").forEach(t => {
      catMap[t.category] = (catMap[t.category] ?? 0) + t.amount
    })
    return { income, expense, saving, investment, fixed, variable, savingRate, fixedRate, categoryExpenses: catMap }
  }, [transactions, currentMonth])

  const budgetProgress = useMemo(() => {
    const monthly = transactions.filter((t) => t.date.startsWith(currentMonth) && t.type === "expense")
    return budgets
      .filter((b) => b.month === currentMonth)
      .map((budget) => {
        const spent = monthly
          .filter((t) => t.category === budget.category)
          .reduce((sum, t) => sum + t.amount, 0)
        const pct = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0
        return { ...budget, spent, pct }
      })
      .sort((a, b) => b.pct - a.pct)
  }, [transactions, budgets, currentMonth])

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = window.localStorage.getItem("kakeibo-allocation-goal")
    if (!raw) return

    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed.takeHomeInput === "string") {
        setTakeHomeInput(parsed.takeHomeInput)
      }
      if (typeof parsed.targetFixedRate === "number") {
        setTargetFixedRate(parsed.targetFixedRate)
      }
      if (typeof parsed.targetVariableRate === "number") {
        setTargetVariableRate(parsed.targetVariableRate)
      }
      if (typeof parsed.targetSavingsRate === "number") {
        setTargetSavingsRate(parsed.targetSavingsRate)
      }
    } catch {
      // no-op when saved value is malformed
    }
  }, [])

  useEffect(() => {
    if (!profile) return

    if (typeof profile.allocation_take_home === "number") {
      setTakeHomeInput(String(profile.allocation_take_home))
    }
    if (typeof profile.allocation_target_fixed_rate === "number") {
      setTargetFixedRate(clampPercent(profile.allocation_target_fixed_rate))
    }
    if (typeof profile.allocation_target_variable_rate === "number") {
      setTargetVariableRate(clampPercent(profile.allocation_target_variable_rate))
    }
    if (typeof profile.allocation_target_savings_rate === "number") {
      setTargetSavingsRate(clampPercent(profile.allocation_target_savings_rate))
    }
  }, [profile])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(
      "kakeibo-allocation-goal",
      JSON.stringify({
        takeHomeInput,
        targetFixedRate,
        targetVariableRate,
        targetSavingsRate,
      })
    )
  }, [takeHomeInput, targetFixedRate, targetVariableRate, targetSavingsRate])

  const takeHome = useMemo(() => {
    const parsed = Number(takeHomeInput.replace(/,/g, "").trim())
    if (Number.isFinite(parsed) && parsed > 0) return parsed
    return stats.income
  }, [takeHomeInput, stats.income])

  const actualFixedRate = useMemo(() => (takeHome > 0 ? round1((stats.fixed / takeHome) * 100) : 0), [stats.fixed, takeHome])
  const actualVariableRate = useMemo(() => (takeHome > 0 ? round1((stats.variable / takeHome) * 100) : 0), [stats.variable, takeHome])
  const actualSavingsRate = useMemo(() => {
    const totalSavings = stats.saving + stats.investment
    return takeHome > 0 ? round1((totalSavings / takeHome) * 100) : 0
  }, [stats.saving, stats.investment, takeHome])

  const allocationMetrics: AllocationMetric[] = useMemo(
    () => [
      {
        key: "fixed",
        label: "固定費",
        actual: actualFixedRate,
        target: targetFixedRate,
        direction: "max",
      },
      {
        key: "variable",
        label: "変動費",
        actual: actualVariableRate,
        target: targetVariableRate,
        direction: "max",
      },
      {
        key: "savings",
        label: "貯蓄+投資",
        actual: actualSavingsRate,
        target: targetSavingsRate,
        direction: "min",
      },
    ],
    [
      actualFixedRate,
      actualVariableRate,
      actualSavingsRate,
      targetFixedRate,
      targetVariableRate,
      targetSavingsRate,
    ]
  )

  const targetRateTotal = targetFixedRate + targetVariableRate + targetSavingsRate

  const forecast = useMemo(() => {
    const [year, month] = currentMonth.split("-").map(Number)
    const today = new Date()
    const isCurrent = today.getFullYear() === year && today.getMonth() + 1 === month
    const daysInMonth = new Date(year, month, 0).getDate()
    const daysPassed = isCurrent ? Math.max(1, today.getDate()) : daysInMonth

    const projectedExpense = round1((stats.expense / daysPassed) * daysInMonth)
    const projectedSavings = round1(((stats.saving + stats.investment) / daysPassed) * daysInMonth)
    const projectedFixedRate = takeHome > 0 ? round1((stats.fixed / takeHome) * 100) : 0
    const projectedVariableRate = takeHome > 0 ? round1(((projectedExpense - stats.fixed) / takeHome) * 100) : 0
    const projectedSavingsRate = takeHome > 0 ? round1((projectedSavings / takeHome) * 100) : 0

    return {
      daysInMonth,
      daysPassed,
      projectedExpense,
      projectedSavings,
      projectedFixedRate,
      projectedVariableRate,
      projectedSavingsRate,
    }
  }, [currentMonth, stats.expense, stats.fixed, stats.investment, stats.saving, takeHome])

  async function saveAllocationGoal() {
    setGoalSaving(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("ログイン状態を確認できませんでした。再ログインしてください。")
        return
      }

      const payload = {
        id: user.id,
        allocation_take_home: Math.round(takeHome),
        allocation_target_fixed_rate: clampPercent(targetFixedRate),
        allocation_target_variable_rate: clampPercent(targetVariableRate),
        allocation_target_savings_rate: clampPercent(targetSavingsRate),
      }

      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" })

      if (error) {
        if (error.message.includes("allocation_target") || error.message.includes("allocation_take_home")) {
          alert("DBに目標保存用カラムがありません。supabase_schema_fixed.sql を適用してください。")
          return
        }
        alert("目標の保存に失敗しました: " + error.message)
        return
      }

      onProfileUpdate(payload)
      alert("目標配分を保存しました")
    } finally {
      setGoalSaving(false)
    }
  }

  async function runAnalysis() {
    setLoading(true)
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "analysis",
          data: {
            ...stats,
            takeHome,
            allocationTargets: {
              fixed: targetFixedRate,
              variable: targetVariableRate,
              savings: targetSavingsRate,
            },
            allocationActual: {
              fixed: actualFixedRate,
              variable: actualVariableRate,
              savings: actualSavingsRate,
            },
            forecast,
            budgetProgress: budgetProgress.slice(0, 5),
          },
        }),
      })
      const { result } = await res.json()
      const parsed = JSON.parse(result.replace(/```json|```/g, "").trim())
      setAnalysis(parsed)
    } catch {
      alert("分析に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  async function runSavingsPlan() {
    if (!goal) { alert("目標を入力してください"); return }
    setSavingLoading(true)
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "savings_plan",
          data: { goal, income: stats.income, fixedExpenses: stats.fixed, variableExpenses: stats.variable },
        }),
      })
      const { result } = await res.json()
      const parsed = JSON.parse(result.replace(/```json|```/g, "").trim())
      setSavingsPlan(parsed)
    } catch {
      alert("プラン生成に失敗しました")
    } finally {
      setSavingLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 手取りベース目標配分 */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">🎯 お金の分配目標（手取り基準）</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
          <label className="text-xs text-slate-400">
            今月の手取り（円）
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={takeHomeInput}
              onChange={(e) => setTakeHomeInput(e.target.value)}
              placeholder="未入力なら今月収入を使用"
              className="w-full mt-1 bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
            />
          </label>
          <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 text-xs text-slate-300">
            <p className="text-slate-400 mb-1">配分の見方（初心者向け）</p>
            <p>固定費・変動費は目標以下ならOK、貯蓄+投資は目標以上ならOKです。</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          <label className="text-xs text-slate-400">
            固定費目標（%以下）
            <input
              type="number"
              min={0}
              max={100}
              value={targetFixedRate}
              onChange={(e) => setTargetFixedRate(Number(e.target.value || 0))}
              className="w-full mt-1 bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="text-xs text-slate-400">
            変動費目標（%以下）
            <input
              type="number"
              min={0}
              max={100}
              value={targetVariableRate}
              onChange={(e) => setTargetVariableRate(Number(e.target.value || 0))}
              className="w-full mt-1 bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="text-xs text-slate-400">
            貯蓄+投資目標（%以上）
            <input
              type="number"
              min={0}
              max={100}
              value={targetSavingsRate}
              onChange={(e) => setTargetSavingsRate(Number(e.target.value || 0))}
              className="w-full mt-1 bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
            />
          </label>
        </div>

        <div className="flex justify-end mb-3">
          <button
            onClick={saveAllocationGoal}
            disabled={goalSaving}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 rounded-xl text-xs font-medium transition-all"
          >
            {goalSaving ? "保存中..." : "この目標を同期保存"}
          </button>
        </div>

        <div className="mb-3 text-xs text-slate-400">
          目標割合の合計: <span className={targetRateTotal > 100 ? "text-red-400 font-semibold" : "text-slate-200 font-semibold"}>{targetRateTotal}%</span>
          {targetRateTotal > 100 && "（100%を超えています。目標を見直してください）"}
        </div>

        <div className="space-y-3">
          {allocationMetrics.map((metric) => {
            const achieved = metric.direction === "max" ? metric.actual <= metric.target : metric.actual >= metric.target
            const diff = round1(metric.actual - metric.target)
            const valueColor = achieved ? "text-emerald-400" : "text-red-400"
            const barColor = achieved ? "bg-emerald-500" : "bg-red-500"

            return (
              <div key={metric.key} className="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <p className="text-slate-300 font-semibold">{metric.label}</p>
                  <p className={valueColor}>
                    実績 {metric.actual}% / 目標 {metric.target}%
                  </p>
                </div>

                <div className="h-2 rounded-full bg-slate-700 overflow-hidden mb-1">
                  <div className={`h-full ${barColor} transition-all`} style={{ width: `${Math.min(metric.actual, 100)}%` }} />
                </div>

                <p className={`text-xs ${achieved ? "text-emerald-400" : "text-red-400"}`}>
                  {achieved
                    ? "達成"
                    : metric.direction === "max"
                      ? `未達（目標より+${Math.abs(diff)}%）`
                      : `未達（目標より-${Math.abs(diff)}%）`}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* 月末予測 */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">📅 月末予測（今のペース）</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs mb-3">
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-slate-500 mb-1">予測支出</p>
            <p className="text-lg font-bold text-red-300">{formatCurrency(forecast.projectedExpense)}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-slate-500 mb-1">予測貯蓄+投資</p>
            <p className="text-lg font-bold text-emerald-300">{formatCurrency(forecast.projectedSavings)}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-slate-500 mb-1">進捗日数</p>
            <p className="text-lg font-bold text-slate-200">{forecast.daysPassed} / {forecast.daysInMonth}日</p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <p className={forecast.projectedVariableRate <= targetVariableRate ? "text-emerald-400" : "text-red-400"}>
            変動費率予測: {forecast.projectedVariableRate}%（目標 {targetVariableRate}%以下）
          </p>
          <p className={forecast.projectedSavingsRate >= targetSavingsRate ? "text-emerald-400" : "text-red-400"}>
            貯蓄率予測: {forecast.projectedSavingsRate}%（目標 {targetSavingsRate}%以上）
          </p>
        </div>
      </div>

      {/* カテゴリ別予算達成率 */}
      {budgetProgress.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">📊 カテゴリ別 予算達成率</h3>
          <div className="space-y-2">
            {budgetProgress.map((b) => (
              <div key={b.id} className="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{b.category}</span>
                  <span className={b.pct > 100 ? "text-red-400 font-semibold" : b.pct >= 80 ? "text-orange-400" : "text-emerald-400"}>
                    {formatCurrency(b.spent)} / {formatCurrency(b.amount)} ({b.pct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full ${b.pct > 100 ? "bg-red-500" : b.pct >= 80 ? "bg-orange-400" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(100, b.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 今月分析 */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">🤖 今月のAI分析</h3>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-xs font-medium transition-all"
          >
            {loading ? "分析中..." : "分析する"}
          </button>
        </div>

        {/* 今月サマリ */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="bg-slate-900/50 rounded-lg p-2">
            <p className="text-slate-500">貯蓄率</p>
            <p className="text-lg font-bold text-violet-400">{stats.savingRate}%</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2">
            <p className="text-slate-500">固定費率</p>
            <p className="text-lg font-bold text-orange-400">{stats.fixedRate}%</p>
          </div>
        </div>

        {analysis && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-sm text-slate-300 leading-relaxed">{analysis.summary}</p>
            <div>
              <p className="text-xs font-semibold text-emerald-400 mb-1">✅ 良い点</p>
              {analysis.positives.map((p, i) => (
                <p key={i} className="text-xs text-slate-400 ml-2">・{p}</p>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-orange-400 mb-1">⚠️ 注意点</p>
              {analysis.warnings.map((w, i) => (
                <p key={i} className="text-xs text-slate-400 ml-2">・{w}</p>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-400 mb-1">🎯 来月のアクション</p>
              {analysis.actions_detailed && analysis.actions_detailed.length > 0 ? (
                analysis.actions_detailed.map((action, i) => (
                  <div key={`${action.title}-${i}`} className="text-xs text-slate-300 ml-2 mb-2 border border-slate-700 rounded-lg p-2">
                    <p>{i + 1}. {action.title}</p>
                    <p className="text-emerald-400">改善見込み: {formatCurrency(Math.max(0, Number(action.expected_impact_yen || 0)))}/月</p>
                    <p className="text-slate-400">優先度: {action.priority}</p>
                  </div>
                ))
              ) : (
                analysis.actions.map((a, i) => (
                  <p key={i} className="text-xs text-slate-400 ml-2">{i + 1}. {a}</p>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI節約プラン */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">💡 AI節約プラン</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="目標（例：毎月+1万円貯金したい）"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={runSavingsPlan}
            disabled={savingLoading}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 rounded-xl text-xs font-medium transition-all"
          >
            {savingLoading ? "生成中..." : "プラン生成"}
          </button>
        </div>

        {savingsPlan && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-3">
              <p className="text-xs font-semibold text-emerald-400">月間節約見込み</p>
              <p className="text-xl font-bold text-emerald-300">{formatCurrency(Number(savingsPlan.monthly_save))}</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{savingsPlan.summary}</p>
            {[
              { title: "🏠 固定費削減", items: savingsPlan.fixed_savings, color: "text-blue-400" },
              { title: "🛍️ 変動費削減", items: savingsPlan.variable_savings, color: "text-yellow-400" },
              { title: "💼 収入アップ", items: savingsPlan.income_boost, color: "text-emerald-400" },
            ].map(s => (
              <div key={s.title}>
                <p className={`text-xs font-semibold ${s.color} mb-1`}>{s.title}</p>
                {s.items.map((item, i) => (
                  <p key={i} className="text-xs text-slate-400 ml-2">・{item}</p>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
