-- ============================================================
-- 販売期間 + 売上明細 マイグレーション
-- Supabase SQL Editor で実行してください
-- ============================================================

-- 商品に販売期間カラム追加
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_start DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_end   DATE;

-- 売上明細テーブル
CREATE TABLE IF NOT EXISTS sale_items (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id      UUID    NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id   UUID    NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT    NOT NULL,   -- 販売時点のスナップショット
  unit_price   INTEGER NOT NULL,   -- 販売時点のスナップショット
  quantity     INTEGER NOT NULL CHECK (quantity > 0),
  subtotal     INTEGER NOT NULL
);
