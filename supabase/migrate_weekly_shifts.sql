-- ============================================================
-- migrate_weekly_shifts.sql
-- migrate_store.sql 実行済みを前提とした差分マイグレーション
-- 日付ベースのシフト → 曜日固定・半期管理のシフトに移行
-- ============================================================

-- 旧テーブルを削除（既存データが不要な場合）
DROP TABLE IF EXISTS shifts;

-- 新テーブル: 曜日固定シフト（半期単位で管理）
CREATE TABLE IF NOT EXISTS weekly_shifts (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  period_key   text    NOT NULL,               -- 例: '2026-H1'
  day_of_week  integer NOT NULL
    CHECK (day_of_week BETWEEN 0 AND 6),       -- 0=月, 1=火, ..., 6=日
  staff_name   text    NOT NULL,
  start_time   text    NOT NULL,               -- 'HH:MM'
  end_time     text    NOT NULL,               -- 'HH:MM'
  notes        text    NOT NULL DEFAULT '',
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS weekly_shifts_period_idx
  ON weekly_shifts(period_key);

CREATE INDEX IF NOT EXISTS weekly_shifts_period_dow_idx
  ON weekly_shifts(period_key, day_of_week);

-- RLS
ALTER TABLE weekly_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON weekly_shifts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
