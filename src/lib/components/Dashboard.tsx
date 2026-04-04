"use client"

import { Transaction, Budget, Profile, formatCurrency } from "@/lib/utils"
import { useEffect, useMemo, useState, createContext, useContext } from "react"
import KidsDashboard from "./KidsDashboard"
import PresetSetup from "./PresetSetup"

// 多言語ラベル
const LANGUAGES = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
];
const LABELS = {
  ja: {
    summary: "サマリー",
    goal: "目標",
    child: "子供",
    elder: "高齢者",
    loan: "ローン",
    customize: "カスタマイズ",
    print: "印刷",
    share: "共有",
    category: {
      housing: "住居", food: "食費", utilities: "水道光熱", transport: "交通", entertainment: "娯楽", other: "その他"
    },
    categoryAllocation: "カテゴリ配分（目標 vs 実績）",
    budgetProgress: "予算進捗（カテゴリ別）",
    detailMetrics: "📐 詳細指標",
    forecast: "🔮 赤字・将来予測",
    defense: "🛡 防衛資金目安",
    improvement: "🧭 改善ナビ",
    setup: "初期設定",
    notSet: "未設定",
    actual: "実績",
    target: "目標",
  },
  en: {
    summary: "Summary",
    goal: "Goal",
    child: "Kids",
    elder: "Senior",
    loan: "Loan",
    customize: "Customize",
    print: "Print",
    share: "Share",
    category: {
      housing: "Housing", food: "Food", utilities: "Utilities", transport: "Transport", entertainment: "Entertainment", other: "Other"
    },
    categoryAllocation: "Category Allocation (Target vs Actual)",
    budgetProgress: "Budget Progress (by Category)",
    detailMetrics: "📐 Detail Metrics",
    forecast: "🔮 Deficit & Forecast",
    defense: "🛡 Defense Fund Guide",
    improvement: "🧭 Improvement Guide",
    setup: "Setup",
    notSet: "Unset",
    actual: "Actual",
    target: "Target",
  },
};

// 言語コンテキスト
type LangType = "ja" | "en";
const LangContext = createContext<{ lang: LangType; setLang: (l: LangType) => void }>({ lang: "ja", setLang: () => {} });
export function useLang() { return useContext(LangContext); }

