"use client";

import { useState } from "react";

const LANGUAGES = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "ko", label: "한국語" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
];

type LangKey = keyof typeof LABELS;

const LABELS = {
  ja: {
    title: "目標設定",
    steps: ["ニックネーム", "今月の手取り", "毎月の貯金目標", "カテゴリごとの目標設定", "確認・保存"],
    next: "次へ",
    prev: "戻る",
    save: "保存",
    nickname: "ニックネーム",
    income: "今月の手取り（任意）",
    savingsGoal: "毎月の貯金目標",
    categories: "カテゴリごとの目標設定",
    confirm: "内容を確認して保存してください",
    done: "保存しました！",
  },
  en: {
    title: "Goal Setup",
    steps: ["Nickname", "Net Income", "Monthly Savings Goal", "Category Goals", "Confirm & Save"],
    next: "Next",
    prev: "Back",
    save: "Save",
    nickname: "Nickname",
    income: "Net Income (optional)",
    savingsGoal: "Monthly Savings Goal",
    categories: "Category Goals",
    confirm: "Please confirm and save your settings.",
    done: "Saved!",
  },
  zh: {
    title: "目标设定",
    steps: ["昵称", "本月净收入", "每月储蓄目标", "类别目标", "确认并保存"],
    next: "下一步",
    prev: "返回",
    save: "保存",
    nickname: "昵称",
    income: "本月净收入（可选）",
    savingsGoal: "每月储蓄目标",
    categories: "类别目标",
    confirm: "请确认并保存设置。",
    done: "已保存！",
  },
  ko: {
    title: "목표 설정",
    steps: ["닉네임", "이번 달 순수입", "월별 저축 목표", "카테고리 목표", "확인 및 저장"],
    next: "다음",
    prev: "뒤로",
    save: "저장",
    nickname: "닉네임",
    income: "이번 달 순수입(선택)",
    savingsGoal: "월별 저축 목표",
    categories: "카테고리 목표",
    confirm: "내용을 확인하고 저장하세요.",
    done: "저장되었습니다!",
  },
  fr: {
    title: "Définition des objectifs",
    steps: ["Surnom", "Revenu net", "Objectif d'épargne", "Objectifs par catégorie", "Confirmer & Enregistrer"],
    next: "Suivant",
    prev: "Retour",
    save: "Enregistrer",
    nickname: "Surnom",
    income: "Revenu net ce mois (facultatif)",
    savingsGoal: "Objectif d'épargne mensuel",
    categories: "Objectifs par catégorie",
    confirm: "Veuillez confirmer et enregistrer vos paramètres.",
    done: "Enregistré !",
  },
  es: {
    title: "Configuración de objetivos",
    steps: ["Apodo", "Ingresos netos", "Meta de ahorro", "Meta por categoría", "Confirmar y guardar"],
    next: "Siguiente",
    prev: "Atrás",
    save: "Guardar",
    nickname: "Apodo",
    income: "Ingresos netos este mes (opcional)",
    savingsGoal: "Meta de ahorro mensual",
    categories: "Meta por categoría",
    confirm: "Confirme y guarde la configuración.",
    done: "¡Guardado!",
  },
};

