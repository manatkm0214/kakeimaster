
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/utils";

const LANGUAGES = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국語" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
];

const LABELS = {
  ja: {
    title: "目標設定",
    nickname: "ニックネーム",
    allowanceGoal: "おこづかい目標",
    savingsGoal: "毎月の貯金目標",
    displayName: "表示名（任意）",
    income: "今月の手取り（任意）",
    save: "保存",
    start: "開始する",
    edit: "変更を保存",
    kidsTitle: "こども向け 目標設定",
    kidsDesc: "おこづかい帳や貯金の目標を決めてみよう！",
    seniorTitle: "シニア向け 目標設定",
    seniorDesc: "医療費や生活費の管理、無理のない貯金目標を設定しましょう。",
    adultTitle: "大人向け 目標設定",
    adultDesc: "毎月の貯金・固定費・変動費の目標を設定しましょう。3つの質問で自動診断もできます。",
    // ...必要に応じて追加
  },
  en: {
    title: "Goal Setup",
    nickname: "Nickname",
    allowanceGoal: "Allowance Goal",
    savingsGoal: "Monthly Savings Goal",
    displayName: "Display Name (optional)",
    income: "Net Income (optional)",
    save: "Save",
    start: "Start",
    edit: "Save Changes",
    kidsTitle: "Kids Goal Setup",
    kidsDesc: "Set goals for pocket money and savings!",
    seniorTitle: "Senior Goal Setup",
    seniorDesc: "Manage medical/living expenses and set realistic savings goals.",
    adultTitle: "Adult Goal Setup",
    adultDesc: "Set goals for savings, fixed/variable costs. Auto-diagnosis available.",
  },
  zh: {
    title: "目标设定",
    nickname: "昵称",
    allowanceGoal: "零用钱目标",
    savingsGoal: "每月储蓄目标",
    displayName: "显示名（可选）",
    income: "本月净收入（可选）",
    save: "保存",
    start: "开始",
    edit: "保存更改",
    kidsTitle: "儿童目标设定",
    kidsDesc: "设定零用钱和储蓄目标！",
    seniorTitle: "老年人目标设定",
    seniorDesc: "管理医疗/生活费，设定合理储蓄目标。",
    adultTitle: "成人目标设定",
    adultDesc: "设定储蓄、固定/变动费用目标。支持自动诊断。",
  },
  ko: {
    title: "목표 설정",
    nickname: "닉네임",
    allowanceGoal: "용돈 목표",
    savingsGoal: "월별 저축 목표",
    displayName: "표시 이름(선택)",
    income: "이번 달 순수입(선택)",
    save: "저장",
    start: "시작",
    edit: "변경 저장",
    kidsTitle: "어린이 목표 설정",
    kidsDesc: "용돈과 저축 목표를 세워보세요!",
    seniorTitle: "노인 목표 설정",
    seniorDesc: "의료/생활비 관리, 무리 없는 저축 목표 설정.",
    adultTitle: "성인 목표 설정",
    adultDesc: "저축, 고정/변동비 목표 설정. 자동 진단 지원.",
  },
  fr: {
    title: "Définition des objectifs",
    nickname: "Surnom",
    allowanceGoal: "Objectif d'argent de poche",
    savingsGoal: "Objectif d'épargne mensuel",
    displayName: "Nom affiché (facultatif)",
    income: "Revenu net ce mois (facultatif)",
    save: "Enregistrer",
    start: "Commencer",
    edit: "Enregistrer les modifications",
    kidsTitle: "Objectifs enfants",
    kidsDesc: "Définissez des objectifs d'argent de poche et d'épargne !",
    seniorTitle: "Objectifs seniors",
    seniorDesc: "Gérez les dépenses médicales/vie et fixez des objectifs d'épargne réalistes.",
    adultTitle: "Objectifs adultes",
    adultDesc: "Définissez des objectifs d'épargne, de coûts fixes/variables. Diagnostic automatique disponible.",
  },
  es: {
    title: "Configuración de objetivos",
    nickname: "Apodo",
    allowanceGoal: "Meta de mesada",
    savingsGoal: "Meta de ahorro mensual",
    displayName: "Nombre mostrado (opcional)",
    income: "Ingresos netos este mes (opcional)",
    save: "Guardar",
    start: "Comenzar",
    edit: "Guardar cambios",
    kidsTitle: "Meta para niños",
    kidsDesc: "¡Establece metas para la mesada y el ahorro!",
    seniorTitle: "Meta para mayores",
    seniorDesc: "Gestiona gastos médicos/vivienda y fija metas realistas de ahorro.",
    adultTitle: "Meta para adultos",
    adultDesc: "Establece metas de ahorro, gastos fijos/variables. Diagnóstico automático disponible.",
  },
};

