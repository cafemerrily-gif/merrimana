-- ============================================================
-- Merrimana Café 商品管理スキーマ
-- Supabase SQL Editor で実行してください
-- ============================================================

-- カテゴリ
CREATE TABLE IF NOT EXISTS categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  color       TEXT        NOT NULL DEFAULT 'bg-blue-500',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 商品
CREATE TABLE IF NOT EXISTS products (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  category_id UUID        REFERENCES categories(id) ON DELETE SET NULL,
  price       INTEGER     NOT NULL CHECK (price >= 0),
  status      TEXT        NOT NULL DEFAULT '販売中'
                          CHECK (status IN ('販売中', '準備中', '終了')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- レシピ（商品1件につき最大1件）
CREATE TABLE IF NOT EXISTS recipes (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  yield_count   INTEGER NOT NULL DEFAULT 1 CHECK (yield_count > 0),
  time_minutes  INTEGER NOT NULL DEFAULT 5 CHECK (time_minutes > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id)
);

-- レシピ材料
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name      TEXT    NOT NULL,
  amount    TEXT    NOT NULL,
  cost      INTEGER NOT NULL DEFAULT 0 CHECK (cost >= 0)
);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_set_updated_at ON products;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- シードデータ（初回のみ）
-- ============================================================
INSERT INTO categories (name, description, color) VALUES
  ('ドリンク',         'コーヒー・ラテ・ジュースなどの飲み物', 'bg-blue-500'),
  ('フード',           'ケーキ・パン・サンドイッチなどの食べ物', 'bg-neutral-600'),
  ('季節限定',         '季節に応じた期間限定商品',             'bg-blue-300'),
  ('テイクアウト専用', '店内では提供しないテイクアウト商品',   'bg-neutral-400')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Row Level Security（本番時に有効化）
-- ============================================================
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE recipes     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
