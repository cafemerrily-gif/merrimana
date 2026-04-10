"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Step = "verifying" | "set-password" | "error" | "done";

export default function ConfirmInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as "invite" | "recovery" | null;

    if (!tokenHash || !type) {
      setErrorMsg("無効なリンクです。招待メールのリンクを再度お試しください。");
      setStep("error");
      return;
    }

    supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error }) => {
      if (error) {
        setErrorMsg(
          error.message.includes("expired")
            ? "リンクの有効期限が切れています。管理者に再招待を依頼してください。"
            : `認証エラー: ${error.message}`
        );
        setStep("error");
      } else {
        setStep("set-password");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg("パスワードは8文字以上で設定してください。");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("パスワードが一致しません。");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setErrorMsg(`パスワードの設定に失敗しました: ${error.message}`);
      setLoading(false);
    } else {
      setStep("done");
      setTimeout(() => router.push("/"), 2000);
    }
  };

  if (step === "verifying") {
    return <p className="text-center text-sm text-neutral-500">認証中...</p>;
  }

  if (step === "error") {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-4 py-3">
          {errorMsg}
        </p>
        <button
          onClick={() => router.push("/login")}
          className="text-sm text-blue-600 hover:underline"
        >
          ログイン画面へ
        </button>
      </div>
    );
  }

  if (step === "set-password") {
    return (
      <form onSubmit={handleSetPassword} className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            パスワードを設定
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            初回ログイン用のパスワードを設定してください
          </p>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
            {errorMsg}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            新しいパスワード
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8文字以上"
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            パスワード（確認）
          </label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="もう一度入力"
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold py-2.5 text-sm hover:bg-neutral-700 dark:hover:bg-neutral-200 disabled:opacity-50 transition-colors"
        >
          {loading ? "設定中..." : "パスワードを設定してログイン"}
        </button>
      </form>
    );
  }

  return (
    <div className="text-center space-y-2">
      <p className="text-sm font-medium text-green-600 dark:text-green-400">
        パスワードを設定しました
      </p>
      <p className="text-xs text-neutral-400">ダッシュボードへ移動しています...</p>
    </div>
  );
}
