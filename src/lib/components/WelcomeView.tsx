import React from "react";
import { useCharacterImage } from "../hooks/useCharacterImage";
import { useBgTheme } from "../hooks/useBgTheme";

interface WelcomeViewProps {
  onStartAuth: () => void;
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ onStartAuth }) => {
  const { characterUrl, characterName } = useCharacterImage();
  useBgTheme(); // 背景変更をリッスンしてCSS変数に即時反映

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden" style={{ background: "var(--background)" }}>

      {/* 背景きらきら */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {[
          { top: "8%", left: "12%", size: "text-3xl", delay: "0s" },
          { top: "15%", left: "75%", size: "text-2xl", delay: "0.8s" },
          { top: "60%", left: "5%", size: "text-xl", delay: "1.2s" },
          { top: "70%", left: "85%", size: "text-3xl", delay: "0.4s" },
          { top: "40%", left: "90%", size: "text-2xl", delay: "1.6s" },
          { top: "85%", left: "30%", size: "text-xl", delay: "0.6s" },
        ].map((s, i) => (
          <span
            key={i}
            className={`absolute opacity-30 dark:opacity-20 text-pink-400 dark:text-violet-400 animate-float-slow select-none ${s.size}`}
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          >✦</span>
        ))}
      </div>

      {/* 浮遊キャラクター */}
      {characterUrl && (
        <div className="absolute bottom-8 right-6 z-10 flex flex-col items-center gap-1 select-none pointer-events-none">
          <div className="animate-float">
            <img
              src={characterUrl}
              alt={characterName || "キャラクター"}
              className="w-24 h-24 rounded-full object-cover border-4 border-pink-300 dark:border-violet-400 shadow-xl"
            />
          </div>
          {characterName && (
            <span className="text-xs font-bold text-pink-500 dark:text-violet-300 drop-shadow bg-white/60 dark:bg-slate-900/60 rounded-full px-2 py-0.5">
              {characterName}
            </span>
          )}
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="relative z-20 flex flex-col items-center gap-5 text-center">
        <div className="text-5xl animate-bounce-slow">✨</div>
        <h1 className="text-3xl font-extrabold text-pink-500 dark:text-violet-300 drop-shadow leading-tight">
          きらきら家計簿
        </h1>
        {/* アカウント登録画面でのみゲストモード案内を表示（通常は非表示） */}
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
          自分だけのキャラクターと一緒に、楽しく家計管理しよう！
        </p>

        <button
          type="button"
          onClick={onStartAuth}
          className="mt-2 px-8 py-3 bg-linear-to-r from-pink-400 to-violet-400 text-white rounded-full font-bold shadow-lg hover:from-pink-500 hover:to-violet-500 transition text-base"
        >
          アカウント登録・ログイン
        </button>

        <div className="flex flex-col gap-1 mt-2">
          <a
            href="/settings"
            className="text-xs text-pink-400 dark:text-violet-400 underline underline-offset-2 hover:text-pink-600 dark:hover:text-violet-300 transition"
          >
            🎨 キャラクター名・画像設定
          </a>
          <a
            href="/settings"
            className="text-xs text-pink-400 dark:text-violet-400 underline underline-offset-2 hover:text-pink-600 dark:hover:text-violet-300 transition"
          >
            🖼️ 背景テーマ設定
          </a>
        </div>
      </div>
    </div>
  );
};

export default WelcomeView;
