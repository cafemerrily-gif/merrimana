-- ============================================================
-- Merrimana Café 会計スキーマ
-- Supabase SQL Editor で実行してください
-- ============================================================

-- 売上記録
CREATE TABLE IF NOT EXISTS sales (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date           DATE        NOT NULL,
  amount         INTEGER     NOT NULL CHECK (amount >= 0),
  customer_count INTEGER     NOT NULL DEFAULT 0,
  notes          TEXT        NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 支出記録
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE        NOT NULL,
  category    TEXT        NOT NULL,
  description TEXT        NOT NULL,
  vendor      TEXT        NOT NULL DEFAULT '',
  amount      INTEGER     NOT NULL CHECK (amount >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 月次予算
CREATE TABLE IF NOT EXISTS budgets (
  id       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  year     INTEGER NOT NULL,
  month    INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  category TEXT    NOT NULL,
  amount   INTEGER NOT NULL CHECK (amount >= 0),
  UNIQUE (year, month, category)
);

-- ============================================================
-- Row Level Security（本番時に有効化）
-- ============================================================
-- ALTER TABLE sales    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE budgets  ENABLE ROW LEVEL SECURITY;
