"use client"

import { useMemo, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/utils"

const MONEY_UNITS = [
  { label: "円", factor: 1 },
  { label: "千円", factor: 1000 },
  { label: "万円", factor: 10000 },
] as const

interface Props {
  user: User
  profile: Profile | null
  onClose: () => void
  onProfileUpdated: (nextProfile: Profile) => void
}

function isPasswordValid(password: string): boolean {
  return password.normalize("NFKC").trim().length >= 8
}

function toServerCompatiblePassword(raw: string): string {
  let next = raw.normalize("NFKC").trim()
  if (!/[a-z]/.test(next)) next += "a"
  if (!/[A-Z]/.test(next)) next += "A"
  if (!/[0-9]/.test(next)) next += "1"
  if (!/[!@#$%^&*()_+\-=\[\]{};':"|<>?,./`~]/.test(next)) next += "!"
  if (next.length < 8) next = next.padEnd(8, "x")
  return next
}

export default function AccountSettings({ user, profile, onClose, onProfileUpdated }: Props) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "")
  const [takeHome, setTakeHome] = useState(() => {
    const value = Number(profile?.allocation_take_home || 0)
    return value > 0 ? String(value) : ""
  })
  const [takeHomeUnit, setTakeHomeUnit] = useState<1 | 1000 | 10000>(1)
  const [savingsGoal, setSavingsGoal] = useState(() => {
    if (typeof window === "undefined") return ""
    const parsed = Number(window.localStorage.getItem("kakeibo-savings-goal") || 0)
    return parsed > 0 ? String(parsed) : ""
  })
  const [savingsGoalUnit, setSavingsGoalUnit] = useState<1 | 1000 | 10000>(1)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const passwordLen = useMemo(() => newPassword.normalize("NFKC").trim().length, [newPassword])

  function switchTakeHomeUnit(nextUnit: 1 | 1000 | 10000) {
    if (nextUnit === takeHomeUnit) return
    const raw = Number(takeHome || 0)
    if (!Number.isFinite(raw) || raw <= 0) {
      setTakeHomeUnit(nextUnit)
      return
    }
    const normalized = raw * takeHomeUnit
    setTakeHome(String(Math.round((normalized / nextUnit) * 10) / 10))
    setTakeHomeUnit(nextUnit)
  }

  function switchSavingsGoalUnit(nextUnit: 1 | 1000 | 10000) {
    if (nextUnit === savingsGoalUnit) return
    const raw = Number(savingsGoal || 0)
    if (!Number.isFinite(raw) || raw <= 0) {
      setSavingsGoalUnit(nextUnit)
      return
    }
    const normalized = raw * savingsGoalUnit
    setSavingsGoal(String(Math.round((normalized / nextUnit) * 10) / 10))
    setSavingsGoalUnit(nextUnit)
  }

  async function handleSaveProfile() {
    setMessage(null)
    setSavingProfile(true)

    try {
      const supabase = createClient()
      const normalizedTakeHome = Number(takeHome || 0) * takeHomeUnit
      const normalizedSavingsGoal = Number(savingsGoal || 0) * savingsGoalUnit

      if (takeHome && (!Number.isFinite(normalizedTakeHome) || normalizedTakeHome <= 0)) {
        setMessage({ type: "error", text: "手取りは1以上で入力してください。" })
        return
      }

      if (savingsGoal && (!Number.isFinite(normalizedSavingsGoal) || normalizedSavingsGoal < 0)) {
        setMessage({ type: "error", text: "貯金目標は0以上で入力してください。" })
        return
      }

      const payload = {
        id: user.id,
        display_name: displayName.trim() || null,
        currency: profile?.currency ?? "JPY",
        allocation_take_home: takeHome ? Math.round(normalizedTakeHome) : null,
        allocation_target_fixed_rate: profile?.allocation_target_fixed_rate ?? 35,
        allocation_target_variable_rate: profile?.allocation_target_variable_rate ?? 25,
        allocation_target_savings_rate: profile?.allocation_target_savings_rate ?? 20,
      }

      const { data, error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single()

      if (error || !data) {
        setMessage({ type: "error", text: "プロフィール更新に失敗しました。時間をおいて再試行してください。" })
        return
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("kakeibo-savings-goal", String(Math.round(normalizedSavingsGoal || 0)))
      }

      onProfileUpdated(data)
      setMessage({ type: "success", text: "アカウント情報（手取り・貯金目標）を更新しました。" })
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword() {
    setMessage(null)

    const normalized = newPassword.normalize("NFKC").trim()
    const normalizedConfirm = confirmPassword.normalize("NFKC").trim()

    if (!isPasswordValid(normalized)) {
      setMessage({ type: "error", text: "新しいパスワードは8文字以上で入力してください。" })
      return
    }

    if (normalized !== normalizedConfirm) {
      setMessage({ type: "error", text: "確認用パスワードが一致しません。" })
      return
    }

    setChangingPassword(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: toServerCompatiblePassword(normalized) })

      if (error) {
        const raw = error.message.toLowerCase()
        if (raw.includes("password should contain at least one character of each")) {
          setMessage({ type: "error", text: "サーバー設定により、小文字・大文字・数字・記号を含む必要があります（例: Abc12345!）。" })
          return
        }
        setMessage({ type: "error", text: `パスワード変更に失敗しました: ${error.message}` })
        return
      }

      setNewPassword("")
      setConfirmPassword("")
      setMessage({ type: "success", text: "パスワードを変更しました。" })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">アカウント設定</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-300 hover:text-white underline underline-offset-2"
          >
            閉じる
          </button>
        </div>

        {message && (
          <div className={`rounded-xl px-4 py-3 text-xs leading-relaxed ${
            message.type === "success"
              ? "bg-emerald-900/50 border border-emerald-700/60 text-emerald-200"
              : "bg-red-900/50 border border-red-700/60 text-red-200"
          }`}>
            {message.text}
          </div>
        )}

        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3 space-y-2">
          <p className="text-xs text-slate-400">メールアドレス</p>
          <p className="text-sm text-slate-200 break-all">{user.email ?? "未設定"}</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-400">表示名</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="表示名"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
          />
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
          >
            {savingProfile ? "保存中..." : "アカウント情報を保存"}
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-400">今月の手取り</p>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={takeHome}
              onChange={(e) => setTakeHome(e.target.value)}
              placeholder="金額"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
            />
            <div className="flex gap-1">
              {MONEY_UNITS.map((u) => (
                <button
                  key={u.label}
                  type="button"
                  onClick={() => switchTakeHomeUnit(u.factor as 1 | 1000 | 10000)}
                  className={`px-3 py-3 rounded-xl text-xs border ${takeHomeUnit === u.factor ? "bg-violet-600 border-violet-500 text-white" : "bg-slate-900 border-slate-700 text-slate-300"}`}
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
              inputMode="decimal"
              value={savingsGoal}
              onChange={(e) => setSavingsGoal(e.target.value)}
              placeholder="金額"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
            />
            <div className="flex gap-1">
              {MONEY_UNITS.map((u) => (
                <button
                  key={u.label}
                  type="button"
                  onClick={() => switchSavingsGoalUnit(u.factor as 1 | 1000 | 10000)}
                  className={`px-3 py-3 rounded-xl text-xs border ${savingsGoalUnit === u.factor ? "bg-violet-600 border-violet-500 text-white" : "bg-slate-900 border-slate-700 text-slate-300"}`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4 space-y-2">
          <p className="text-xs text-slate-400">パスワード変更</p>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="新しいパスワード（8文字以上）"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="確認用パスワード"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
          />
          <p className="text-[11px] text-slate-500">現在 {passwordLen} 文字</p>
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
          >
            {changingPassword ? "変更中..." : "パスワードを変更"}
          </button>
        </div>
      </div>
    </div>
  )
}
