"use client"

import { Transaction } from "@/lib/utils"
// Claude用AIProvider型のimport削除
import Charts from "./Charts"


import { useState, useCallback } from "react"
import Image from "next/image"
import { useCharacterImage } from "../hooks/useCharacterImage"

const mascotsByMode = {
  normal: [
    {
      key: "girl",
      name: "さくら",
      img: "/girl-mascot.png",
      lines: [
        "一緒にがんばろうねっ！",
        "今日もえらいよ！",
        "節約って、ちょっと楽しいかも…？",
        "私が応援してるから、無理しないでね♡",
        "きゅん…！その調子でファイト！",
        "目標に近づいてるよ、すごい！",
        "また一歩前進だね！",
        "私も見守ってるよ！",
      ],
    },
    {
      key: "boy",
      name: "カケル",
      img: "/boy-mascot.png",
      lines: [
        "よく頑張ってるな、偉いぞ。",
        "無理せず、少しずつで大丈夫だ。",
        "俺も応援してるからな。",
        "目標に向かって一緒に進もう。",
        "その調子、かっこいいぞ！",
        "着実に前進してるな。",
        "困ったらいつでも頼ってくれ。",
        "今日もお疲れさま。",
      ],
    },
  ],
  kids: [
    {
      key: "kids",
      name: "まめちゃん",
      img: "/kids-mascot.png",
      lines: [
        "いっしょにおこづかいがんばろう！",
        "えらいね！おかし買えるかな？",
        "おこづかい帳、ちゃんとつけてえらい！",
        "つぎは何を買う？たのしみだね！",
        "ちょっとずつためていこうね！",
        "おかねはたいせつにしようね！",
      ],
    },
  ],
  senior: [
    {
      key: "senior",
      name: "しげるさん",
      img: "/senior-mascot.png",
      lines: [
        "無理せず、ゆっくり続けましょう。",
        "健康も大事にね。",
        "年金や医療費も忘れずに。",
        "今日もお疲れさまです。",
        "少しずつで十分ですよ。",
        "困ったら家族やサポートに相談しましょう。",
      ],
    },
  ],
}


type Provider = "openai" | "gemini"

