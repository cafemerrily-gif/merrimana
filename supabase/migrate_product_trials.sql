-- ============================================================
-- 開発シート（試作評価）マイグレーション
-- ============================================================

CREATE TABLE IF NOT EXISTS product_trials (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL DEFAULT '',
  category        TEXT        NOT NULL DEFAULT 'ドリンク'
                  CHECK (category IN ('ドリンク', 'フード', 'スイーツ')),
  concept         TEXT        NOT NULL DEFAULT '',
  target          TEXT        NOT NULL DEFAULT '',
  pr_points       TEXT        NOT NULL DEFAULT '',
  desired_price   INTEGER     NOT NULL DEFAULT 0,
  packaging_cost  INTEGER     NOT NULL DEFAULT 0,
  prep_notes      TEXT        NOT NULL DEFAULT '',
  steps           TEXT[]      NOT NULL DEFAULT '{"","","","",""}',
  good_points     TEXT        NOT NULL DEFAULT '',
  concerns        TEXT        NOT NULL DEFAULT '',
  improvements    TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_trial_ingredients (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id    UUID        NOT NULL REFERENCES product_trials(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL DEFAULT '',
  amount_g    NUMERIC     NOT NULL DEFAULT 0,
  cost        INTEGER     NOT NULL DEFAULT 0,
  sort_order  INTEGER     NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_trial_purchases (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id      UUID        NOT NULL REFERENCES product_trials(id) ON DELETE CASCADE,
  material      TEXT        NOT NULL DEFAULT '',
  amount        INTEGER     NOT NULL DEFAULT 0,
  cost_per_g    NUMERIC     NOT NULL DEFAULT 0,
  supplier      TEXT        NOT NULL DEFAULT '',
  sort_order    INTEGER     NOT NULL DEFAULT 0
);

-- RLS
ALTER TABLE product_trials           ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_trial_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_trial_purchases  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_trials"
  ON product_trials FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_ingredients"
  ON product_trial_ingredients FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_purchases"
  ON product_trial_purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);