export default function PresetSetup() {
  const [lang, setLang] = useState<LangKey>(() => {
    if (typeof window !== "undefined") {
      return (window.localStorage.getItem("kakeibo-lang") as LangKey) || "ja";
    }
    return "ja";
  });
  const T = LABELS[lang] || LABELS.ja;
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [income, setIncome] = useState("");
  const [savingsGoal, setSavingsGoal] = useState("");
  const [categories, setCategories] = useState([
    { key: "housing", ja: "住居", en: "Housing", percent: "", amount: "" },
    { key: "food", ja: "食費", en: "Food", percent: "", amount: "" },
    { key: "utilities", ja: "水道光熱", en: "Utilities", percent: "", amount: "" },
    { key: "transport", ja: "交通", en: "Transport", percent: "", amount: "" },
    { key: "entertainment", ja: "娯楽", en: "Entertainment", percent: "", amount: "" },
    { key: "other", ja: "その他", en: "Other", percent: "", amount: "" },
  ]);
  const [done, setDone] = useState(false);

  const handleLangChange = (code: LangKey) => {
    setLang(code);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("kakeibo-lang", code);
    }
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };
  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };
  const handleSave = () => {
    setDone(true);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-xl shadow p-6 mt-8 flex flex-col gap-4">
      <div className="flex gap-2 mb-4 justify-end">
        {LANGUAGES.map(l => (
          <button
            key={l.code}
            onClick={() => handleLangChange(l.code as LangKey)}
            className={`px-2 py-1 rounded border text-xs ${lang === l.code ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"}`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <h2 className="text-xl font-bold mb-2 text-violet-700 dark:text-violet-300">{T.title}</h2>
      <div className="flex gap-2 mb-6 justify-center">
        {T.steps.map((label: string, idx: number) => (
          <div
            key={label}
            className={`flex flex-col items-center w-16 ${step === idx ? "text-violet-600 font-bold" : "text-slate-400"}`}
          >
            <div className={`rounded-full w-8 h-8 flex items-center justify-center mb-1 border-2 ${step === idx ? "border-violet-600 bg-violet-100 dark:bg-violet-900" : "border-slate-300 bg-slate-100 dark:bg-slate-800"}`}>{idx + 1}</div>
            <span className="text-xs text-center">{label}</span>
          </div>
        ))}
      </div>
      {!done && (
        <div className="min-h-30 flex flex-col gap-4">
          {step === 0 && (
            <div>
              <label className="block mb-2 font-semibold">{T.nickname}</label>
              <input
                type="text"
                className="w-full rounded border px-3 py-2"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder={T.nickname}
              />
            </div>
          )}
          {step === 1 && (
            <div>
              <label className="block mb-2 font-semibold">{T.income}</label>
              <input
                type="number"
                className="w-full rounded border px-3 py-2"
                value={income}
                onChange={e => setIncome(e.target.value)}
                placeholder={T.income}
              />
            </div>
          )}
          {step === 2 && (
            <div>
              <label className="block mb-2 font-semibold">{T.savingsGoal}</label>
              <input
                type="number"
                className="w-full rounded border px-3 py-2"
                value={savingsGoal}
                onChange={e => setSavingsGoal(e.target.value)}
                placeholder={T.savingsGoal}
              />
            </div>
          )}
          {step === 3 && (
            <div>
              <div className="mb-2 font-semibold">{T.categories || "カテゴリごとの目標設定"}</div>
              <div className="space-y-2">
                {categories.map((cat, idx) => (
                  <div key={cat.key} className="flex gap-2 items-center">
                    <span className="w-16">{lang === "ja" ? cat.ja : cat.en}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={cat.percent}
                      onChange={e => {
                        const v = e.target.value;
                        setCategories(prev => prev.map((c, i) => i === idx ? { ...c, percent: v } : c));
                      }}
                      placeholder="%"
                      className="w-16 rounded border px-2 py-1 text-xs"
                    />
                    <span>%</span>
                    <input
                      type="number"
                      min={0}
                      value={cat.amount}
                      onChange={e => {
                        const v = e.target.value;
                        setCategories(prev => prev.map((c, i) => i === idx ? { ...c, amount: v } : c));
                      }}
                      placeholder={T.savingsGoal}
                      className="w-24 rounded border px-2 py-1 text-xs"
                    />
                    <span>円</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 4 && (
            <div>
              <div className="mb-2 font-semibold">{T.confirm}</div>
              <ul className="text-sm space-y-1">
                <li>{T.nickname}: {nickname || "-"}</li>
                <li>{T.income}: {income || "-"}</li>
                <li>{T.savingsGoal}: {savingsGoal || "-"}</li>
              </ul>
            </div>
          )}
        </div>
      )}
      {done && (
        <div className="text-center text-emerald-600 font-bold py-8">{T.done}</div>
      )}
      <div className="flex gap-2 mt-4 justify-between">
        {step > 0 && !done && (
          <button onClick={handlePrev} className="px-4 py-2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200">{T.prev}</button>
        )}
        {step < 5 && !done && (
          <button onClick={handleNext} className="ml-auto px-4 py-2 rounded bg-violet-600 text-white">{T.next}</button>
        )}
        {step === 5 && !done && (
          <button onClick={handleSave} className="ml-auto px-4 py-2 rounded bg-emerald-600 text-white">{T.save}</button>
        )}
      </div>
    </div>
  );
}