export default function AIAnalysis({ transactions, currentMonth }: { transactions: Transaction[]; currentMonth: string }) {
  const { characterUrl, characterName } = useCharacterImage()

  const [mode, setMode] = useState<"normal" | "kids" | "senior">("normal")
  const [mascot, setMascot] = useState<string>(mascotsByMode.normal[0].key)
  const [mascotLine, setMascotLine] = useState<string>(mascotsByMode.normal[0].lines[0])

  const randomLine = useCallback(() => {
    const modeList = mascotsByMode[mode]
    const found = modeList.find(m => m.key === mascot) || modeList[0]
    return found.lines[Math.floor(Math.random() * found.lines.length)]
  }, [mode, mascot])

  const [provider, setProvider] = useState<Provider>("openai")
  const [analysisType, setAnalysisType] = useState<"analysis" | "saving" | "advice">("analysis")
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")



  async function handleAnalysis() {
    setLoading(true)
    setError("")
    setResult("")
    try {
      let data = transactions
      // モードごとに分析ロジックを分岐
      if (mode === "kids") {
        // 子供向け: 今月のみ・おこづかい/おやつ/おもちゃカテゴリだけ
        data = transactions.filter(t => t.date.slice(0, 7) === currentMonth && ["おこづかい", "おやつ", "おもちゃ"].includes(t.category || ""))
      } else if (mode === "senior") {
        // 高齢者: 医療費・年金・生活費カテゴリを強調
        data = transactions.filter(t => ["医療費", "年金", "生活費", "食費", "光熱費"].includes(t.category || ""))
      } else {
        // analysis: 直近3ヶ月, saving/advice: 今月のみ
        if (analysisType === "analysis") {
          const months = [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort().reverse().slice(0, 3)
          data = transactions.filter(t => months.includes(t.date.slice(0, 7)))
        } else {
          data = transactions.filter(t => t.date.slice(0, 7) === currentMonth)
        }
      }
      // analysisType値をAPIのtype値に変換
      let apiType: string = analysisType
      if (analysisType === "saving") apiType = "savings_plan"
      if (analysisType === "advice") apiType = "life_advice"

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          type: apiType,
          data,
          mode,
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || "AI分析に失敗しました")
      setResult(payload?.result || "")
      setMascotLine(randomLine())
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message)
      } else {
        setError("AI分析に失敗しました")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      {/* 年間グラフ（12ヶ月分） */}
      <Charts transactions={transactions} currentMonth={currentMonth} />

      <div className="mt-6 p-4 bg-slate-800 rounded-xl border border-slate-700 flex flex-col gap-4">
        {/* モード選択 */}
        <div className="flex gap-3 items-center flex-wrap mb-2">
          <span className="text-slate-300 font-bold">モード:</span>
          {[
            { key: "normal", label: "通常" },
            { key: "kids", label: "子供" },
            { key: "senior", label: "高齢者" },
          ].map(m => (
            <button
              key={m.key}
              className={`px-3 py-1 rounded-lg font-bold text-sm border-2 ${mode === m.key ? "border-emerald-400 bg-emerald-900/30 text-emerald-200" : "border-slate-700 bg-slate-700 text-slate-300"}`}
              onClick={() => {
                setMode(m.key as "normal"|"kids"|"senior")
                const nextMascots = mascotsByMode[m.key as keyof typeof mascotsByMode]
                setMascot(nextMascots[0].key)
                setMascotLine(nextMascots[0].lines[Math.floor(Math.random() * nextMascots[0].lines.length)])
              }}
              disabled={loading}
            >{m.label}</button>
          ))}
        </div>
        {/* キャラクター選択UIは非表示化（自由設定のみ） */}

        {/* キャラクター画像・名前 */}
        <div className="flex items-center gap-3 bg-slate-900/80 rounded-xl p-3 border border-pink-400/40">
          {characterUrl ? (
            <Image src={characterUrl} alt={characterName || "キャラクター"} width={48} height={48} className="w-12 h-12 rounded-full object-cover border-2 border-pink-300 bg-white" unoptimized />
          ) : (
            <div className="w-12 h-12 rounded-full border-2 border-pink-300 bg-slate-800 flex items-center justify-center text-xl">🤖</div>
          )}
          <div>
            <div className="font-bold text-pink-200 text-sm mb-1">{characterName || "AI"}のひとこと</div>
            <div className="text-pink-100 text-xs">{mascotLine}</div>
          </div>
        </div>

        {/* AIプロバイダー選択 */}
        <div className="flex gap-3 items-center flex-wrap mt-2">
          <span className="text-slate-300 font-bold">AIプロバイダー:</span>
          <button
            className={`px-3 py-1 rounded-lg font-bold text-sm ${provider === "openai" ? "bg-violet-600 text-white" : "bg-slate-700 text-slate-300"}`}
            onClick={() => setProvider("openai")}
            disabled={loading}
          >OpenAI</button>
          <button
            className={`px-3 py-1 rounded-lg font-bold text-sm ${provider === "gemini" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"}`}
            onClick={() => setProvider("gemini")}
            disabled={loading}
          >Gemini</button>
        </div>
        {/* 分析種別選択 */}
        <div className="flex gap-3 items-center flex-wrap mt-2">
          <span className="text-slate-300 font-bold">分析種別:</span>
          <button
            className={`px-3 py-1 rounded-lg font-bold text-sm ${analysisType === "analysis" ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300"}`}
            onClick={() => setAnalysisType("analysis")}
            disabled={loading}
          >今月のAI分析</button>
          <button
            className={`px-3 py-1 rounded-lg font-bold text-sm ${analysisType === "saving" ? "bg-cyan-600 text-white" : "bg-slate-700 text-slate-300"}`}
            onClick={() => setAnalysisType("saving")}
            disabled={loading}
          >AI節約プラン</button>
          <button
            className={`px-3 py-1 rounded-lg font-bold text-sm ${analysisType === "advice" ? "bg-pink-600 text-white" : "bg-slate-700 text-slate-300"}`}
            onClick={() => setAnalysisType("advice")}
            disabled={loading}
          >AI生活アドバイス</button>
        </div>
        <button
          className="mt-2 px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-60"
          onClick={handleAnalysis}
          disabled={loading}
        >{loading ? (analysisType === "analysis" ? "分析中..." : analysisType === "saving" ? "節約案作成中..." : "アドバイス生成中...") : (
          analysisType === "analysis" ? "今月のAI分析" : analysisType === "saving" ? "AI節約プラン" : "AI生活アドバイス"
        )}</button>
        {error && <div className="text-red-400 font-bold">{error}</div>}
        {result && (
          <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700 whitespace-pre-wrap text-slate-100">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
