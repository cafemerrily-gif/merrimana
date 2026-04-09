import { createClient } from "@supabase/supabase-js";

/**
 * サービスロールクライアント（RLSをバイパス）
 * サーバーアクション専用。クライアントサイドでは絶対に使用しないこと。
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
