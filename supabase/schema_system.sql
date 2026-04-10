-- ============================================================
-- Merrimana Café システム管理スキーマ
-- Supabase SQL Editor で実行してください
-- ============================================================

-- ユーザープロフィール（auth.users と 1:1）
CREATE TABLE IF NOT EXISTS profiles (
  id      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name    TEXT        NOT NULL DEFAULT '',
  unit    TEXT        NOT NULL DEFAULT '店舗スタッフ',
  role    TEXT        NOT NULL DEFAULT 'スタッフ',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- マスタ設定（key-value形式）
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT        PRIMARY KEY,
  value      TEXT        NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 初期設定
INSERT INTO settings (key, value) VALUES
  ('store_name',             'Merrimana Café'),
  ('store_address',          ''),
  ('store_phone',            ''),
  ('store_email',            ''),
  ('hours_weekday_open',     '08:00'),
  ('hours_weekday_close',    '19:00'),
  ('hours_saturday_open',    '09:00'),
  ('hours_saturday_close',   '20:00'),
  ('hours_holiday_open',     '10:00'),
  ('hours_holiday_close',    '18:00'),
  ('notify_daily_report',    'true'),
  ('notify_order',           'true'),
  ('notify_monthly_report',  'false'),
  ('notify_inventory_alert', 'true')
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all" ON profiles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all" ON settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