export default function Dashboard({ transactions, budgets, currentMonth, profile }: {
  transactions: Transaction[]
  budgets: Budget[]
  currentMonth: string
  profile: Profile | null
}) {
  // グローバル言語state
  const [lang, setLang] = useState<LangType>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("kakeibo-lang");
      if (stored === "ja" || stored === "en") return stored;
    }
    return "ja";
  });
  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("kakeibo-lang", lang);
  }, [lang]);
  const T = LABELS[lang as keyof typeof LABELS] || LABELS.ja;

  // ─── ユーティリティ ───────────────────────────────────────────────────────
  function readSavingsGoalFromStorage(): number {
    if (typeof window === "undefined") return 0
    const raw = window.localStorage.getItem("kakeibo-savings-goal")
    const parsed = Number(raw || 0)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  }

  // ─── State ───────────────────────────────────────────────────────────────
  // ページ切り替えUI用 state
  type DashboardPage = "summary" | "goal" | "loan" | "child" | "elder";
  const [activePage, setActivePage] = useState<DashboardPage>("summary");

  // ページ切り替えボタン
  const pageOptions = [
    { type: "summary", label: T.summary },
    { type: "goal", label: T.goal },
    { type: "child", label: T.child },
    { type: "elder", label: T.elder },
    // { type: "loan", label: T.loan },
  ];
  const [highlightAfterSave, setHighlightAfterSave] = useState(() => {
    if (typeof window === "undefined") return false
    return window.sessionStorage.getItem("kakeibo-just-saved") === "1"
  })
  const [monthlySavingsGoal, setMonthlySavingsGoal] = useState(() => readSavingsGoalFromStorage())
  const [strategyMode, setStrategyMode] = useState<"standard" | "inflation" | "deficit" | "custom">(() => {
    if (typeof window === "undefined") return "standard"
    const saved = window.localStorage.getItem("kakeibo-strategy-mode")
    return saved === "inflation" || saved === "deficit" || saved === "custom" || saved === "standard"
      ? saved
      : "standard"
  })
  const [moneyUnit] = useState<1 | 1000 | 10000>(() => {
    if (typeof window === "undefined") return 10000
    const raw = Number(window.localStorage.getItem("kakeibo-money-unit") || 10000)
    if (raw === 1 || raw === 1000 || raw === 10000) return raw
    return 10000
  })
  const [defenseBasis, setDefenseBasis] = useState<"expense" | "fixed">(() => {
    if (typeof window === "undefined") return "expense"
    const saved = window.localStorage.getItem("kakeibo-defense-basis")
    return saved === "fixed" ? "fixed" : "expense"
  })

  // ─── 副作用 ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("kakeibo-strategy-mode", strategyMode)
  }, [strategyMode])
  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("kakeibo-money-unit", String(moneyUnit))
  }, [moneyUnit])
  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem("kakeibo-defense-basis", defenseBasis)
  }, [defenseBasis])
  useEffect(() => {
    if (typeof window === "undefined") return
    const syncSavingsGoal = () => setMonthlySavingsGoal(readSavingsGoalFromStorage())
    syncSavingsGoal()
    window.addEventListener("storage", syncSavingsGoal)
    window.addEventListener("kakeibo-goals-updated", syncSavingsGoal as EventListener)
    window.addEventListener("focus", syncSavingsGoal)
    return () => {
      window.removeEventListener("storage", syncSavingsGoal)
      window.removeEventListener("kakeibo-goals-updated", syncSavingsGoal as EventListener)
      window.removeEventListener("focus", syncSavingsGoal)
    }
  }, [])
  useEffect(() => {
    if (typeof window === "undefined" || !highlightAfterSave) return
    window.sessionStorage.removeItem("kakeibo-just-saved")
    const id = window.setTimeout(() => setHighlightAfterSave(false), 500)
    return () => window.clearTimeout(id)
  }, [highlightAfterSave])

  // ─── 計算 ─────────────────────────────────────────────────────────────────
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
    const reserveStock = transactions
      .filter(t => t.type === "saving" || t.type === "investment")
      .reduce((sum, t) => sum + t.amount, 0)
    const categoryMap: Record<string, number> = {}
    monthly.filter(t => t.type === "expense").forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount
    })
    const budgetProgress = budgets.filter(b => b.month === currentMonth).map(b => {
      const spent = monthly.filter(t => t.type === "expense" && t.category === b.category).reduce((s, t) => s + t.amount, 0)
      return { ...b, spent, pct: Math.round((spent / b.amount) * 100) }
    })
    return { income, expense, saving, investment, balance, savingRate, fixedRate, wasteRate, reserveStock, fixed, categoryMap, budgetProgress }
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
    const recentMonths = Array.from({ length: 3 }).map((_, i) => {
      const d = new Date(year, month - 1 - i, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    })
    const targetMonths = isCurrentMonth ? recentMonths : [currentMonth, ...recentMonths.slice(0, 2)]
    const monthlyBalances = targetMonths.map(m => {
      const ml = transactions.filter(t => t.date.startsWith(m))
      const inc = ml.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
      const exp = ml.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
      const sav = ml.filter(t => t.type === "saving").reduce((s, t) => s + t.amount, 0)
      const inv = ml.filter(t => t.type === "investment").reduce((s, t) => s + t.amount, 0)
      return inc - exp - sav - inv
    }).filter(v => Number.isFinite(v))
    const avgMonthlyBalance = monthlyBalances.length > 0
      ? Math.round(monthlyBalances.reduce((s, v) => s + v, 0) / monthlyBalances.length)
      : stats.balance
    return { daysElapsed, daysInMonth, projectedIncome, projectedExpense, projectedSaving, projectedInvestment, projectedBalance, avgMonthlyBalance, annualProjection: avgMonthlyBalance * 12 }
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

  const budgetMonth = useMemo(() => {
    const inCurrent = budgets.some(b => b.month === currentMonth)
    if (inCurrent) return currentMonth
    const sorted = [...budgets].map(b => b.month).filter(Boolean).sort((a, b) => b.localeCompare(a))
    return sorted[0] ?? null
  }, [budgets, currentMonth])

  const categoryAllocationView = useMemo(() => {
    if (!budgetMonth) return [] as Array<{ category: string; targetAmount: number; targetPct: number; actualAmount: number; actualPct: number }>
    const targetBudgets = budgets.filter(b => b.month === budgetMonth)
    const totalTarget = targetBudgets.reduce((s, b) => s + b.amount, 0)
    return targetBudgets.map(b => {
      const actualAmount = stats.categoryMap[b.category] ?? 0
      return {
        category: b.category,
        targetAmount: b.amount,
        targetPct: totalTarget > 0 ? Math.round((b.amount / totalTarget) * 100) : 0,
        actualAmount,
        actualPct: stats.expense > 0 ? Math.round((actualAmount / stats.expense) * 100) : 0,
      }
    }).sort((a, b) => b.targetAmount - a.targetAmount)
  }, [budgetMonth, budgets, stats.categoryMap, stats.expense])

  const expenseTrend = useMemo(() => {
    const [year, month] = currentMonth.split("-").map(Number)
    const recentMonths = Array.from({ length: 3 }).map((_, i) => {
      const d = new Date(year, month - 1 - i, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    })
    const monthlyExpenses = recentMonths.map(m =>
      transactions.filter(t => t.date.startsWith(m) && t.type === "expense").reduce((s, t) => s + t.amount, 0)
    )
    const current = monthlyExpenses[0] ?? 0
    const base = monthlyExpenses.slice(1)
    const baseAvg = base.length > 0 ? base.reduce((s, v) => s + v, 0) / base.length : 0
    const changeRate = baseAvg > 0 ? Math.round(((current - baseAvg) / baseAvg) * 100) : 0
    return { changeRate, pressure: changeRate > 10 }
  }, [currentMonth, transactions])

  const policyTargets = useMemo(() => {
    if (strategyMode === "custom" && profile) return { title: "カスタムモード", fixed: profile.allocation_target_fixed_rate ?? 35, variable: profile.allocation_target_variable_rate ?? 25, savings: profile.allocation_target_savings_rate ?? 20, notes: "手取りの範囲で持続可能性を重視した標準配分" }
    if (strategyMode === "inflation") return { title: "物価高対策モード", fixed: 33, variable: 22, savings: 25, notes: "生活必需を守りつつ、変動費を先に削減して実質可処分を守る配分" }
    if (strategyMode === "deficit") return { title: "赤字改善モード", fixed: 30, variable: 20, savings: 30, notes: "固定費の見直しを優先し、先取り貯蓄で赤字再発を防ぐ配分" }
    return { title: "経済標準モード", fixed: 35, variable: 25, savings: 20, notes: "あなたが設定した配分目標を基準に改善ナビを表示" }
  }, [profile, strategyMode])

  const improvementNav = useMemo(() => {
    const actions: string[] = []
    if (allocation.fixed.actual > policyTargets.fixed) actions.push(`固定費が目標を ${allocation.fixed.actual - policyTargets.fixed}% 超過。通信・保険・サブスクを優先見直し。`)
    if (allocation.variable.actual > policyTargets.variable) actions.push(`変動費が目標を ${allocation.variable.actual - policyTargets.variable}% 超過。食費・日用品は週予算上限を設定。`)
    if (allocation.savings.actual < policyTargets.savings) actions.push(`貯蓄+投資が目標を ${policyTargets.savings - allocation.savings.actual}% 下回り。給料日に先取り設定を増額。`)
    if (stats.balance < 0) actions.push(`今月は赤字 ${formatCurrency(Math.abs(stats.balance))}。来月まで固定費を少なくとも ${formatCurrency(Math.ceil(Math.abs(stats.balance) / 2))} 圧縮。`)
    if (expenseTrend.pressure) actions.push(`直近支出が平均比 +${expenseTrend.changeRate}%。物価高圧力あり。代替ブランド・まとめ買いを実施。`)
    if (actions.length === 0) actions.push("配分は健全圏です。余剰分は防衛資金6か月分の積み増しを優先。")
    return actions
  }, [allocation.fixed.actual, allocation.savings.actual, allocation.variable.actual, expenseTrend.changeRate, expenseTrend.pressure, policyTargets.fixed, policyTargets.savings, policyTargets.variable, stats.balance])



  // const { level, color, bar } = safeLevel(stats.savingRate)

  const defenseFund = useMemo(() => {
    if (stats.reserveStock > 0) return stats.reserveStock
    if (monthlySavingsGoal > 0) return monthlySavingsGoal
    return stats.saving + stats.investment
  }, [monthlySavingsGoal, stats.investment, stats.reserveStock, stats.saving])

  const expenseBaseline = useMemo(() => {
    if (stats.expense > 0) return stats.expense
    const [year, month] = currentMonth.split("-").map(Number)
    const months = Array.from({ length: 3 }).map((_, i) => {
      const d = new Date(year, month - 1 - i, 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    })
    const history = months.map(m => transactions.filter(t => t.type === "expense" && t.date.startsWith(m)).reduce((s, t) => s + t.amount, 0)).filter(v => v > 0)
    if (history.length > 0) return Math.round(history.reduce((s, v) => s + v, 0) / history.length)
    if ((profile?.allocation_take_home ?? 0) > 0) return Math.round((profile!.allocation_take_home as number) * 0.6)
    return 100000
  }, [currentMonth, profile, stats.expense, transactions])

  const defenseMonthlyBase = defenseBasis === "fixed" ? (stats.fixed > 0 ? stats.fixed : Math.round(expenseBaseline * 0.5)) : expenseBaseline
  const defenseMinimum = Math.round(defenseMonthlyBase * 3)
  const defenseTarget = Math.round(defenseMonthlyBase * 6)
  const defenseShortfall = Math.max(0, defenseTarget - defenseFund)
  const defenseProgress = defenseTarget > 0 ? Math.min(100, Math.round((defenseFund / defenseTarget) * 100)) : 0



  const forecastSavings = useMemo(() => {
    const monthlySavingsActual = stats.saving + stats.investment
    const projectedMonthlySavings = forecast.projectedSaving + forecast.projectedInvestment
    const annualSavingsProjection = projectedMonthlySavings * 12
    const deficitRiskCount = [stats.balance, forecast.projectedBalance, forecast.avgMonthlyBalance].filter(v => v < 0).length
    const deficitRisk = deficitRiskCount >= 2 ? "high" : deficitRiskCount === 1 ? "mid" : "low"
    return { monthlySavingsActual, projectedMonthlySavings, annualSavingsProjection, deficitRisk }
  }, [forecast.avgMonthlyBalance, forecast.projectedBalance, forecast.projectedInvestment, forecast.projectedSaving, stats.balance, stats.investment, stats.saving])

  const defenseEtaMonths = useMemo(() => {
    if (defenseShortfall <= 0) return 0
    const monthly = Math.max(0, forecastSavings.projectedMonthlySavings)
    if (monthly <= 0) return null
    return Math.ceil(defenseShortfall / monthly)
  }, [defenseShortfall, forecastSavings.projectedMonthlySavings])

  const defenseEtaDateLabel = useMemo(() => {
    if (defenseEtaMonths == null || defenseEtaMonths <= 0) return null
    const eta = new Date(new Date().getFullYear(), new Date().getMonth() + defenseEtaMonths, 1)
    return `${eta.getFullYear()}年${eta.getMonth() + 1}月`
  }, [defenseEtaMonths])

  // ─── 基本4指標カード ─────────────────────────────────────────────────────


  // ─── 詳細指標 ─────────────────────────────────────────────────────────────
  const avgBudgetPct = stats.budgetProgress.length > 0
    ? Math.round(stats.budgetProgress.reduce((a, b) => a + b.pct, 0) / stats.budgetProgress.length)
    : null
  const passiveIncomeRate = stats.income > 0 ? Math.round((stats.saving / stats.income) * 100) : 0
  const hourlyWage = profile?.work_hours_month && profile.work_hours_month > 0
    ? Math.round(stats.income / profile.work_hours_month)
    : null

  const detailMetrics = [
    { label: "貯蓄率", value: `${stats.savingRate}%`, sub: "収入に占める貯金+投資", ok: stats.savingRate >= 20 },
    { label: "固定費率", value: `${stats.fixedRate}%`, sub: "支出に占める固定費", ok: stats.fixedRate <= 40 },
    { label: "浪費率", value: `${stats.wasteRate}%`, sub: "収入に占める変動費", ok: stats.wasteRate <= 30 },
    { label: "予算進捗", value: avgBudgetPct != null ? `${avgBudgetPct}%` : "-", sub: "今月の予算消化率", ok: avgBudgetPct != null && avgBudgetPct <= 80 },
    { label: "生活防衛（月数）", value: stats.expense > 0 ? `${(defenseFund / (stats.expense)).toFixed(1)}ヶ月` : "-", sub: "目安: 3〜6ヶ月分", ok: stats.expense > 0 && defenseFund / stats.expense >= 3 },
    { label: "受動収入率", value: `${passiveIncomeRate}%`, sub: "収入に占める貯金（将来への布石）", ok: passiveIncomeRate >= 10 },
    { label: "時給換算", value: hourlyWage != null ? `¥${hourlyWage.toLocaleString()}` : "-", sub: "収入÷月間労働時間", ok: hourlyWage != null && hourlyWage >= 1500 },
    { label: "赤字危険度", value: stats.balance < 0 ? "高" : forecastSavings.deficitRisk === "mid" ? "中" : "低", sub: stats.balance < 0 ? `赤字 ${formatCurrency(Math.abs(stats.balance))}` : "収支安全圏", ok: stats.balance >= 0 },
    { label: "節約達成度", value: `${stats.savingRate}%`, sub: "目標: 貯蓄率20%以上", ok: stats.savingRate >= 20 },
  ]

  // ─── JSX ─────────────────────────────────────────────────────────────────
  return (
    <LangContext.Provider value={{ lang, setLang }}>
    <div className="w-full">
      {/* 言語切替ボタン（右上のみ） */}
      <div className="flex gap-2 mb-2 justify-end">
        {LANGUAGES.map(l => (
          <button
            key={l.code}
            onClick={() => setLang(l.code as LangType)}
            className={`px-2 py-1 rounded border text-xs ${lang === l.code ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"}`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* ページ切り替えナビ */}
        <div className="flex gap-2 mb-4">
          {pageOptions.map(opt => (
            <button
              key={opt.type}
              type="button"
              className={`px-4 py-2 rounded-xl font-bold shadow transition ${activePage === opt.type ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-700"}`}
              onClick={() => setActivePage(opt.type as DashboardPage)}
            >
              {opt.label}
            </button>
          ))}
        </div>


        {/* ══ 左カラム：サマリー＋ページ切り替え ══ */}
        <div className="flex flex-col gap-2">

          {/* 全ページ共通ボタンUI */}
          <div className="flex gap-2 mb-4">
            <a href="/customize" className="px-4 py-2 rounded-xl bg-pink-500 text-white font-bold shadow hover:bg-pink-600 transition">カスタマイズ</a>
            <button type="button" className="px-4 py-2 rounded-xl bg-slate-500 text-white font-bold shadow hover:bg-slate-600 transition" onClick={() => window.print()}>印刷</button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold shadow hover:bg-emerald-600 transition"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: document.title, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
            >
              共有
            </button>
          </div>

          {/* サマリー内容 */}
          {activePage === "summary" && (
            <>
              {/* サマリーカード：収入・支出・貯金・投資・収支 */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                <div className="flex flex-col items-center bg-emerald-900/60 rounded-xl p-3">
                  <span className="text-xs text-emerald-200">収入</span>
                  <span className="text-lg font-bold text-emerald-300">{formatCurrency(stats.income)}</span>
                </div>
                <div className="flex flex-col items-center bg-red-900/60 rounded-xl p-3">
                  <span className="text-xs text-red-200">支出</span>
                  <span className="text-lg font-bold text-red-300">{formatCurrency(stats.expense)}</span>
                </div>
                <div className="flex flex-col items-center bg-blue-900/60 rounded-xl p-3">
                  <span className="text-xs text-blue-200">貯金</span>
                  <span className="text-lg font-bold text-blue-300">{formatCurrency(stats.saving)}</span>
                </div>
                <div className="flex flex-col items-center bg-violet-900/60 rounded-xl p-3">
                  <span className="text-xs text-violet-200">投資</span>
                  <span className="text-lg font-bold text-violet-300">{formatCurrency(stats.investment)}</span>
                </div>
                <div className="flex flex-col items-center bg-slate-900/60 rounded-xl p-3">
                  <span className="text-xs text-slate-200">収支</span>
                  <span className={`text-lg font-bold ${stats.balance >= 0 ? "text-emerald-300" : "text-red-300"}`}>{formatCurrency(stats.balance)}</span>
                </div>
              </div>
            </>
          )}
          {/* 子供ダッシュボード＋目標設定 */}
          {activePage === "child" && (
            <>
              <KidsDashboard transactions={transactions} currentMonth={currentMonth} />
              <div className="mt-4">
                <PresetSetup onComplete={()=>{}} />
              </div>
            </>
          )}
          {/* 高齢者ダッシュボード＋目標設定 */}
          {activePage === "elder" && (
            <div className="mt-4">
              <PresetSetup onComplete={()=>{}} />
            </div>
          )}

          {/* 目標ページ仮実装 */}
          {activePage === "goal" && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center text-slate-300">
              <h3 className="text-base font-bold mb-2">🎯 目標ページ</h3>
              <p>ここに目標管理UIを実装できます。</p>
            </div>
          )}

          {/* ローンページ仮実装 */}
          {activePage === "loan" && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center text-slate-300">
              <h3 className="text-base font-bold mb-2">💸 ローンページ</h3>
              <p>ここにローン管理UIを実装できます。</p>
            </div>
          )}

          {/* 子供ページ仮実装 */}
          {activePage === "child" && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center text-slate-300">
              <h3 className="text-base font-bold mb-2">👦 子供ページ</h3>
              <p>ここに子供向けの家計簿や目標管理UIを実装できます。</p>
            </div>
          )}

          {/* 高齢者ページ仮実装 */}
          {activePage === "elder" && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center text-slate-300">
              <h3 className="text-base font-bold mb-2">🧓 高齢者ページ</h3>
              <p>ここに高齢者向けの家計簿や目標管理UIを実装できます。</p>
            </div>
          )}
        </div>

        {/* ══ 中カラム：詳細指標・予算 ══ */}
        <div className="flex flex-col gap-2">

          {/* 詳細指標 */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
            <h3 className="text-xs font-semibold text-slate-300 mb-2">📐 詳細指標</h3>
            <div className="flex flex-col gap-1.5">
              {detailMetrics.map(m => (
                <div key={m.label} className="flex items-center justify-between gap-2 bg-slate-900/50 rounded-lg px-2 py-1.5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200">{m.label}</p>
                    <p className="text-[10px] text-slate-500">{m.sub}</p>
                  </div>
                  <span className={`text-sm font-extrabold shrink-0 ${m.ok ? "text-emerald-400" : "text-orange-400"}`}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* カテゴリ配分 */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold text-slate-300">{T.categoryAllocation}</h3>
              <span className="text-[10px] text-slate-500">{budgetMonth ? `${budgetMonth}${lang === "ja" ? "基準" : ""}` : T.notSet}</span>
            </div>
            {categoryAllocationView.length === 0 ? (
              <p className="text-xs text-slate-400">{lang === "ja" ? "カテゴリ配分が未設定です。初期設定で作成してください。" : "No category allocation set. Please create in setup."}</p>
            ) : (
              <div className="space-y-1">
                {categoryAllocationView.slice(0, 9).map(row => (
                  <div key={row.category} className="rounded-lg border border-slate-700 bg-slate-900/40 px-2 py-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">{T.category[row.category as keyof typeof T.category] || row.category}</span>
                      <span className="text-emerald-300 font-semibold">{T.target} {formatCurrency(row.targetAmount)}</span>
                    </div>
                    <div className="mt-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-1 bg-violet-500" style={{ width: `${Math.min(row.targetPct, 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {T.actual} <span className="text-white font-bold">{formatCurrency(row.actualAmount)}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 予算進捗（カテゴリ別） */}
          {stats.budgetProgress.length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2">
              <h3 className="text-xs font-semibold text-slate-300 mb-2">📋 予算進捗（カテゴリ別）</h3>
              <div className="space-y-1.5">
                {stats.budgetProgress.map(b => (
                  <div key={b.id}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-400">{b.category}</span>
                      <span className={b.pct >= 100 ? "text-red-400 font-bold" : b.pct >= 80 ? "text-orange-400" : "text-slate-300"}>
                        {formatCurrency(b.spent)} / {formatCurrency(b.amount)} ({b.pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-1.5 rounded-full ${b.pct >= 100 ? "bg-red-500" : b.pct >= 80 ? "bg-orange-400" : "bg-violet-500"}`}
                        style={{ width: `${Math.min(b.pct, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══ 右カラム：予測・ナビ ══ */}
        <div className="flex flex-col gap-2">

          {/* 赤字・将来予測 */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2 space-y-1">
            <h3 className="text-xs font-semibold text-slate-300 mb-1">🔮 赤字・将来予測</h3>
            <div className={`rounded-lg border px-2 py-1.5 ${stats.balance < 0 ? "border-red-500/40 bg-red-900/20" : "border-emerald-500/30 bg-emerald-900/20"}`}>
              <p className="text-[10px] text-slate-400">今月実績</p>
              <p className={`text-sm font-semibold ${stats.balance < 0 ? "text-red-300" : "text-emerald-300"}`}>
                {stats.balance < 0 ? `赤字 ${formatCurrency(Math.abs(stats.balance))}` : `黒字 ${formatCurrency(stats.balance)}`}
              </p>
            </div>
            <div className={`rounded-lg border px-2 py-1.5 ${forecast.projectedBalance < 0 ? "border-red-500/40 bg-red-900/20" : "border-blue-500/30 bg-blue-900/20"}`}>
              <p className="text-[10px] text-slate-400">月末見込み（{forecast.daysElapsed}/{forecast.daysInMonth}日）</p>
              <p className={`text-sm font-semibold ${forecast.projectedBalance < 0 ? "text-red-300" : "text-blue-300"}`}>
                {forecast.projectedBalance < 0 ? `赤字見込み ${formatCurrency(Math.abs(forecast.projectedBalance))}` : `黒字見込み ${formatCurrency(forecast.projectedBalance)}`}
              </p>
            </div>
            <div className={`rounded-lg border px-2 py-1.5 ${forecast.annualProjection < 0 ? "border-red-500/40 bg-red-900/20" : "border-violet-500/30 bg-violet-900/20"}`}>
              <p className="text-[10px] text-slate-400">12か月予測（直近3か月平均）</p>
              <p className={`text-sm font-semibold ${forecast.annualProjection < 0 ? "text-red-300" : "text-violet-300"}`}>
                {forecast.annualProjection < 0 ? `年間赤字見込み ${formatCurrency(Math.abs(forecast.annualProjection))}` : `年間黒字見込み ${formatCurrency(forecast.annualProjection)}`}
              </p>
            </div>
            <div className={`rounded-lg border px-2 py-1.5 ${forecastSavings.annualSavingsProjection <= 0 ? "border-red-500/40 bg-red-900/20" : "border-sky-500/30 bg-sky-900/20"}`}>
              <p className="text-[10px] text-slate-400">将来貯金予測</p>
              <p className={`text-sm font-semibold ${forecastSavings.annualSavingsProjection <= 0 ? "text-red-300" : "text-sky-300"}`}>
                12か月 {formatCurrency(forecastSavings.annualSavingsProjection)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                赤字リスク: <span className={forecastSavings.deficitRisk === "high" ? "text-red-300" : forecastSavings.deficitRisk === "mid" ? "text-amber-300" : "text-emerald-300"}>
                  {forecastSavings.deficitRisk === "high" ? "高" : forecastSavings.deficitRisk === "mid" ? "中" : "低"}
                </span>
              </p>
            </div>
          </div>

          {/* 防衛資金 */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300">🛡 防衛資金目安</h3>
              <div className="flex gap-1">
                {(["expense", "fixed"] as const).map(b => (
                  <button key={b} type="button" onClick={() => setDefenseBasis(b)}
                    className={`px-2 py-0.5 rounded text-[10px] border ${defenseBasis === b ? "bg-violet-600 border-violet-500 text-white" : "border-slate-700 text-slate-300"}`}>
                    {b === "expense" ? "総支出" : "固定費"}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-slate-500">基準月額 {formatCurrency(defenseMonthlyBase)} ／ 最低 {formatCurrency(defenseMinimum)} ／ 推奨 {formatCurrency(defenseTarget)}</p>
            <p className={`text-sm font-semibold ${defenseShortfall > 0 ? "text-amber-300" : "text-emerald-300"}`}>
              現在 {formatCurrency(defenseFund)} ／ 不足 {formatCurrency(defenseShortfall)}
            </p>
            <p className="text-[10px] text-slate-400">到達見込み: {defenseEtaMonths === 0 ? "達成済み" : defenseEtaMonths == null ? "算出不可" : `約${defenseEtaMonths}か月（${defenseEtaDateLabel}）`}</p>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-2 rounded-full ${defenseProgress >= 100 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${defenseProgress}%` }} />
            </div>
          </div>

          {/* 改善ナビ */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-2 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300">🧭 改善ナビ</h3>
              <span className="text-[10px] text-slate-500">支出トレンド {expenseTrend.changeRate >= 0 ? `+${expenseTrend.changeRate}` : expenseTrend.changeRate}%</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {([
                { mode: "standard" as const, label: "経済標準" },
                { mode: "inflation" as const, label: "物価高対策" },
                { mode: "deficit" as const, label: "赤字改善" },
                { mode: "custom" as const, label: "カスタム" },
              ]).map(({ mode, label }) => (
                <button key={mode} type="button" onClick={() => setStrategyMode(mode)}
                  className={`text-[10px] py-1.5 rounded border transition-all ${strategyMode === mode ? "bg-violet-600 border-violet-500 text-white" : "border-slate-700 text-slate-300"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-900/40 px-2 py-1 text-xs space-y-0.5">
              <p className="font-semibold text-slate-200">{policyTargets.title}</p>
              <p className="text-[10px] text-slate-400">固定費 {policyTargets.fixed}% / 変動費 {policyTargets.variable}% / 貯蓄+投資 {policyTargets.savings}%</p>
              <p className="text-[10px] text-slate-500">{policyTargets.notes}</p>
            </div>
            <div className="space-y-1">
              {improvementNav.map((action, i) => (
                <div key={action} className="rounded-lg border border-slate-700 bg-slate-900/40 px-2 py-1 text-xs text-slate-300">
                  <span className="text-slate-500 mr-1">{i + 1}.</span>{action}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </LangContext.Provider>
  )
}
