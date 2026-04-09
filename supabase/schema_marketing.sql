-- ============================================================
-- Merrimana Café 広報・マーケティングスキーマ
-- Supabase SQL Editor で実行してください
-- ※ 既存テーブルがある場合は先に DROP して再実行してください
-- ============================================================

-- キャンペーン
CREATE TABLE IF NOT EXISTS campaigns (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  start_date  DATE,
  end_date    DATE,
  status      TEXT        NOT NULL DEFAULT '準備中'
              CHECK (status IN ('準備中', '実施中', '終了')),
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PR活動（無料・有機的なPR活動を記録）
CREATE TABLE IF NOT EXISTS pr_activities (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  channel      TEXT        NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  scheduled_at DATE,
  status       TEXT        NOT NULL DEFAULT '予定'
               CHECK (status IN ('予定', '完了', '見送り')),
  campaign_id  UUID        REFERENCES campaigns(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- メディア素材（Supabase Storage のパスを保存）
CREATE TABLE IF NOT EXISTS media_assets (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  file_path   TEXT        NOT NULL,
  file_type   TEXT        NOT NULL CHECK (file_type IN ('image', 'video', 'pdf', 'other')),
  file_size   INTEGER     NOT NULL DEFAULT 0,
  mime_type   TEXT        NOT NULL DEFAULT '',
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  campaign_id UUID        REFERENCES campaigns(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Supabase Storage の設定（ダッシュボードで手動実行）
-- ============================================================
-- 1. Storage > New bucket > 名前: "marketing"
-- 2. Public bucket: ON（画像プレビューに必要）
-- 3. Allowed MIME types: image/*, video/*, application/pdf
