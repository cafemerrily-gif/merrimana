export type TrialCategory = "ドリンク" | "フード" | "スイーツ";

export const TRIAL_CATEGORIES: TrialCategory[] = ["ドリンク", "フード", "スイーツ"];

export const CATEGORY_COLOR: Record<TrialCategory, { bg: string; border: string; badge: string; accent: string }> = {
  ドリンク: {
    bg:     "bg-[#EAF4FB] dark:bg-[#0d2233]",
    border: "border-[#A8D8EA] dark:border-[#1a4a6a]",
    badge:  "bg-[#A8D8EA] text-[#1a4a6a] dark:bg-[#1a4a6a] dark:text-[#A8D8EA]",
    accent: "bg-[#A8D8EA] dark:bg-[#1a4a6a]",
  },
  フード: {
    bg:     "bg-[#F0F8EE] dark:bg-[#0d2010]",
    border: "border-[#C9E4C5] dark:border-[#2a5a26]",
    badge:  "bg-[#C9E4C5] text-[#2a5a26] dark:bg-[#2a5a26] dark:text-[#C9E4C5]",
    accent: "bg-[#C9E4C5] dark:bg-[#2a5a26]",
  },
  スイーツ: {
    bg:     "bg-[#FEF4F0] dark:bg-[#2a1008]",
    border: "border-[#F9D9CA] dark:border-[#6a2a18]",
    badge:  "bg-[#F9D9CA] text-[#6a2a18] dark:bg-[#6a2a18] dark:text-[#F9D9CA]",
    accent: "bg-[#F9D9CA] dark:bg-[#6a2a18]",
  },
};

export type TrialIngredient = {
  id?: string;
  name: string;
  amount_g: number;
  cost: number;
  sort_order: number;
};

export type TrialPurchase = {
  id?: string;
  material: string;
  amount: number;
  cost_per_g: number;
  supplier: string;
  sort_order: number;
};

export type ProductTrial = {
  id: string;
  name: string;
  category: TrialCategory;
  concept: string;
  target: string;
  pr_points: string;
  desired_price: number;
  packaging_cost: number;
  prep_notes: string;
  steps: string[];
  good_points: string;
  concerns: string;
  improvements: string;
  created_at: string;
  updated_at: string;
  product_trial_ingredients?: TrialIngredient[];
  product_trial_purchases?: TrialPurchase[];
};
