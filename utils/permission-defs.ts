export const PERMISSION_DEFS = [
  { id: "view_dashboard",  label: "ダッシュボード閲覧" },
  { id: "view_accounting", label: "会計データ閲覧" },
  { id: "edit_accounting", label: "会計データ編集" },
  { id: "view_products",   label: "商品・レシピ閲覧" },
  { id: "edit_products",   label: "商品・レシピ編集" },
  { id: "view_marketing",  label: "広報データ閲覧" },
  { id: "edit_marketing",  label: "広報データ編集" },
  { id: "view_store",      label: "店舗データ閲覧" },
  { id: "edit_store",      label: "店舗データ編集" },
  { id: "manage_users",    label: "ユーザー管理" },
  { id: "manage_master",   label: "マスタ設定変更" },
] as const;

export type PermissionId = (typeof PERMISSION_DEFS)[number]["id"];
