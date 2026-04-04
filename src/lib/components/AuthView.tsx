import React, { useState, useEffect } from "react";

function friendlyError(msg: string): string {
  if (msg.includes("rate limit") || msg.includes("Rate limit")) return "メール送信の上限に達しました。しばらく待ってから再試行してください（約1時間）。または、Supabaseダッシュボードのレート制限設定を確認してください。";
  if (msg.includes("Invalid login credentials")) return "メールアドレスまたはパスワードが間違っています";
  if (msg.includes("Email not confirmed")) return "メールアドレスの確認が完了していません。確認メールをご確認ください。";
  if (msg.includes("User already registered")) return "このメールアドレスは既に登録されています。ログインしてください。";
  return msg;
}
import { FaLine, FaEnvelope, FaLock } from "react-icons/fa";
import { useCharacterImage } from "../hooks/useCharacterImage";
import { useBgTheme } from "../hooks/useBgTheme";
import { createClient } from "../supabase/client";

interface AuthViewProps {
  onAuth: (mode?: 'login' | 'register', email?: string, password?: string) => void;
  onBack: () => void;
  initialMessage?: { type: "success" | "error"; text: string } | null;
  initialEmail?: string;
  onGuestLogin?: () => void;
  idolImageUrl?: string;
}

const AuthView: React.FC<AuthViewProps> = ({ onAuth, onBack, initialMessage, initialEmail, onGuestLogin, idolImageUrl }) => {
  const [email, setEmail] = useState(initialEmail || "");
  const [password, setPassword] = useState("");
  const [showLineQR, setShowLineQR] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [lineLoading, setLineLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [localNotice, setLocalNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>("login");
  const { characterUrl, characterName } = useCharacterImage();
  useBgTheme();

  // initialEmail が変わったら同期
  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  const displayUrl = idolImageUrl || characterUrl;
  const notice = localNotice || initialMessage;

  async function handleAuth() {
    if (!email) { setLocalNotice({ type: "error", text: "メールアドレスを入力してください" }); return; }
    setAuthLoading(true);
    setLocalNotice(null);
    const supabase = createClient();

    if (mode === "register") {
      if (!password) {
        // パスワードなし登録 → マジックリンク送信
        const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
        setAuthLoading(false);
        if (error) { setLocalNotice({ type: "error", text: friendlyError(error.message) }); return; }
        setLocalNotice({ type: "success", text: `✅ ${email} にログインリンクを送信しました。メールを開いてリンクをタップしてください。` });
        return;
      }
      // パスワードあり登録
      const { error } = await supabase.auth.signUp({ email, password });
      setAuthLoading(false);
      if (error) { setLocalNotice({ type: "error", text: error.message }); return; }
      setLocalNotice({ type: "success", text: "確認メールを送信しました。メールのリンクをタップして登録を完了してください。" });
      return;
    }

    // ログイン
    if (password) {
      // パスワードあり → 通常ログイン
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setAuthLoading(false);
      if (error) { setLocalNotice({ type: "error", text: "メールアドレスまたはパスワードが間違っています" }); return; }
      onAuth("login", email, password);
      if (data.user) return;
    } else {
      // パスワードなし → マジックリンク送信
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      setAuthLoading(false);
      if (error) { setLocalNotice({ type: "error", text: error.message }); return; }
      setLocalNotice({ type: "success", text: `✅ ${email} にログインリンクを送信しました。メールを開いてリンクをタップしてください。` });
    }
  }

  async function handleLineLogin() {
    setLineLoading(true);
    try {
      const res = await fetch("/api/auth/line/start");
      const data = await res.json();
      if (data.authUrl) window.location.href = data.authUrl;
    } catch { setLineLoading(false); }
  }

  async function handleShowQR() {
    if (showLineQR) { setShowLineQR(false); return; }
    try {
      const res = await fetch("/api/auth/line/start");
      const data = await res.json();
      if (data.qrUrl) setQrUrl(data.qrUrl);
      setShowLineQR(true);
    } catch { setShowLineQR(true); }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden" style={{ background: "var(--background)" }}>

      {/* 浮遊キャラクター */}
      {displayUrl && (
        <div className="fixed bottom-6 left-6 z-10 flex flex-col items-center gap-1 pointer-events-none select-none">
          <div className="animate-float">
            <img src={displayUrl} alt={characterName || "キャラクター"}
              className="w-20 h-20 rounded-full object-cover border-4 border-pink-200 dark:border-violet-400 shadow-xl opacity-90" />
          </div>
          {characterName && (
            <span className="text-xs font-bold text-pink-500 dark:text-violet-300 bg-white/60 dark:bg-slate-900/60 rounded-full px-2 py-0.5">{characterName}</span>
          )}
        </div>
      )}

      <div className="w-full max-w-xs bg-white/80 dark:bg-slate-900/90 rounded-3xl shadow-2xl p-8 flex flex-col items-center border border-pink-200 dark:border-slate-700 relative z-20">

        {/* キャラクター＆タブ */}
        <div className="flex flex-col items-center mb-4 w-full">
          {displayUrl && (
            <img src={displayUrl} alt={characterName || "画像"}
              className="w-16 h-16 rounded-full object-cover border-4 border-pink-200 shadow-lg mb-2" />
          )}
          <div className="flex w-full mb-2">
            <button type="button"
              className={`flex-1 py-2 rounded-l-2xl font-bold text-sm ${mode === "login" ? "bg-pink-200 text-pink-700 shadow" : "bg-white dark:bg-slate-800 text-pink-400 border-r border-pink-100"}`}
              onClick={() => { setMode("login"); setLocalNotice(null); }}>ログイン</button>
            <button type="button"
              className={`flex-1 py-2 rounded-r-2xl font-bold text-sm ${mode === "register" ? "bg-violet-200 text-violet-700 shadow" : "bg-white dark:bg-slate-800 text-violet-400 border-l border-violet-100"}`}
              onClick={() => { setMode("register"); setLocalNotice(null); }}>新規登録</button>
          </div>
          <h2 className="text-xl font-extrabold text-pink-500 drop-shadow mb-1 flex items-center gap-2">
            <FaEnvelope className="text-pink-400" /> {mode === "login" ? "ログイン" : "新規登録"}
          </h2>
        </div>

        {/* お知らせ */}
        {notice && (
          <div className={`mb-4 px-4 py-2 rounded-xl font-bold text-center text-sm ${notice.type === "success" ? "bg-green-100 text-green-700 border border-green-300" : "bg-red-100 text-red-700 border border-red-300"}`}>
            {notice.text}
          </div>
        )}

        {/* メール */}
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="メールアドレス"
          className="mb-2 px-4 py-2 border-2 border-pink-200 rounded-xl w-64 focus:outline-none focus:border-pink-400 bg-white dark:bg-slate-800 dark:text-slate-100 shadow" />

        {/* パスワード */}
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="パスワード（空欄でメールリンク送信）"
          className="mb-1 px-4 py-2 border-2 border-pink-200 rounded-xl w-64 focus:outline-none focus:border-pink-400 bg-white dark:bg-slate-800 dark:text-slate-100 shadow" />
        <p className="text-[10px] text-slate-400 mb-3 text-center">パスワード空欄 → メールにログインリンクを送信</p>

        {/* 認証ボタン群 */}
        <div className="flex flex-col gap-2 w-full mb-4">
          <button type="button" onClick={handleAuth} disabled={authLoading}
            className="w-full px-4 py-2 bg-linear-to-r from-pink-400 to-violet-400 text-white font-bold rounded-xl shadow hover:from-pink-500 hover:to-violet-500 transition disabled:opacity-60">
            {authLoading ? "処理中..." : <><FaEnvelope className="inline mr-2" />メールで{mode === "login" ? "ログイン" : "新規登録"}</>}
          </button>
          <button type="button" onClick={handleLineLogin} disabled={lineLoading}
            className="w-full px-4 py-2 bg-green-400 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2 hover:bg-green-500 transition disabled:opacity-60">
            <FaLine className="text-2xl" /> {lineLoading ? "移動中..." : "LINEでログイン"}
          </button>
          <button type="button" onClick={handleShowQR}
            className="w-full px-4 py-2 bg-green-50 text-green-700 font-bold rounded-xl shadow flex items-center justify-center gap-2 hover:bg-green-100 border border-green-200 transition text-xs">
            QRでLINEログイン
          </button>
          {showLineQR && qrUrl && (
            <div className="flex flex-col items-center mt-1 p-2 bg-green-50 rounded-xl border border-green-200">
              <span className="text-xs text-green-700 mb-1">LINEアプリでQRをスキャン</span>
              <img src={qrUrl} alt="LINE QR" className="w-36 h-36 rounded-lg border-2 border-green-300" />
            </div>
          )}
          {onGuestLogin && (
            <button type="button" onClick={onGuestLogin}
              className="w-full px-4 py-2 bg-slate-700 text-white font-bold rounded-xl shadow hover:bg-slate-800 transition">
              ゲストとして試す
            </button>
          )}
        </div>

        {/* その他リンク */}
        <div className="flex flex-col gap-2 w-full mb-2">
          <a href="/auth/reset-password"
            className="w-full px-4 py-2 bg-yellow-100 text-yellow-700 font-bold rounded-xl shadow flex items-center justify-center gap-2 hover:bg-yellow-200 transition text-sm">
            <FaLock className="text-base" /> パスワード再設定
          </a>
          <a href="/settings"
            className="w-full px-4 py-2 bg-pink-50 dark:bg-slate-800 text-pink-500 dark:text-violet-300 font-bold rounded-xl shadow flex items-center justify-center gap-2 hover:bg-pink-100 dark:hover:bg-slate-700 transition text-xs border border-pink-200 dark:border-slate-700">
            🎨 キャラクター設定
          </a>
        </div>

        <button type="button" onClick={onBack}
          className="mt-2 px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl w-full font-bold shadow hover:bg-gray-300 dark:hover:bg-slate-600 transition">
          戻る
        </button>
      </div>
    </div>
  );
};

export default AuthView;
