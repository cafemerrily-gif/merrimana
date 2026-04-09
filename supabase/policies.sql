-- ============================================================
-- Merrimana Café RLS ポリシー設定
-- Supabase SQL Editor で実行してください
-- ============================================================
-- 方針: 認証済みユーザー（スタッフ）は全テーブルを操作可能。
--       未認証（anon）は一切アクセス不可。
--       Storage の marketing バケットのみ、画像URL直アクセス用に
--       匿名ユーザーの SELECT を許可（公開バケット前提）。
-- ============================================================

-- ============================================================
-- 商品管理テーブル
-- ============================================================
ALTER TABLE categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON recipes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON recipe_ingredients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 会計テーブル
-- ============================================================
ALTER TABLE sales      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON sales
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON sale_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON expenses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON budgets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 広報・マーケティングテーブル
-- ============================================================
ALTER TABLE campaigns    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON campaigns
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON pr_activities
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all" ON media_assets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Storage: marketing バケット
-- ============================================================
-- 注意: storage.objects テーブルのポリシーは Supabase ダッシュボードの
--       Storage > Policies でも設定可能。以下と同等の内容です。

-- 公開読み取り（画像URLを直接ブラウザで開くため）
CREATE POLICY "marketing_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketing');

-- 認証済みユーザーのみアップロード可
CREATE POLICY "marketing_authenticated_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'marketing');

-- 認証済みユーザーのみ更新可
CREATE POLICY "marketing_authenticated_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'marketing');

-- 認証済みユーザーのみ削除可
CREATE POLICY "marketing_authenticated_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'marketing');
