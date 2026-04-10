-- ============================================================
-- migrate_daily_reports.sql
-- 日報テーブルの追加マイグレーション
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_reports (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date         date        NOT NULL UNIQUE,
  content      text        NOT NULL DEFAULT '',
  submitted_by text        NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS daily_reports_date_idx ON daily_reports(date);

-- RLS
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON daily_reports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
