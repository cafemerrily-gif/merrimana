-- ============================================================
-- Merrimana Café 権限管理スキーマ
-- Supabase SQL Editor で実行してください
-- ============================================================

CREATE TABLE IF NOT EXISTS unit_permissions (
  unit          TEXT NOT NULL,
  permission_id TEXT NOT NULL,
  PRIMARY KEY (unit, permission_id)
);

-- 初期シードデータ（roles/page.tsx の MATRIX から移植）
INSERT INTO unit_permissions (unit, permission_id) VALUES
  ('会計・経営戦略', 'view_dashboard'),
  ('会計・経営戦略', 'view_accounting'),
  ('会計・経営戦略', 'edit_accounting'),
  ('会計・経営戦略', 'view_products'),
  ('会計・経営戦略', 'view_marketing'),
  ('会計・経営戦略', 'view_store'),

  ('商品開発', 'view_dashboard'),
  ('商品開発', 'view_products'),
  ('商品開発', 'edit_products'),
  ('商品開発', 'view_accounting'),

  ('広報・マーケティング', 'view_dashboard'),
  ('広報・マーケティング', 'view_marketing'),
  ('広報・マーケティング', 'edit_marketing'),
  ('広報・マーケティング', 'view_products'),

  ('システム', 'view_dashboard'),
  ('システム', 'view_accounting'),
  ('システム', 'view_products'),
  ('システム', 'view_marketing'),
  ('システム', 'view_store'),
  ('システム', 'manage_users'),
  ('システム', 'manage_master'),

  ('店舗スタッフ', 'view_dashboard'),
  ('店舗スタッフ', 'view_store'),
  ('店舗スタッフ', 'edit_store'),
  ('店舗スタッフ', 'view_products')
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE unit_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_read" ON unit_permissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_write" ON unit_permissions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
