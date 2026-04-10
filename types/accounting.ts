export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  date: string;
  time_slot: string | null;
  amount: number;
  customer_count: number;
  notes: string;
  created_at: string;
  sale_items: SaleItem[];
}

export interface ProductForSale {
  id: string;
  name: string;
  price: number;
  status: string;
  sale_start: string | null;
  sale_end: string | null;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  vendor: string;
  amount: number;
  created_at: string;
}

export interface Budget {
  id: string;
  year: number;
  month: number;
  category: string;
  amount: number;
}

export interface MonthlySale {
  month: string;  // "YYYY-MM"
  label: string;  // "4月"
  amount: number;
  customerCount: number;
}

export const EXPENSE_CATEGORIES = [
  "原材料費",
  "人件費",
  "家賃",
  "光熱費",
  "消耗品費",
  "修繕費",
  "その他経費",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const BUDGET_CATEGORIES = ["売上高", ...EXPENSE_CATEGORIES] as const;

export const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  原材料費: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  人件費: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  家賃: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  光熱費: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  消耗品費: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  修繕費: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  その他経費: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};