export default function PresetSetup({ onComplete, initialProfile = null, onCancel, mode = "create" }) {
  const [lang, setLang] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("kakeibo-lang") || "ja";
    }
    return "ja";
  });
  const T = LABELS[lang] || LABELS.ja;
  // ...既存のuseStateやロジックは省略（必要に応じて追加）

  // 言語切替
  const handleLangChange = (code) => {
    setLang(code);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("kakeibo-lang", code);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-xl shadow p-6 mt-8 flex flex-col gap-4">
      <div className="flex gap-2 mb-4 justify-end">
        {LANGUAGES.map(l => (
          <button
            key={l.code}
            onClick={() => handleLangChange(l.code)}
            className={`px-2 py-1 rounded border text-xs ${lang === l.code ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"}`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <h2 className="text-xl font-bold mb-2 text-violet-700 dark:text-violet-300">{T.title}</h2>
      <p className="mb-4 text-slate-700 dark:text-slate-300">{T.adultDesc}</p>
      {/* ここに既存のフォームUIやロジックを移植・整理して配置（例: 入力欄、診断ボタン、保存ボタンなど） */}
      {/* ... */}
      <div className="mt-8 flex flex-wrap gap-2 justify-center text-xs">
        <a href="/privacy" className="underline text-slate-500 hover:text-emerald-500">プライバシー</a>
        <a href="/terms" className="underline text-slate-500 hover:text-emerald-500">利用規約</a>
        <a href="/contact" className="underline text-slate-500 hover:text-emerald-500">お問い合わせ</a>
      </div>
    </div>
  );
}
  },
  ko: {
    title: "목표 설정",
    selectAge: "연령대 선택",
    normal: "일반(성인)",
    kids: "어린이",
    senior: "노인",
    displayName: "표시 이름",
    nickname: "닉네임",
    allowanceGoal: "용돈 목표",
    savingsGoal: "월별 저축 목표",
    save: "저장",
    dashboardKids: "어린이 대시보드",
    dashboardSenior: "노인 대시보드",
    transactionCount: "거래 수",
    exampleName: "예: 타로",
    exampleSeniorName: "예: 사토",
    exampleAllowance: "예: 1000",
    exampleSavings: "예: 10000"
  },
  fr: {
    title: "Définition des objectifs",
    selectAge: "Sélectionnez le groupe d'âge",
    normal: "Normal (Adulte)",
    kids: "Enfants",
    senior: "Seniors",
    displayName: "Nom affiché",
    nickname: "Surnom",
    allowanceGoal: "Objectif d'argent de poche",
    savingsGoal: "Objectif d'épargne mensuel",
    save: "Enregistrer",
    dashboardKids: "Tableau de bord enfants",
    dashboardSenior: "Tableau de bord seniors",
    transactionCount: "Transactions",
    exampleName: "ex: Taro",
    exampleSeniorName: "ex: Sato",
    exampleAllowance: "ex: 1000",
    exampleSavings: "ex: 10000"
  },
  es: {
    title: "Configuración de objetivos",
    selectAge: "Seleccionar grupo de edad",
    normal: "Normal (Adulto)",
    kids: "Niños",
    senior: "Mayores",
    displayName: "Nombre mostrado",
    nickname: "Apodo",
    allowanceGoal: "Meta de mesada",
    savingsGoal: "Meta de ahorro mensual",
    save: "Guardar",
    dashboardKids: "Panel de niños",
    dashboardSenior: "Panel de mayores",
    transactionCount: "Transacciones",
    exampleName: "ej: Taro",
    exampleSeniorName: "ej: Sato",
    exampleAllowance: "ej: 1000",
    exampleSavings: "ej: 10000"
  },
};
const T = LABELS[LANG];

interface Props {
  onComplete: (profile: Profile) => void
  initialProfile?: Profile | null
  onCancel?: () => void
  mode?: "create" | "edit"
}

const MONEY_UNITS = [
  { label: "円", factor: 1 },
  { label: "千円", factor: 1000 },
  { label: "万円", factor: 10000 },
] as const

export default function PresetSetup({ onComplete, initialProfile = null, onCancel, mode = "create" }: Props) {
  // 年代選択（通常/こども/シニア）
  const [ageGroup, setAgeGroup] = useState<'normal' | 'kids' | 'senior'>("normal");
  // 外部からageGroupをpropsで受け取れるように
  // @ts-ignore
  const externalAgeGroup = (typeof (props as any)?.ageGroup === "string") ? (props as any).ageGroup : undefined;
  // 外部指定があれば優先
  const effectiveAgeGroup = externalAgeGroup || ageGroup;
  // 言語自動判定
  type LangKey = keyof typeof LABELS;
  const lang = (typeof window !== "undefined" && window.localStorage.getItem("kakeibo-lang")) as LangKey || "ja";
  const TT = LABELS[lang] || LABELS.ja;

  // 年代ごとの説明文・目安
  const AGE_INFO = {
    normal: {
      label: T.normal,
      desc: LANG === "en" ? "Recommended for adults and working generations." : "大人・社会人向けの標準設定です。",
      example: LANG === "en" ? "Set goals for monthly savings, fixed/variable costs, etc." : "毎月の貯金や固定費・変動費の目標を設定できます。",
      fontSize: "text-lg font-bold"
    },
    kids: {
      label: T.kids,
      desc: LANG === "en" ? "For elementary and junior high students." : "小学生・中学生向け。",
      example: LANG === "en" ? "Set goals for pocket money, savings, and spending habits." : "おこづかい・貯金・使い方の目標を設定できます。",
      fontSize: "text-base"
    },
    senior: {
      label: T.senior,
      desc: LANG === "en" ? "For seniors (60+). Large text for easy reading." : "シニア（60歳以上）向け。大きな文字で見やすく。",
      example: LANG === "en" ? "Set goals for retirement funds, medical expenses, etc." : "老後資金や医療費の管理目標など。",
      fontSize: "text-2xl font-bold"
    }
  };
  const [displayName, setDisplayName] = useState(initialProfile?.display_name ?? "")
  const [takeHome, setTakeHome] = useState(() => {
    if (typeof initialProfile?.allocation_take_home === "number" && initialProfile.allocation_take_home > 0) {
      return String(initialProfile.allocation_take_home)
    }
    return ""
  })
  const [fixedRate, setFixedRate] = useState(String(initialProfile?.allocation_target_fixed_rate ?? 35))
  const [variableRate, setVariableRate] = useState(String(initialProfile?.allocation_target_variable_rate ?? 25))
  const [savingsRate, setSavingsRate] = useState(String(initialProfile?.allocation_target_savings_rate ?? 20))
  const [takeHomeUnit, setTakeHomeUnit] = useState(1)
  const [savingsGoalUnit, setSavingsGoalUnit] = useState(1)
  const [monthlySavingsGoal, setMonthlySavingsGoal] = useState(() => {
    if (typeof window === "undefined") return ""
    const raw = window.localStorage.getItem("kakeibo-savings-goal")
    const parsed = Number(raw || 0)
    return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : ""
  })
  const [categoryAllocation, setCategoryAllocation] = useState<Record<string, string>>({
    "住居": "35",
    "食費": "20",
    "水道光熱": "10",
    "通信": "6",
    "交通": "8",
    "日用品": "8",
    "娯楽": "8",
    "教育": "3",
    "その他": "2",
  })
  const [accentPreset, setAccentPreset] = useState<"balanced" | "defense" | "growth">(() => {
    if (typeof window === "undefined") return "balanced"
    const saved = window.localStorage.getItem("kakeibo-accent")
    return saved === "defense" || saved === "growth" || saved === "balanced" ? saved : "balanced"
  })
  const [monthlyBalanceLevel, setMonthlyBalanceLevel] = useState<"plus" | "zero" | "minus">("zero")
  const [bufferLevel, setBufferLevel] = useState<"low" | "mid" | "high">("mid")
  const [inflationPressure, setInflationPressure] = useState<"low" | "mid" | "high">("mid")
  const [diagnosisDetail, setDiagnosisDetail] = useState<{
    mode: "standard" | "inflation" | "deficit"
    total: number
    balanceScore: number
    bufferScore: number
    inflationScore: number
    reason: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)

  useEffect(() => {
    const savedTakeHome = Number(takeHome || 0)
    if (savedTakeHome > 0 && takeHomeUnit === 1) {
      if (savedTakeHome >= 100000) {
        setTakeHomeUnit(10000)
        setTakeHome(String(Math.round((savedTakeHome / 10000) * 10) / 10))
      } else if (savedTakeHome >= 1000) {
        setTakeHomeUnit(1000)
        setTakeHome(String(Math.round((savedTakeHome / 1000) * 10) / 10))
      }
    }

    const savedGoal = Number(monthlySavingsGoal || 0)
    if (savedGoal > 0 && savingsGoalUnit === 1) {
      if (savedGoal >= 100000) {
        setSavingsGoalUnit(10000)
        setMonthlySavingsGoal(String(Math.round((savedGoal / 10000) * 10) / 10))
      } else if (savedGoal >= 1000) {
        setSavingsGoalUnit(1000)
        setMonthlySavingsGoal(String(Math.round((savedGoal / 1000) * 10) / 10))
      }
    }
    // 初回表示時のみ単位を補正
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const strategyLabel = useMemo(() => {
    if (accentPreset === "balanced") return "経済標準/バランス"
    if (accentPreset === "defense") return "物価高対策/守り重視"
    return "赤字改善/成長重視"
  }, [accentPreset])

  const rateTotal = useMemo(() => {
    return [fixedRate, variableRate, savingsRate].reduce((sum, value) => sum + Number(value || 0), 0)
  }, [fixedRate, savingsRate, variableRate])

  const categoryTotal = useMemo(() => {
    return Object.values(categoryAllocation).reduce((sum, value) => sum + Number(value || 0), 0)
  }, [categoryAllocation])

  function clampPercent(value: string): number {
    return Math.min(100, Math.max(0, Number(value || 0)))
  }

  function applyAccent(next: "balanced" | "defense" | "growth") {
    setAccentPreset(next)
    if (typeof window === "undefined") return
    window.localStorage.setItem("kakeibo-accent", next)
    document.documentElement.setAttribute("data-accent", next)
  }

  function switchTakeHomeUnit(nextUnit: number) {
    if (nextUnit === takeHomeUnit) return
    const raw = Number(takeHome || 0)
    if (!Number.isFinite(raw) || raw <= 0) {
      setTakeHomeUnit(nextUnit)
      return
    }
    const normalized = raw * takeHomeUnit
    const converted = normalized / nextUnit
    setTakeHome(String(Math.round(converted * 10) / 10))
    setTakeHomeUnit(nextUnit)
  }

  function switchSavingsGoalUnit(nextUnit: number) {
    if (nextUnit === savingsGoalUnit) return
    const raw = Number(monthlySavingsGoal || 0)
    if (!Number.isFinite(raw) || raw <= 0) {
      setSavingsGoalUnit(nextUnit)
      return
    }
    const normalized = raw * savingsGoalUnit
    const converted = normalized / nextUnit
    setMonthlySavingsGoal(String(Math.round(converted * 10) / 10))
    setSavingsGoalUnit(nextUnit)
  }

  async function handleCreateProfile(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const normalizedTakeHome = Number(takeHome || 0) * takeHomeUnit;
      const normalizedSavingsGoal = Number(monthlySavingsGoal || 0) * savingsGoalUnit;
      const allocationTargetFixedRate = clampPercent(fixedRate);
      const allocationTargetVariableRate = clampPercent(variableRate);
      const allocationTargetSavingsRate = clampPercent(savingsRate);
      setMessage(null);
      if (rateTotal > 100) {
        setMessage({ type: "error", text: "配分割合の合計は100%以下にしてください" });
        return;
      }
      if (categoryTotal !== 100) {
        setMessage({ type: "error", text: "カテゴリ別配分の合計は100%にしてください" });
        return;
      }
      if (takeHome && (!Number.isFinite(normalizedTakeHome) || normalizedTakeHome <= 0)) {
        setMessage({ type: "error", text: "手取りは1以上の数値で入力してください" });
        return;
      }
      if (monthlySavingsGoal && (!Number.isFinite(normalizedSavingsGoal) || normalizedSavingsGoal < 0)) {
        setMessage({ type: "error", text: "貯金目標は0以上の数値で入力してください" });
        return;
      }
      // Profile payload
      const profilePayload: Partial<Profile> = {
        display_name: displayName,
        allocation_take_home: normalizedTakeHome,
        allocation_target_fixed_rate: allocationTargetFixedRate,
        allocation_target_variable_rate: allocationTargetVariableRate,
        allocation_target_savings_rate: allocationTargetSavingsRate,
      };
      const { data, error } = await supabase
        .from("profiles")
        .upsert(profilePayload, { onConflict: "id" })
        .select()
        .single();
      if (error) {
        setMessage({ type: "error", text: "プロフィール作成に失敗しました: " + error.message });
        return;
      }
      // カテゴリ別配分を今月予算へ反映
      if (normalizedTakeHome > 0) {
        const month = new Date().toISOString().slice(0, 7);
        const expenseTarget = Math.max(0, Math.round((normalizedTakeHome * (allocationTargetFixedRate + allocationTargetVariableRate)) / 100));
        const budgetRows = Object.entries(categoryAllocation).map(([category, ratio]) => ({
          user_id: data.id,
          category,
          month,
          amount: Math.max(1, Math.round((expenseTarget * Number(ratio || 0)) / 100)),
        }));
        const { error: budgetError } = await supabase
          .from("budgets")
          .upsert(budgetRows, { onConflict: "user_id,category,month" });
        if (budgetError) {
          setMessage({ type: "error", text: "カテゴリ予算の保存に失敗しました: " + budgetError.message });
          return;
        }
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem("kakeibo-savings-goal", String(Math.round(normalizedSavingsGoal || 0)));
        window.localStorage.setItem("kakeibo-accent", accentPreset);
        document.documentElement.setAttribute("data-accent", accentPreset);
        window.dispatchEvent(new Event("kakeibo-goals-updated"));
      }
      setMessage({ type: "success", text: "初期設定を保存しました" });
      if (onComplete) onComplete(data);
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(name: "balanced" | "defense" | "growth") {
    if (name === "balanced") {
      applyAccent("balanced")
      if (typeof window !== "undefined") {
        window.localStorage.setItem("kakeibo-strategy-mode", "standard")
      }
      setFixedRate("35")
      setVariableRate("25")
      setSavingsRate("20")
      setCategoryAllocation({ "住居": "35", "食費": "20", "水道光熱": "10", "通信": "6", "交通": "8", "日用品": "8", "娯楽": "8", "教育": "3", "その他": "2" })
      return
    }
    if (name === "defense") {
      applyAccent("defense")
      if (typeof window !== "undefined") {
        window.localStorage.setItem("kakeibo-strategy-mode", "inflation")
      }
      setFixedRate("33")
      setVariableRate("20")
      setSavingsRate("30")
      setCategoryAllocation({ "住居": "38", "食費": "18", "水道光熱": "10", "通信": "6", "交通": "8", "日用品": "8", "娯楽": "5", "教育": "3", "その他": "4" })
      return
    }
    applyAccent("growth")
    if (typeof window !== "undefined") {
      window.localStorage.setItem("kakeibo-strategy-mode", "deficit")
    }
    setFixedRate("30")
    setVariableRate("25")
    setSavingsRate("30")
    setCategoryAllocation({ "住居": "32", "食費": "18", "水道光熱": "9", "通信": "6", "交通": "8", "日用品": "7", "娯楽": "10", "教育": "6", "その他": "4" })
  }

  function applyCustomMode() {
    setDiagnosisDetail(null)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("kakeibo-strategy-mode", "custom")
    }
    setMessage({ type: "success", text: "カスタムモードを選択しました。下の配分を自由に調整して保存できます。" })
  }

  function autoSelectModeBy3Questions() {
    const deficitScore = monthlyBalanceLevel === "minus" ? 2 : monthlyBalanceLevel === "zero" ? 1 : 0
    const bufferScore = bufferLevel === "low" ? 2 : bufferLevel === "mid" ? 1 : 0
    const inflationScore = inflationPressure === "high" ? 2 : inflationPressure === "mid" ? 1 : 0
    const total = deficitScore + bufferScore + inflationScore

    if (monthlyBalanceLevel === "minus" || total >= 5) {
      applyPreset("growth")
      if (typeof window !== "undefined") {
        window.localStorage.setItem("kakeibo-strategy-mode", "deficit")
      }
      setDiagnosisDetail({
        mode: "deficit",
        total,
        balanceScore: deficitScore,
        bufferScore,
        inflationScore,
        reason: "赤字または高リスク判定（合計5点以上）のため、赤字改善を推奨",
      })
      setMessage({ type: "success", text: "診断結果: 赤字改善/成長重視 を自動選択しました。" })
      return
    }

    if (inflationPressure === "high" || total >= 3) {
      applyPreset("defense")
      if (typeof window !== "undefined") {
        window.localStorage.setItem("kakeibo-strategy-mode", "inflation")
      }
      setDiagnosisDetail({
        mode: "inflation",
        total,
        balanceScore: deficitScore,
        bufferScore,
        inflationScore,
        reason: "物価高圧力が高い、または中リスク判定（合計3点以上）のため、守り重視を推奨",
      })
      setMessage({ type: "success", text: "診断結果: 物価高対策/守り重視 を自動選択しました。" })
      return
    }

    applyPreset("balanced")
    if (typeof window !== "undefined") {
      window.localStorage.setItem("kakeibo-strategy-mode", "standard")
    }
    setDiagnosisDetail({
      mode: "standard",
      total,
      balanceScore: deficitScore,
      bufferScore,
      inflationScore,
      reason: "低リスク判定（合計2点以下）のため、経済標準を推奨",
    })
    setMessage({ type: "success", text: "診断結果: 経済標準/バランス を自動選択しました。" })
  }

  // 年代ごとにUI分岐
  if (effectiveAgeGroup === "kids") {
    return (
      <form className="w-full max-w-md mx-auto bg-pink-50 rounded-xl shadow p-6 mt-8 flex flex-col gap-4" onSubmit={handleCreateProfile}>
        <h2 className="text-xl font-bold mb-2 text-pink-700">こども向け 目標設定</h2>
        <p className="mb-4 text-pink-800">おこづかい帳や貯金の目標を決めてみよう！</p>
        <ul className="list-disc pl-5 mb-4 text-pink-700">
          <li>ほしいもののために貯金しよう</li>
          <li>おこづかい帳をつけてみよう</li>
          <li>使いすぎに注意しよう</li>
        </ul>
        <label className="block mb-4">
          <span className="font-bold">ニックネーム</span>
          <input type="text" className="mt-1 block w-full rounded border px-3 py-2" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="例: たろう" />
        </label>
        <label className="block mb-4">
          <span className="font-bold">おこづかい目標</span>
          <input type="number" className="mt-1 block w-full rounded border px-3 py-2" value={monthlySavingsGoal} onChange={e => setMonthlySavingsGoal(e.target.value)} placeholder="例: 1000" />
        </label>
        <button type="submit" className="w-full py-3 bg-pink-500 hover:bg-pink-400 text-white rounded-xl font-bold">保存</button>
        {message && <p className={`mt-2 text-sm ${message.type === "error" ? "text-red-500" : "text-emerald-500"}`}>{message.text}</p>}
      </form>
    );
  }
  if (effectiveAgeGroup === "senior") {
    return (
      <form className="w-full max-w-md mx-auto bg-blue-50 rounded-xl shadow p-6 mt-8 flex flex-col gap-4" onSubmit={handleCreateProfile}>
        <h2 className="text-2xl font-bold mb-2 text-blue-700" style={{fontSize: "2rem"}}>シニア向け 目標設定</h2>
        <p className="mb-4 text-blue-800 text-lg">医療費や生活費の管理、無理のない貯金目標を設定しましょう。</p>
        <ul className="list-disc pl-5 mb-4 text-blue-700 text-lg">
          <li>医療費や生活費の管理をしっかり</li>
          <li>無理のない貯金目標を設定</li>
          <li>大きな文字で見やすく配慮</li>
        </ul>
        <label className="block mb-4">
          <span className="font-bold text-lg">ニックネーム</span>
          <input type="text" className="mt-1 block w-full rounded border px-3 py-2 text-lg" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="例: さとう" />
        </label>
        <label className="block mb-4">
          <span className="font-bold text-lg">毎月の貯金目標</span>
          <input type="number" className="mt-1 block w-full rounded border px-3 py-2 text-lg" value={monthlySavingsGoal} onChange={e => setMonthlySavingsGoal(e.target.value)} placeholder="例: 10000" />
        </label>
        <button type="submit" className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold text-lg">保存</button>
        {message && <p className={`mt-2 text-sm ${message.type === "error" ? "text-red-500" : "text-emerald-500"}`}>{message.text}</p>}
      </form>
    );
  }

  // 大人向けは見やすいUIUX強化
  return (
    <div>
      <form className="min-h-screen bg-slate-950 flex items-center justify-center p-4" onSubmit={handleCreateProfile}>
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow p-8 space-y-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-2 text-violet-700 dark:text-violet-300">大人向け 目標設定</h2>
          <p className="text-base text-slate-700 dark:text-slate-300 mb-4">毎月の貯金・固定費・変動費の目標を設定しましょう。3つの質問で自動診断もできます。</p>
          <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-300">質問3つで自動判定</p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <label className="text-slate-400">
                1. 直近の月次収支は？
                <select
                  value={monthlyBalanceLevel}
                  onChange={(e) => setMonthlyBalanceLevel(e.target.value as "plus" | "zero" | "minus")}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2"
                >
                  <option value="plus">黒字</option>
                  <option value="zero">ほぼトントン</option>
                  <option value="minus">赤字</option>
                </select>
              </label>
              <label className="text-slate-400">
                2. 生活防衛資金（現金）は？
                <select
                  value={bufferLevel}
                  onChange={(e) => setBufferLevel(e.target.value as "low" | "mid" | "high")}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2"
                >
                  <option value="low">1か月未満</option>
                  <option value="mid">1〜3か月</option>
                  <option value="high">3か月以上</option>
                </select>
              </label>
              <label className="text-slate-400">
                3. 物価高の負担感は？
                <select
                  value={inflationPressure}
                  onChange={(e) => setInflationPressure(e.target.value as "low" | "mid" | "high")}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2"
                >
                  <option value="low">低い</option>
                  <option value="mid">やや高い</option>
                  <option value="high">高い</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={autoSelectModeBy3Questions}
              className="w-full py-2 text-xs rounded-lg bg-blue-700 hover:bg-blue-600"
            >
              3問で最適モードを自動選択
            </button>
            <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3 text-[11px] text-slate-300 space-y-1">
              <p className="font-semibold text-slate-200">点数基準（凡例）</p>
              <p>月次収支: 黒字 0点 / トントン 1点 / 赤字 2点</p>
              <p>防衛資金: 3か月以上 0点 / 1〜3か月 1点 / 1か月未満 2点</p>
              <p>物価高負担: 低い 0点 / やや高い 1点 / 高い 2点</p>
              <p>合計 0〜2点: 経済標準 / 3〜4点: 物価高対策 / 5〜6点: 赤字改善</p>
              <p>補足: 月次収支が赤字なら、合計点に関係なく赤字改善を優先します。</p>
            </div>
            {diagnosisDetail && (
              <div className="rounded-lg border border-blue-700/50 bg-blue-900/20 p-3 text-xs text-blue-100 space-y-1">
                <p className="font-semibold">診断根拠（スコア内訳）</p>
                <p>月次収支: {diagnosisDetail?.balanceScore}点 / 防衛資金: {diagnosisDetail?.bufferScore}点 / 物価高負担: {diagnosisDetail?.inflationScore}点</p>
                <p>合計: {diagnosisDetail?.total}点</p>
                <p>判定: {diagnosisDetail?.mode === "standard" ? "経済標準" : diagnosisDetail?.mode === "inflation" ? "物価高対策" : "赤字改善"}</p>
                <p className="text-blue-200">理由: {diagnosisDetail?.reason}</p>
              </div>
            )}
          </div>
          {message && (
            <div className={`rounded-xl px-4 py-3 text-xs leading-relaxed ${
              message?.type === "success"
                ? "bg-emerald-900/50 border border-emerald-700/60 text-emerald-200 animate-success-bounce"
                : "bg-red-900/50 border border-red-700/60 text-red-200"
            }`}>
              {message?.text}
            </div>
          )}
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="表示名（任意）"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
          />
          <div className="space-y-2">
            <p className="text-xs text-slate-400">今月の手取り（任意）</p>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={takeHome}
                onChange={e => setTakeHome(e.target.value)}
                placeholder="金額"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
              />
              <div className="flex gap-1">
                {MONEY_UNITS.map((u) => (
                  <button
                    key={u.label}
                    type="button"
                    onClick={() => switchTakeHomeUnit(u.factor)}
                    className={`px-3 py-3 rounded-xl text-xs border transition-all ${
                      takeHomeUnit === u.factor
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-slate-900 border-slate-700 text-slate-300"
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-400">毎月の貯金目標</p>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={monthlySavingsGoal}
                onChange={e => setMonthlySavingsGoal(e.target.value)}
                placeholder="金額"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
              />
              <div className="flex gap-1">
                {MONEY_UNITS.map((u) => (
                  <button
                    key={u.label}
                    type="button"
                    onClick={() => switchSavingsGoalUnit(u.factor)}
                    className={`px-3 py-3 rounded-xl text-xs border transition-all ${
                      savingsGoalUnit === u.factor
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-slate-900 border-slate-700 text-slate-300"
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => applyAccent("balanced")} className={`py-2 text-[11px] rounded-xl border ${accentPreset === "balanced" ? "bg-violet-600/20 border-violet-500" : "bg-slate-900 border-slate-700"}`}>
              色:経済標準
            </button>
            <button type="button" onClick={() => applyAccent("defense")} className={`py-2 text-[11px] rounded-xl border ${accentPreset === "defense" ? "bg-emerald-600/20 border-emerald-500" : "bg-slate-900 border-slate-700"}`}>
              色:物価高
            </button>
            <button type="button" onClick={() => applyAccent("growth")} className={`py-2 text-[11px] rounded-xl border ${accentPreset === "growth" ? "bg-amber-600/20 border-amber-500" : "bg-slate-900 border-slate-700"}`}>
              色:赤字改善
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs text-slate-400">
              固定費
              <input
                type="number"
                min={0}
                max={100}
                value={fixedRate}
                onChange={e => setFixedRate(e.target.value)}
                className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500"
              />
            </label>
            <label className="text-xs text-slate-400">
              変動費
              <input
                type="number"
                min={0}
                max={100}
                value={variableRate}
                onChange={e => setVariableRate(e.target.value)}
                className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500"
              />
            </label>
            <label className="text-xs text-slate-400">
              貯蓄+投資
              <input
                type="number"
                min={0}
                max={100}
                value={savingsRate}
                onChange={e => setSavingsRate(e.target.value)}
                className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500"
              />
            </label>
          </div>
          <p className={`text-xs ${rateTotal > 100 ? "text-red-300" : "text-slate-400"}`}>
            配分合計: {rateTotal}%
          </p>
          <div className="space-y-2">
            <p className="text-xs text-slate-400">カテゴリ別配分（支出予算の内訳）</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(categoryAllocation).map(([category, ratio]) => (
                <label key={category} className="text-[11px] text-slate-400">
                  {category}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={ratio}
                    onChange={e => setCategoryAllocation(prev => ({ ...prev, [category]: e.target.value }))}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-violet-500"
                  />
                </label>
              ))}
            </div>
            <p className={`text-xs ${categoryTotal === 100 ? "text-slate-400" : "text-red-300"}`}>
              カテゴリ合計: {categoryTotal}%
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || rateTotal > 100 || categoryTotal !== 100}
            className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl font-bold"
          >
            {loading ? "保存中..." : mode === "edit" ? "変更を保存" : "開始する"}
          </button>
          {/* 利用規約・プライバシー・問い合わせリンク */}
          <div className="flex flex-wrap gap-2 justify-center mt-4 text-xs">
            <a href="/privacy" className="underline text-slate-500 hover:text-emerald-500">プライバシー</a>
            <a href="/terms" className="underline text-slate-500 hover:text-emerald-500">利用規約</a>
            <a href="/contact" className="underline text-slate-500 hover:text-emerald-500">お問い合わせ</a>
          </div>
        </div>
      </form>
    </div>
  );

        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-300">質問3つで自動判定</p>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <label className="text-slate-400">
              1. 直近の月次収支は？
              <select
                value={monthlyBalanceLevel}
                onChange={(e) => setMonthlyBalanceLevel(e.target.value as "plus" | "zero" | "minus")}
                className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2"
              >
                <option value="plus">黒字</option>
                <option value="zero">ほぼトントン</option>
                <option value="minus">赤字</option>
              </select>
            </label>
            <label className="text-slate-400">
              2. 生活防衛資金（現金）は？
              <select
                value={bufferLevel}
                onChange={(e) => setBufferLevel(e.target.value as "low" | "mid" | "high")}
                className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2"
              >
                <option value="low">1か月未満</option>
                <option value="mid">1〜3か月</option>
                <option value="high">3か月以上</option>
              </select>
            </label>
            <label className="text-slate-400">
              3. 物価高の負担感は？
              <select
                value={inflationPressure}
                onChange={(e) => setInflationPressure(e.target.value as "low" | "mid" | "high")}
                className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2"
              >
                <option value="low">低い</option>
                <option value="mid">やや高い</option>
                <option value="high">高い</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={autoSelectModeBy3Questions}
            className="w-full py-2 text-xs rounded-lg bg-blue-700 hover:bg-blue-600"
          >
            3問で最適モードを自動選択
          </button>

          <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3 text-[11px] text-slate-300 space-y-1">
            <p className="font-semibold text-slate-200">点数基準（凡例）</p>
            <p>月次収支: 黒字 0点 / トントン 1点 / 赤字 2点</p>
            <p>防衛資金: 3か月以上 0点 / 1〜3か月 1点 / 1か月未満 2点</p>
            <p>物価高負担: 低い 0点 / やや高い 1点 / 高い 2点</p>
            <p>合計 0〜2点: 経済標準 / 3〜4点: 物価高対策 / 5〜6点: 赤字改善</p>
            <p>補足: 月次収支が赤字なら、合計点に関係なく赤字改善を優先します。</p>
          </div>

          {diagnosisDetail && (
            <div className="rounded-lg border border-blue-700/50 bg-blue-900/20 p-3 text-xs text-blue-100 space-y-1">
              <p className="font-semibold">診断根拠（スコア内訳）</p>
              <p>月次収支: {diagnosisDetail.balanceScore}点 / 防衛資金: {diagnosisDetail.bufferScore}点 / 物価高負担: {diagnosisDetail.inflationScore}点</p>
              <p>合計: {diagnosisDetail.total}点</p>
              <p>判定: {diagnosisDetail.mode === "standard" ? "経済標準" : diagnosisDetail.mode === "inflation" ? "物価高対策" : "赤字改善"}</p>
              <p className="text-blue-200">理由: {diagnosisDetail.reason}</p>
            </div>
          )}
        </div>

        {message && (
          <div className={`rounded-xl px-4 py-3 text-xs leading-relaxed ${
            message.type === "success"
              ? "bg-emerald-900/50 border border-emerald-700/60 text-emerald-200 animate-success-bounce"
              : "bg-red-900/50 border border-red-700/60 text-red-200"
          }`}>
            {message.text}
          </div>
        )}

        <input
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="表示名（任意）"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
        />

        <div className="space-y-2">
          <p className="text-xs text-slate-400">今月の手取り（任意）</p>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={takeHome}
              onChange={e => setTakeHome(e.target.value)}
              placeholder="金額"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
            />
            <div className="flex gap-1">
              {MONEY_UNITS.map((u) => (
                <button
                  key={u.label}
                  type="button"
                  onClick={() => switchTakeHomeUnit(u.factor)}
                  className={`px-3 py-3 rounded-xl text-xs border transition-all ${
                    takeHomeUnit === u.factor
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-slate-900 border-slate-700 text-slate-300"
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-400">毎月の貯金目標</p>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={monthlySavingsGoal}
              onChange={e => setMonthlySavingsGoal(e.target.value)}
              placeholder="金額"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
            />
            <div className="flex gap-1">
              {MONEY_UNITS.map((u) => (
                <button
                  key={u.label}
                  type="button"
                  onClick={() => switchSavingsGoalUnit(u.factor)}
                  className={`px-3 py-3 rounded-xl text-xs border transition-all ${
                    savingsGoalUnit === u.factor
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-slate-900 border-slate-700 text-slate-300"
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => applyAccent("balanced")} className={`py-2 text-[11px] rounded-xl border ${accentPreset === "balanced" ? "bg-violet-600/20 border-violet-500" : "bg-slate-900 border-slate-700"}`}>
            色:経済標準
          </button>
          <button type="button" onClick={() => applyAccent("defense")} className={`py-2 text-[11px] rounded-xl border ${accentPreset === "defense" ? "bg-emerald-600/20 border-emerald-500" : "bg-slate-900 border-slate-700"}`}>
            色:物価高
          </button>
          <button type="button" onClick={() => applyAccent("growth")} className={`py-2 text-[11px] rounded-xl border ${accentPreset === "growth" ? "bg-amber-600/20 border-amber-500" : "bg-slate-900 border-slate-700"}`}>
            色:赤字改善
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <label className="text-xs text-slate-400">
            固定費
            <input
              type="number"
              min={0}
              max={100}
              value={fixedRate}
              onChange={e => setFixedRate(e.target.value)}
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="text-xs text-slate-400">
            変動費
            <input
              type="number"
              min={0}
              max={100}
              value={variableRate}
              onChange={e => setVariableRate(e.target.value)}
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500"
            />
          </label>
          <label className="text-xs text-slate-400">
            貯蓄+投資
            <input
              type="number"
              min={0}
              max={100}
              value={savingsRate}
              onChange={e => setSavingsRate(e.target.value)}
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-violet-500"
            />
          </label>
        </div>

        <p className={`text-xs ${rateTotal > 100 ? "text-red-300" : "text-slate-400"}`}>
          配分合計: {rateTotal}%
        </p>

        <div className="space-y-2">
          <p className="text-xs text-slate-400">カテゴリ別配分（支出予算の内訳）</p>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(categoryAllocation).map(([category, ratio]) => (
              <label key={category} className="text-[11px] text-slate-400">
                {category}
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={ratio}
                  onChange={e => setCategoryAllocation(prev => ({ ...prev, [category]: e.target.value }))}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-violet-500"
                />
              </label>
            ))}
          </div>
          <p className={`text-xs ${categoryTotal === 100 ? "text-slate-400" : "text-red-300"}`}>
            カテゴリ合計: {categoryTotal}%
          </p>
        </div>

        <button
          onClick={handleCreateProfile}
          disabled={loading || rateTotal > 100 || categoryTotal !== 100}
          className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl font-bold"
        >
          {loading ? "保存中..." : mode === "edit" ? "変更を保存" : "開始する"}
        </button>
      </div>

      {/* 利用規約・プライバシー・問い合わせリンク */}
      <div className="flex flex-wrap gap-2 justify-center mt-4 text-xs">
        <a href="/privacy" className="underline text-slate-500 hover:text-emerald-500">プライバシー</a>
        <a href="/terms" className="underline text-slate-500 hover:text-emerald-500">利用規約</a>
        <a href="/contact" className="underline text-slate-500 hover:text-emerald-500">お問い合わせ</a>
      </div>
    </div>
  )
}
