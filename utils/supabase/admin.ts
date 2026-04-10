import { createClient } from "@supabase/supabase-js";

/**
 * サービスロールクライアント（RLSをバイパス）
 * サーバーアクション専用。クライアントサイドでは絶対に使用しないこと。
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "環境変数が不足しています。Vercel の Settings → Environment Variables に " +
      "NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください。"
    );
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
